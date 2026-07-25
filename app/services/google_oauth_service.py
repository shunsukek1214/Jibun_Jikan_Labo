import hmac
from dataclasses import dataclass
from datetime import datetime, timedelta
from urllib.parse import urlencode

import httpx
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token as google_id_token
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    build_pkce_code_challenge,
    create_oauth_random_value,
    create_pkce_code_verifier,
    encrypt_token,
    utc_now_naive,
)
from app.models.google_account import GoogleAccount
from app.models.google_oauth_state import GoogleOAuthState
from app.models.user import User


GOOGLE_AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
GOOGLE_SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar.events.owned",
]


class GoogleOAuthError(RuntimeError):
    """Google OAuth処理に失敗した場合の例外です。"""


class GoogleAccountConflictError(GoogleOAuthError):
    """既存ユーザーとの安全な紐付けができない場合の例外です。"""


@dataclass(frozen=True)
class GoogleTokenData:
    access_token: str
    refresh_token: str | None
    expires_at: datetime
    scope: str
    token_type: str
    id_token: str


@dataclass(frozen=True)
class VerifiedGoogleIdentity:
    sub: str
    email: str
    name: str


def create_authorization_request(
    db: Session,
    force_consent: bool,
) -> str:
    """state、nonce、PKCEを生成し、Google認可URLを返します。"""

    state = create_oauth_random_value()
    nonce = create_oauth_random_value()
    code_verifier = create_pkce_code_verifier()
    code_challenge = build_pkce_code_challenge(code_verifier)

    oauth_state = GoogleOAuthState(
        state=state,
        nonce=nonce,
        code_verifier=code_verifier,
        expires_at=(
            utc_now_naive()
            + timedelta(minutes=settings.oauth_state_ttl_minutes)
        ),
    )
    db.add(oauth_state)
    db.commit()

    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": " ".join(GOOGLE_SCOPES),
        "access_type": "offline",
        "include_granted_scopes": "true",
        "state": state,
        "nonce": nonce,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }

    # 通常は同意画面を毎回表示しません。
    # refresh_tokenを取得できない場合の再連携時だけtrueにします。
    if force_consent:
        params["prompt"] = "consent"

    return f"{GOOGLE_AUTHORIZATION_ENDPOINT}?{urlencode(params)}"


async def exchange_authorization_code(
    code: str,
    code_verifier: str,
) -> GoogleTokenData:
    """Googleの認可コードを各トークンへ交換します。"""

    payload = {
        "code": code,
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "redirect_uri": settings.google_redirect_uri,
        "grant_type": "authorization_code",
        "code_verifier": code_verifier,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(GOOGLE_TOKEN_ENDPOINT, data=payload)

    if response.status_code != 200:
        # レスポンス本文にはトークンや内部情報が含まれ得るためログへ出しません。
        raise GoogleOAuthError("Googleとのトークン交換に失敗しました。")

    data = response.json()

    access_token = data.get("access_token")
    id_token_value = data.get("id_token")
    expires_in = data.get("expires_in")

    if not access_token or not id_token_value or not isinstance(expires_in, int):
        raise GoogleOAuthError("Googleのトークンレスポンスが不完全です。")

    return GoogleTokenData(
        access_token=access_token,
        refresh_token=data.get("refresh_token"),
        expires_at=utc_now_naive() + timedelta(seconds=expires_in),
        scope=data.get("scope", " ".join(GOOGLE_SCOPES)),
        token_type=data.get("token_type", "Bearer"),
        id_token=id_token_value,
    )


def verify_google_id_token(
    id_token_value: str,
    expected_nonce: str,
) -> VerifiedGoogleIdentity:
    """Google IDトークンの署名、aud、iss、exp、nonceを検証します。"""

    try:
        claims = google_id_token.verify_oauth2_token(
            id_token_value,
            GoogleRequest(),
            settings.google_client_id,
        )
    except Exception as exc:  # Googleライブラリの複数例外を外へ漏らさない
        raise GoogleOAuthError("Google IDトークンの検証に失敗しました。") from exc

    nonce = claims.get("nonce")
    if not isinstance(nonce, str) or not hmac.compare_digest(
        nonce,
        expected_nonce,
    ):
        raise GoogleOAuthError("Google IDトークンのnonceが一致しません。")

    sub = claims.get("sub")
    email = claims.get("email")
    email_verified = claims.get("email_verified")

    if not isinstance(sub, str) or not sub:
        raise GoogleOAuthError("Googleアカウント識別子を取得できません。")

    if not isinstance(email, str) or not email or email_verified is not True:
        raise GoogleOAuthError("確認済みメールアドレスを取得できません。")

    name = claims.get("name")
    if not isinstance(name, str) or not name.strip():
        name = email.split("@", maxsplit=1)[0]

    return VerifiedGoogleIdentity(
        sub=sub,
        email=email,
        name=name.strip(),
    )


def upsert_google_user(
    db: Session,
    identity: VerifiedGoogleIdentity,
    token_data: GoogleTokenData,
) -> tuple[User, GoogleAccount]:
    """Google subを主軸にusersとgoogle_accountsを登録・更新します。"""

    account = db.scalar(
        select(GoogleAccount).where(
            GoogleAccount.google_sub == identity.sub
        )
    )

    if account is not None:
        user = db.get(User, account.user_id)
        if user is None:
            raise GoogleAccountConflictError(
                "Googleアカウントに紐づくユーザーが存在しません。"
            )
    else:
        # 既存データ移行のため、確認済みGoogleメールとusers.emailが一致する
        # ユーザーがいれば同じ利用者として紐付けます。
        user = db.scalar(select(User).where(User.email == identity.email))

        if user is None:
            user = User(name=identity.name, email=identity.email)
            db.add(user)
            db.flush()

        account = db.scalar(
            select(GoogleAccount).where(GoogleAccount.user_id == user.id)
        )

        if account is None:
            account = GoogleAccount(
                user_id=user.id,
                google_sub=identity.sub,
                google_email=identity.email,
                access_token="temporary",
                refresh_token=None,
                expires_at=token_data.expires_at,
            )
            db.add(account)
        elif account.google_sub not in (None, identity.sub):
            raise GoogleAccountConflictError(
                "この利用者には別のGoogleアカウントが紐づいています。"
            )

    email_owner = db.scalar(select(User).where(User.email == identity.email))
    if email_owner is not None and email_owner.id != user.id:
        raise GoogleAccountConflictError(
            "同じメールアドレスを持つ別ユーザーが存在します。"
        )

    user.name = identity.name
    user.email = identity.email

    account.google_sub = identity.sub
    account.google_email = identity.email
    account.access_token = encrypt_token(token_data.access_token) or ""

    # Googleが再ログイン時にrefresh_tokenを返さない場合、既存値を維持します。
    if token_data.refresh_token:
        account.refresh_token = encrypt_token(token_data.refresh_token)

    account.expires_at = token_data.expires_at
    account.scope = token_data.scope
    account.token_type = token_data.token_type

    db.flush()
    return user, account
