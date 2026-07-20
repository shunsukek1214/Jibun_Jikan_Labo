import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.reflection import ReflectionResponse
from app.services.openai_service import OpenAIService, get_openai_service
from app.services.speech_service import SpeechService, get_speech_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/reflection2")
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
):
  """振り返り機能（図5対応）※テスト用固定レスポンス版

  実際の処理は行わず、固定のJSONメッセージのみを返す。
  """
  return {"message": "おつかれさまでした。今日も１日頑張りましょう。"}