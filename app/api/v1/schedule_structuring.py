import logging
import os
import tempfile
from datetime import date, time, datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, Query
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.schedule import Schedule
from app.models.task import Task
from app.models.user import User
from app.models.reflection import Reflection
from app.schemas.schedule_structuring import (
    ScheduleStructuringResponse,
    TaskItem,
    ScheduleResponse,
    TaskResponseItem,
    TaskStatusUpdateRequest,
)
from app.services.openai_service import (
    OpenAIService,
    OpenAIServiceError,
    get_openai_service,
)
from app.services.speech_service import (
    SpeechService,
    SpeechToTextError,
    get_speech_service,
)


logger = logging.getLogger(__name__)
router = APIRouter()


def _parse_optional_time(value: str | None) -> time | None:
    """AIのHH:MMまたはHH:MM:SSをMySQL TIME用へ変換します。"""
    if not value:
        return None

    try:
        return time.fromisoformat(value)
    except ValueError as exc:
        raise ValueError(f"時刻形式が不正です: {value}") from exc


@router.post(
    "/createTomorrowSchedule",
    response_model=ScheduleStructuringResponse,
)
async def create_tomorrow_schedule(
    target_date: date = Form(...),
    raw_text: Optional[str] = Form(default=None),
    audio_file: Optional[UploadFile] = File(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    speech_service: SpeechService = Depends(get_speech_service),
    openai_service: OpenAIService = Depends(get_openai_service),
) -> ScheduleStructuringResponse:
    """ログイン中ユーザーの明日の予定とタスクを構造化して保存します。"""

    if not raw_text and not audio_file:
        raise HTTPException(
            status_code=400,
            detail="raw_textまたはaudio_fileのいずれかが必要です。",
        )

    transcribed_text = raw_text

    if audio_file is not None:
        suffix = os.path.splitext(audio_file.filename or "")[1] or ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(await audio_file.read())
            tmp_path = tmp.name

        try:
            transcribed_text = speech_service.transcribe_audio_file(tmp_path)
        except SpeechToTextError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                logger.warning("一時音声ファイルを削除できませんでした。")

    if not transcribed_text:
        raise HTTPException(status_code=422, detail="テキストを取得できませんでした。")

    try:
        structured = openai_service.structure_tomorrow_schedule(transcribed_text)
        summary = str(structured.get("summary", ""))
        tasks = [TaskItem(**item) for item in structured.get("tasks", [])]
    except (OpenAIServiceError, ValidationError, TypeError) as exc:
        raise HTTPException(
            status_code=502,
            detail="AIによる予定構造化に失敗しました。",
        ) from exc

    # 同じ (user_id, target_date) のスケジュールが既に存在する場合は上書き更新する。
    # INSERT すると uq_schedules_user_date 制約違反になるため upsert にする。
    existing_schedule = db.scalar(
        select(Schedule).where(
            Schedule.user_id == current_user.id,
            Schedule.target_date == target_date,
        )
    )

    if existing_schedule is not None:
        # 既存スケジュールを更新する
        existing_schedule.raw_text = transcribed_text
        existing_schedule.summary = summary
        schedule = existing_schedule

        # 既存タスクを削除して再登録する（差分更新より安全）
        old_tasks = list(
            db.scalars(select(Task).where(Task.schedule_id == schedule.id))
        )
        for old_task in old_tasks:
            db.delete(old_task)
        db.flush()
    else:
        schedule = Schedule(
            user_id=current_user.id,
            target_date=target_date,
            raw_text=transcribed_text,
            summary=summary,
        )
        db.add(schedule)

    try:
        db.flush()

        for item in tasks:
            db.add(
                Task(
                    schedule_id=schedule.id,
                    title=item.title,
                    start_time=_parse_optional_time(item.start_time),
                    end_time=_parse_optional_time(item.end_time),
                    priority=item.priority,
                    estimated_minutes=item.estimated_minutes,
                    status="pending",
                )
            )

        db.commit()
        db.refresh(schedule)
    except Exception as exc:
        # 失敗したDB処理を取り消す
        db.rollback()

        # ターミナルへ本当のエラー内容とTracebackを表示する
        logger.exception(
            "予定とタスクのDB保存に失敗しました。"
        )

        raise HTTPException(
            status_code=500,
            detail="予定とタスクのDB保存に失敗しました。",
        ) from exc

    return ScheduleStructuringResponse(
        schedule_id=schedule.id,
        target_date=target_date,
        raw_text=transcribed_text,
        summary=summary,
        tasks=tasks,
    )



@router.get("/schedule", response_model=ScheduleResponse)
def get_schedule(
    target_date: Optional[date] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ScheduleResponse:
    """指定日のスケジュール、タスク一覧、重点ポイントを取得します。"""

    if target_date is None:
        from zoneinfo import ZoneInfo
        from app.core.config import settings

        jst = ZoneInfo(settings.app_timezone)
        target_date = datetime.now(jst).date()

    schedule = db.scalar(
        select(Schedule)
        .where(
            Schedule.user_id == current_user.id,
            Schedule.target_date == target_date,
        )
        .order_by(Schedule.updated_at.desc(), Schedule.id.desc())
    )
    if schedule is None:
        raise HTTPException(
            status_code=404,
            detail="指定日のスケジュールが見つかりません。",
        )

    tasks = list(
        db.scalars(
            select(Task)
            .where(Task.schedule_id == schedule.id)
            .order_by(Task.start_time.asc(), Task.id.asc())
        )
    )

    reflection = db.scalar(
        select(Reflection)
        .where(
            Reflection.user_id == current_user.id,
            Reflection.proposal_date == target_date,
        )
        .order_by(Reflection.updated_at.desc(), Reflection.id.desc())
    )
    today_key_point = reflection.today_key_point if reflection else None

    return ScheduleResponse(
        schedule_id=schedule.id,
        target_date=target_date,
        summary=schedule.summary,
        tasks=tasks,
        today_key_point=today_key_point,
    )


@router.patch("/tasks/{task_id}/status", response_model=TaskResponseItem)
def update_task_status(
    task_id: int,
    body: TaskStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskResponseItem:
    """タスクの完了ステータスを更新します。"""

    task = db.scalar(
        select(Task)
        .join(Schedule, Schedule.id == Task.schedule_id)
        .where(
            Task.id == task_id,
            Schedule.user_id == current_user.id,
        )
    )
    if task is None:
        raise HTTPException(
            status_code=404,
            detail="タスクが見つからないか、編集権限がありません。",
        )

    if body.status not in ["completed", "pending"]:
        raise HTTPException(
            status_code=400,
            detail="ステータスは 'completed' または 'pending' を指定してください。",
        )

    task.status = body.status
    if body.status == "completed":
        from datetime import timezone

        task.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
    else:
        task.completed_at = None

    try:
        db.commit()
        db.refresh(task)
    except Exception as exc:
        db.rollback()
        logger.exception("タスクステータスの更新に失敗しました。")
        raise HTTPException(
            status_code=500,
            detail="タスクステータスの更新に失敗しました。",
        ) from exc

    return task

