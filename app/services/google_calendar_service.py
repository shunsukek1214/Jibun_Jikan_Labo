import datetime
import logging
from typing import Optional

from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from app.core.config import get_settings

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]

# 開発用の簡易フローストア（本番ではセッション/DBに紐付ける想定）
_flow_store: dict[str, Flow] = {}


class GoogleCalendarServiceError(Exception):
  """Googleカレンダー連携に関するエラー"""


def _build_client_config() -> dict:
  settings = get_settings()
  return {
    "web": {
      "client_id": settings.google_client_id,
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_secret": settings.google_client_secret,
      "redirect_uris": [settings.google_redirect_uri],
    }
  }


def build_authorization_url() -> str:
  """Google認証画面のURLを生成し、flowを保持する"""
  settings = get_settings()
  flow = Flow.from_client_config(
    _build_client_config(),
    scopes=SCOPES,
    redirect_uri=settings.google_redirect_uri,
  )
  authorization_url, _state = flow.authorization_url(
    access_type="offline",
    include_granted_scopes="true",
    prompt="consent",
  )
  _flow_store["flow"] = flow
  return authorization_url


def fetch_token(authorization_response_url: str) -> None:
  """コールバックURLからトークンを取得する"""
  flow = _flow_store.get("flow")
  if not flow:
    raise GoogleCalendarServiceError(
      "セッション切れです。認証をやり直してください。"
    )
  flow.fetch_token(authorization_response=authorization_response_url)


def get_calendar_events(
  time_min: Optional[str] = None, time_max: Optional[str] = None
) -> list[dict]:
  """Googleカレンダーから予定を取得する"""
  flow = _flow_store.get("flow")
  if not flow or not hasattr(flow, "credentials"):
    raise GoogleCalendarServiceError("認証されていません。")

  service = build("calendar", "v3", credentials=flow.credentials)

  if not time_min:
    time_min = datetime.datetime.now(datetime.timezone.utc).isoformat()

  try:
    events_result = (
      service.events()
      .list(
        calendarId="primary",
        timeMin=time_min,
        timeMax=time_max,
        maxResults=10,
        singleEvents=True,
        orderBy="startTime",
      )
      .execute()
    )
  except Exception as exc:
    logger.error(f"カレンダー情報の取得に失敗しました: {exc}")
    raise GoogleCalendarServiceError(
      "カレンダー情報の取得中にエラーが発生しました。"
    ) from exc

  formatted_events = []
  for event in events_result.get("items", []):
    start = event["start"].get("dateTime", event["start"].get("date"))
    end = event["end"].get("dateTime", event["end"].get("date"))
    formatted_events.append(
      {
        "summary": event.get("summary", "タイトルなし"),
        "start": start,
        "end": end,
      }
    )
  return formatted_events