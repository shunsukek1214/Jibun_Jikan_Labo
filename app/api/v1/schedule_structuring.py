import json
import logging
import tempfile
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.schedule import Schedule
from app.schemas.schedule_structuring import (
    ScheduleStructuringResponse,
    TaskItem,
)
from app.services.openai_service import OpenAIService, OpenAIServiceError, get_openai_service
from app.services.speech_service import SpeechService, SpeechToTextError, get_speech_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/createTomorrowSchedule", response_model=ScheduleStructuringResponse)
async def create_tomorrow_schedule(
    user_id: int = Form(...),
    target_date: date = Form(...),
    raw_text: Optional[str] = Form(default=None),
    audio_file: Optional[UploadFile] = File(default=None),
    db: Session = Depends(get_db),
    speech_service: SpeechService = Depends(get_speech_service),
    openai_service: OpenAIService = Depends(get_openai_service),
) -> ScheduleStructuringResponse:
    """明日の予定・タスクを構造化する（図4対応）

    - 音声ファイル（audio_file）またはテキスト（raw_text）のいずれかを受け付ける
    - Speech to Textでテキスト化 → Azure OpenAIで予定・タスクへ構造化 → DB保存
    - Googleカレンダーへの書き込みは他モジュール（Googleカレンダー連携担当）の責務のため、
      本APIはDB保存までとし、構造化結果（tasks）をレスポンスとして返す
    """
    if not raw_text and not audio_file:
        raise HTTPException(
            status_code=400, detail="raw_text または audio_file のいずれかが必要です。"
        )

    transcribed_text = raw_text

    if audio_file is not None:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            content = await audio_file.read()
            tmp.write(content)
            tmp_path = tmp.name
        try:
            transcribed_text = speech_service.transcribe_audio_file(tmp_path)
        except SpeechToTextError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        finally:
            import os
            try:
                os.unlink(tmp_path)
            except OSError:
                logger.warning(f"一時ファイルの削除に失敗しました: {tmp_path}")

    if not transcribed_text:
        raise HTTPException(status_code=422, detail="テキストを取得できませんでした。")

    try:
        structured = openai_service.structure_tomorrow_schedule(transcribed_text)
    except OpenAIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    summary = structured.get("summary", "")
    tasks_raw = structured.get("tasks", [])

    schedule = Schedule(
        user_id=user_id,
        target_date=target_date,
        raw_text=transcribed_text,
        summary=json.dumps(structured, ensure_ascii=False),
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    tasks = [TaskItem(**task) for task in tasks_raw]

    return ScheduleStructuringResponse(
        schedule_id=schedule.id,
        target_date=target_date,
        raw_text=transcribed_text,
        summary=summary,
        tasks=tasks,
    )