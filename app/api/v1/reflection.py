import json
import logging
import os
import tempfile
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.reflection import Reflection
from app.models.schedule import Schedule
from app.models.task import Task
from app.models.user import User
from app.schemas.reflection import ProposedScheduleChangeItem, ReflectionResponse
from app.services.google_calendar_service import (
    GoogleCalendarError,
    list_events_for_date,
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


def _get_suffix(audio_file: UploadFile) -> str:
    if audio_file.filename:
        extension = os.path.splitext(audio_file.filename)[1]
        if extension:
            return extension

    return {
        "audio/webm": ".webm",
        "audio/wav": ".wav",
        "audio/ogg": ".ogg",
        "audio/mp4": ".mp4",
        "audio/mpeg": ".mp3",
    }.get(audio_file.content_type, ".webm")


def _build_db_context(
    db: Session,
    user_id: int,
    reflection_date: date,
) -> tuple[str, str]:
    schedule = db.scalar(
        select(Schedule)
        .where(
            Schedule.user_id == user_id,
            Schedule.target_date == reflection_date,
        )
        .order_by(Schedule.updated_at.desc(), Schedule.id.desc())
    )

    if schedule is None:
        return "", ""

    tasks = list(
        db.scalars(
            select(Task)
            .where(Task.schedule_id == schedule.id)
            .order_by(Task.start_time.asc(), Task.id.asc())
        )
    )

    task_lines = []
    for task in tasks:
        start = task.start_time.strftime("%H:%M") if task.start_time else "時刻未定"
        end = task.end_time.strftime("%H:%M") if task.end_time else ""
        time_text = f"{start}-{end}" if end else start
        task_lines.append(f"{time_text} {task.title} status={task.status}")

    return schedule.summary or "", "\n".join(task_lines)


@router.post("/reflection", response_model=ReflectionResponse)
async def create_reflection(
    reflection_date: date = Form(...),
    proposal_date: date = Form(...),
    raw_text: Optional[str] = Form(default=None),
    audio_file: Optional[UploadFile] = File(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    speech_service: SpeechService = Depends(get_speech_service),
    openai_service: OpenAIService = Depends(get_openai_service),
) -> ReflectionResponse:
    """DBとGoogleカレンダーから本人の予定を取得して振り返りを作成します。"""

    if not raw_text and not audio_file:
        raise HTTPException(
            status_code=400,
            detail="raw_textまたはaudio_fileのいずれかが必要です。",
        )

    transcribed_text = raw_text

    if audio_file is not None:
        with tempfile.NamedTemporaryFile(
            suffix=_get_suffix(audio_file),
            delete=False,
        ) as tmp:
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

    schedule_summary, tasks_summary = _build_db_context(
        db,
        current_user.id,
        reflection_date,
    )

    try:
        calendar_events = list_events_for_date(
            db,
            current_user.id,
            reflection_date,
        )
    except GoogleCalendarError as exc:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "google_calendar_unavailable",
                "message": str(exc),
            },
        ) from exc

    calendar_events_summary = "\n".join(
        f"{event['start']} - {event['end']} {event['title']}"
        for event in calendar_events
    )

    try:
        analyzed = openai_service.analyze_reflection(
            raw_text=transcribed_text,
            schedule_summary=schedule_summary,
            tasks_summary=tasks_summary,
            calendar_events_summary=calendar_events_summary,
        )
    except OpenAIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    proposed_raw = analyzed.get("proposed_schedule_change", [])

    try:
        proposed = [ProposedScheduleChangeItem(**item) for item in proposed_raw]
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="AIが返した予定修正案の形式が不正です。",
        ) from exc

    reflection = Reflection(
        user_id=current_user.id,
        reflection_date=reflection_date,
        proposal_date=proposal_date,
        raw_text=transcribed_text,
        reflection_summary=analyzed.get("reflection_summary", ""),
        gap_analysis=analyzed.get("gap_analysis", ""),
        gap_reason=analyzed.get("gap_reason", ""),
        today_key_point=analyzed.get("today_key_point", ""),
        proposed_schedule_change=json.dumps(proposed_raw, ensure_ascii=False),
    )
    db.add(reflection)

    try:
        db.commit()
        db.refresh(reflection)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="振り返り結果のDB保存に失敗しました。",
        ) from exc

    return ReflectionResponse(
        reflection_id=reflection.id,
        reflection_date=reflection_date,
        proposal_date=proposal_date,
        raw_text=transcribed_text,
        reflection_summary=reflection.reflection_summary or "",
        gap_analysis=reflection.gap_analysis or "",
        gap_reason=reflection.gap_reason or "",
        today_key_point=reflection.today_key_point or "",
        proposed_schedule_change=proposed,
    )
