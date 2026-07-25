from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_session_token, utc_now_naive
from app.db.session import get_db
from app.models.app_session import AppSession
from app.models.user import User


@dataclass(frozen=True)
class AuthSessionContext:
    user: User
    session: AppSession


def get_current_session(
    request: Request,
    db: Session = Depends(get_db),
) -> AuthSessionContext:
    """HttpOnly Cookieからログイン中ユーザーを特定します。"""

    raw_token = request.cookies.get(settings.session_cookie_name)

    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ログインが必要です。",
        )

    session_hash = hash_session_token(raw_token)
    app_session = db.get(AppSession, session_hash)

    if app_session is None or app_session.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ログインセッションが無効です。",
        )

    if app_session.expires_at <= utc_now_naive():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ログインセッションの有効期限が切れています。",
        )

    user = db.get(User, app_session.user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ログインユーザーが存在しません。",
        )

    return AuthSessionContext(user=user, session=app_session)


def get_current_user(
    auth: AuthSessionContext = Depends(get_current_session),
) -> User:
    """各APIから共通利用するログインユーザー依存関係です。"""
    return auth.user
