import base64
import hashlib
import secrets
from datetime import datetime, timezone

from cryptography.fernet import Fernet, InvalidToken
from fastapi import Response

from app.core.config import settings


_ENCRYPTED_PREFIX = "enc:"


class TokenDecryptionError(RuntimeError):
    """保存済みGoogleトークンを復号できない場合の例外です。"""


def utc_now_naive() -> datetime:
    """MySQL保存用に、UTCのタイムゾーン情報を外した日時を返します。"""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def create_random_token() -> str:
    """Cookieへ保存する十分に長いランダムなセッショントークンを生成します。"""
    return secrets.token_urlsafe(48)


def hash_session_token(raw_token: str) -> str:
    """DBには生のセッショントークンではなくSHA-256ハッシュを保存します。"""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def create_oauth_random_value() -> str:
    """OAuth state、nonce用のランダム値を生成します。"""
    return secrets.token_urlsafe(48)


def create_pkce_code_verifier() -> str:
    """RFC 7636の43〜128文字要件を満たすPKCE code_verifierを生成します。"""
    return secrets.token_urlsafe(64)


def build_pkce_code_challenge(code_verifier: str) -> str:
    """PKCE S256用のcode_challengeを生成します。"""
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


def _get_fernet() -> Fernet:
    try:
        return Fernet(settings.token_encryption_key.encode("ascii"))
    except (ValueError, TypeError) as exc:
        raise RuntimeError(
            "TOKEN_ENCRYPTION_KEYが有効なFernetキーではありません。"
        ) from exc


def encrypt_token(value: str | None) -> str | None:
    """GoogleトークンをFernetで暗号化して保存用文字列へ変換します。"""
    if not value:
        return None

    encrypted = _get_fernet().encrypt(value.encode("utf-8")).decode("ascii")
    return f"{_ENCRYPTED_PREFIX}{encrypted}"


def decrypt_token(value: str | None) -> str | None:
    """Googleトークンを復号します。

    既存DBに平文トークンが残っている移行期間を考慮し、
    enc:で始まらない値は平文として返します。
    新規保存・更新時には必ず暗号化されます。
    """
    if not value:
        return None

    if not value.startswith(_ENCRYPTED_PREFIX):
        return value

    encrypted_value = value[len(_ENCRYPTED_PREFIX) :]

    try:
        return _get_fernet().decrypt(
            encrypted_value.encode("ascii")
        ).decode("utf-8")
    except InvalidToken as exc:
        raise TokenDecryptionError(
            "保存済みGoogleトークンを復号できません。"
        ) from exc


def set_session_cookie(response: Response, raw_token: str) -> None:
    """ログインセッションCookieを設定します。"""
    max_age = settings.session_ttl_days * 24 * 60 * 60

    response.set_cookie(
        key=settings.session_cookie_name,
        value=raw_token,
        max_age=max_age,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        path="/",
        domain=settings.session_cookie_domain_value,
    )


def delete_session_cookie(response: Response) -> None:
    """ブラウザのログインセッションCookieを削除します。"""
    response.delete_cookie(
        key=settings.session_cookie_name,
        path="/",
        domain=settings.session_cookie_domain_value,
        secure=settings.session_cookie_secure,
        httponly=True,
        samesite=settings.session_cookie_samesite,
    )
