from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Callable
from zoneinfo import ZoneInfo

from google.auth.exceptions import RefreshError
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    TokenDecryptionError,
    decrypt_token,
    encrypt_token,
)
from app.models.google_account import GoogleAccount
from app.services.google_oauth_service import (
    GOOGLE_SCOPES,
    GOOGLE_TOKEN_ENDPOINT,
)


class GoogleCalendarError(RuntimeError):
    """Google Calendar APIの一般エラーです。"""


class GoogleCalendarNotConnectedError(GoogleCalendarError):
    """Google連携情報がない場合です。"""


class GoogleReauthorizationRequiredError(GoogleCalendarError):
    """権限取消やrefresh_token失効により再認可が必要な場合です。"""


class GoogleCalendarPermissionError(GoogleCalendarError):
    """スコープ不足または書込権限不足の場合です。"""


def _as_utc_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _load_account(db: Session, user_id: int) -> GoogleAccount:
    account = db.scalar(
        select(GoogleAccount).where(GoogleAccount.user_id == user_id)
    )
    if account is None:
        raise GoogleCalendarNotConnectedError(
            "Googleカレンダーが連携されていません。"
        )
    return account


def _build_credentials(account: GoogleAccount) -> Credentials:
    try:
        access_token = decrypt_token(account.access_token)
        refresh_token = decrypt_token(account.refresh_token)
    except TokenDecryptionError as exc:
        raise GoogleReauthorizationRequiredError(
            "Googleトークンを復号できません。再ログインしてください。"
        ) from exc

    if not access_token:
        raise GoogleReauthorizationRequiredError(
            "Googleアクセストークンがありません。"
        )

    scopes = account.scope.split() if account.scope else GOOGLE_SCOPES

    return Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri=GOOGLE_TOKEN_ENDPOINT,
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        scopes=scopes,
        expiry=_as_utc_aware(account.expires_at),
    )


def _save_refreshed_credentials(
    db: Session,
    account: GoogleAccount,
    credentials: Credentials,
) -> None:
    """更新されたトークンと有効期限だけをDBへ反映します。"""
    changed = False

    if credentials.token and decrypt_token(account.access_token) != credentials.token:
        account.access_token = encrypt_token(credentials.token) or ""
        changed = True

    if (
        credentials.refresh_token
        and decrypt_token(account.refresh_token) != credentials.refresh_token
    ):
        account.refresh_token = encrypt_token(credentials.refresh_token)
        changed = True

    if credentials.expiry:
        expiry_naive = credentials.expiry.astimezone(timezone.utc).replace(tzinfo=None)
        if account.expires_at != expiry_naive:
            account.expires_at = expiry_naive
            changed = True

    if changed:
        db.commit()


def _refresh_credentials(
    db: Session,
    account: GoogleAccount,
    credentials: Credentials,
) -> None:
    if not credentials.refresh_token:
        raise GoogleReauthorizationRequiredError(
            "refresh_tokenがありません。Googleへ再同意してください。"
        )

    try:
        credentials.refresh(GoogleRequest())
    except RefreshError as exc:
        raise GoogleReauthorizationRequiredError(
            "Googleの認可が失効しています。再ログインしてください。"
        ) from exc

    _save_refreshed_credentials(db, account, credentials)


def get_valid_credentials(
    db: Session,
    user_id: int,
) -> tuple[GoogleAccount, Credentials]:
    """期限を確認し、必要ならrefresh_tokenで自動更新します。"""

    account = _load_account(db, user_id)
    credentials = _build_credentials(account)

    # 通信中の期限切れを避けるため60秒前から更新します。
    if credentials.expiry <= datetime.now(timezone.utc) + timedelta(seconds=60):
        _refresh_credentials(db, account, credentials)

    return account, credentials


def _execute_with_one_refresh_retry(
    db: Session,
    account: GoogleAccount,
    credentials: Credentials,
    request_factory: Callable[[Credentials], Any],
) -> dict[str, Any]:
    try:
        result = request_factory(credentials).execute()
    except HttpError as exc:
        status_code = int(getattr(exc.resp, "status", 0))

        if status_code == 401:
            _refresh_credentials(db, account, credentials)
            try:
                result = request_factory(credentials).execute()
            except HttpError as retry_exc:
                raise GoogleReauthorizationRequiredError(
                    "Googleの認可が無効です。再ログインしてください。"
                ) from retry_exc
        elif status_code == 403:
            raise GoogleCalendarPermissionError(
                "Google Calendar APIの権限が不足しています。"
            ) from exc
        else:
            raise GoogleCalendarError(
                "Google Calendar APIの呼び出しに失敗しました。"
            ) from exc

    # google-api-python-client側で更新された場合にもDBへ反映します。
    if credentials.expiry and credentials.token:
        _save_refreshed_credentials(db, account, credentials)

    return result


def list_events_for_date(
    db: Session,
    user_id: int,
    target_date: date,
) -> list[dict[str, Any]]:
    """primaryカレンダーの指定日予定をAsia/Tokyo基準で取得します。"""

    account, credentials = get_valid_credentials(db, user_id)
    jst = ZoneInfo(settings.app_timezone)
    start_local = datetime.combine(target_date, time.min, tzinfo=jst)
    end_local = start_local + timedelta(days=1)

    def request_factory(current_credentials: Credentials):
        service = build(
            "calendar",
            "v3",
            credentials=current_credentials,
            cache_discovery=False,
        )
        return service.events().list(
            calendarId="primary",
            timeMin=start_local.isoformat(),
            timeMax=end_local.isoformat(),
            singleEvents=True,
            orderBy="startTime",
            timeZone=settings.app_timezone,
            maxResults=2500,
        )

    result = _execute_with_one_refresh_retry(
        db,
        account,
        credentials,
        request_factory,
    )

    events: list[dict[str, Any]] = []
    for item in result.get("items", []):
        start_data = item.get("start", {})
        end_data = item.get("end", {})
        all_day = "date" in start_data

        events.append(
            {
                "google_event_id": item.get("id", ""),
                "title": item.get("summary", "（タイトルなし）"),
                "start": start_data.get("dateTime") or start_data.get("date", ""),
                "end": end_data.get("dateTime") or end_data.get("date", ""),
                "all_day": all_day,
                "html_link": item.get("htmlLink"),
                "status": item.get("status"),
            }
        )

    return events


def create_calendar_event(
    db: Session,
    user_id: int,
    title: str,
    start: datetime,
    end: datetime,
    description: str | None,
) -> dict[str, Any]:
    """primaryカレンダーへ予定を1件登録します。"""

    account, credentials = get_valid_credentials(db, user_id)
    jst = ZoneInfo(settings.app_timezone)

    if start.tzinfo is None:
        start = start.replace(tzinfo=jst)
    else:
        start = start.astimezone(jst)

    if end.tzinfo is None:
        end = end.replace(tzinfo=jst)
    else:
        end = end.astimezone(jst)

    body: dict[str, Any] = {
        "summary": title,
        "start": {
            "dateTime": start.isoformat(),
            "timeZone": settings.app_timezone,
        },
        "end": {
            "dateTime": end.isoformat(),
            "timeZone": settings.app_timezone,
        },
    }

    if description:
        body["description"] = description

    def request_factory(current_credentials: Credentials):
        service = build(
            "calendar",
            "v3",
            credentials=current_credentials,
            cache_discovery=False,
        )
        return service.events().insert(
            calendarId="primary",
            body=body,
        )

    return _execute_with_one_refresh_retry(
        db,
        account,
        credentials,
        request_factory,
    )
