import json
import logging
import os
import tempfile
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.reflection import Reflection
from app.schemas.reflection import (
    ProposedScheduleChangeItem,
    ReflectionResponse,
)
from app.services.openai_service import OpenAIService, OpenAIServiceError, get_openai_service
from app.services.speech_service import SpeechService, SpeechToTextError, get_speech_service

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_suffix(audio_file: UploadFile) -> str:
  """アップロードされた音声ファイルの拡張子を推定する（既定はwebm）"""
  if audio_file.filename:
    ext = os.path.splitext(audio_file.filename)[1]
    if ext:
      return ext
  content_type_map = {
    "audio/webm": ".webm",
    "audio/wav": ".wav",
    "audio/ogg": ".ogg",
    "audio/mp4": ".mp4",
    "audio/mpeg": ".mp3",
  }
  return content_type_map.get(audio_file.content_type, ".webm")


@router.post("/reflection", response_model=ReflectionResponse)
async def create_reflection(
    user_id: int = Form(...),
    reflection_date: date = Form(...),
    proposal_date: date = Form(...),
    raw_text: Optional[str] = Form(default=None),
    schedule_summary: Optional[str] = Form(default=None),
    tasks_summary: Optional[str] = Form(default=None),
    calendar_events_summary: Optional[str] = Form(default=None),
    audio_file: Optional[UploadFile] = File(default=None),
    db: Session = Depends(get_db),
    speech_service: SpeechService = Depends(get_speech_service),
    openai_service: OpenAIService = Depends(get_openai_service),
) -> ReflectionResponse:
    """振り返り機能（図5対応）

    - 音声ファイル（audio_file）またはテキスト（raw_text）のいずれかを受け付ける
    - schedule_summary/tasks_summary/calendar_events_summaryは、
      DB（schedules/tasks）およびGoogleカレンダー連携モジュールから
      取得済みの情報を、他モジュールから受け取る前提のインターフェースとして
      保持している（他モジュール連携のインターフェースとして使用される想定）
    """
    if not raw_text and not audio_file:
        raise HTTPException(
            status_code=400, detail="raw_text または audio_file のいずれかが必要です。"
        )

    transcribed_text = raw_text

    if audio_file is not None:
        suffix = _get_suffix(audio_file)
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            content = await audio_file.read()
            tmp.write(content)
            tmp_path = tmp.name
        try:
            transcribed_text = speech_service.transcribe_audio_file(tmp_path)
        except SpeechToTextError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                logger.warning(f"一時ファイルの削除に失敗しました: {tmp_path}")

    if not transcribed_text:
        raise HTTPException(status_code=422, detail="テキストを取得できませんでした。")

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

    reflection = Reflection(
        user_id=user_id,
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
    db.commit()
    db.refresh(reflection)

    proposed = [ProposedScheduleChangeItem(**item) for item in proposed_raw]

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