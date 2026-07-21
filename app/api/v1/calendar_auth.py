from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

from app.services.google_calendar_service import (
  GoogleCalendarServiceError,
  build_authorization_url,
  fetch_token,
)

router = APIRouter()


@router.get("/calendar/auth/start")
def google_auth_start():
  """Googleの認証画面へリダイレクトするエンドポイント"""
  authorization_url = build_authorization_url()
  return RedirectResponse(url=authorization_url)


@router.get("/calendar/auth/callback")
def google_auth_callback(request: Request):
  """トークンを取得するエンドポイント"""
  try:
    fetch_token(str(request.url))
  except GoogleCalendarServiceError as exc:
    return {"status": "error", "message": str(exc)}

  return {"status": "success", "message": "認証成功！/calendar/events で予定を取得できます。"}