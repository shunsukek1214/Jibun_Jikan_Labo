import logging
from datetime import timedelta
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse, Response
from sqlalchemy import select
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.core.security import (
    create_random_token,
    delete_session_cookie,
    hash_session_token,
    set_session_cookie,
    utc_now_naive,
)
from app.db.session import get_db
from app.dependencies.auth import AuthSessionContext, get_current_session, get_current_user
from app.models.app_session import AppSession
from app.models.google_account import GoogleAccount
from app.models.google_oauth_state import GoogleOAuthState
from app.models.user import User
from app.schemas.auth import CurrentUserResponse
from app.services.google_oauth_service import (
    GoogleAccountConflictError,
    GoogleOAuthError,
    create_authorization_request,
    exchange_authorization_code,
    upsert_google_user,
    verify_google_id_token,
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["認証"])


def _error_redirect(error_code: str) -> RedirectResponse:
    query = urlencode({"auth_error": error_code})
    return RedirectResponse(
        url=f"{settings.frontend_auth_error_url}?{query}",
        status_code=302,
    )


@router.get("/google/start")
def start_google_login(
    force_consent: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> RedirectResponse:
    """Google OAuth認可コードフローを開始します。"""
    authorization_url = create_authorization_request(db, force_consent)
    return RedirectResponse(url=authorization_url, status_code=302)


@router.get("/google/callback")
async def google_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
) -> RedirectResponse:
    """Googleから戻った認可コードを検証し、アプリセッションを作成します。"""

    if not state:
        return _error_redirect("invalid_state")

    oauth_state = db.get(GoogleOAuthState, state)

    if oauth_state is None or oauth_state.used_at is not None:
        return _error_redirect("invalid_state")

    if oauth_state.expires_at <= utc_now_naive():
        oauth_state.used_at = utc_now_naive()
        db.commit()
        return _error_redirect("expired_state")

    # 認可コード交換の成否にかかわらずstateを一度だけにします。
    oauth_state.used_at = utc_now_naive()
    db.commit()

    if error:
        return _error_redirect("access_denied")

    if not code:
        return _error_redirect("missing_code")

    try:
        token_data = await exchange_authorization_code(
            code=code,
            code_verifier=oauth_state.code_verifier,
        )
        identity = await run_in_threadpool(
            verify_google_id_token,
            token_data.id_token,
            oauth_state.nonce,
        )

        user, google_account = upsert_google_user(
            db,
            identity,
            token_data,
        )

        # 初回にrefresh_tokenが返らず、DBにも保存済み値がない場合は
        # force_consent=trueで再認可してもらいます。
        if google_account.refresh_token is None:
            db.rollback()
            return _error_redirect("missing_refresh_token")

        raw_session_token = create_random_token()
        app_session = AppSession(
            session_hash=hash_session_token(raw_session_token),
            user_id=user.id,
            expires_at=(
                utc_now_naive()
                + timedelta(days=settings.session_ttl_days)
            ),
        )
        db.add(app_session)
        db.commit()

    except GoogleAccountConflictError:
        db.rollback()
        logger.warning("Googleアカウントの紐付け競合が発生しました。")
        return _error_redirect("account_conflict")
    except GoogleOAuthError:
        db.rollback()
        logger.warning("Google認証処理を完了できませんでした。")
        return _error_redirect("google_auth_failed")
    except Exception:
        db.rollback()
        logger.exception("Google認証処理中に予期しないエラーが発生しました。")
        return _error_redirect("internal_error")

    response = RedirectResponse(
        url=settings.frontend_after_login_url,
        status_code=302,
    )
    set_session_cookie(response, raw_session_token)
    return response


@router.get("/me", response_model=CurrentUserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CurrentUserResponse:
    """ログイン中ユーザーを返します。"""

    calendar_connected = db.scalar(
        select(GoogleAccount.id).where(
            GoogleAccount.user_id == current_user.id,
            GoogleAccount.refresh_token.is_not(None),
        )
    ) is not None

    return CurrentUserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        calendar_connected=calendar_connected,
    )


@router.post("/logout", status_code=204)
def logout(
    auth: AuthSessionContext = Depends(get_current_session),
    db: Session = Depends(get_db),
) -> Response:
    """現在のアプリセッションを失効させ、Cookieを削除します。"""

    auth.session.revoked_at = utc_now_naive()
    db.commit()

    response = Response(status_code=204)
    delete_session_cookie(response)
    return response
