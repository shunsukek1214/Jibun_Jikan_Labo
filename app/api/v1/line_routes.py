import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
    Request,
)
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.services.line_api import (
    LineApiError,
    exchange_line_login_code,
    get_friendship_status,
    verify_line_id_token,
)
from app.models.line_account import LineAccount
from app.models.line_oauth_state import LineOAuthState
from app.models.user import User


router = APIRouter(
    prefix="/api/line",
    tags=["LINE連携"],
)


def utc_now_naive() -> datetime:
    """
    MySQLへ保存しやすいように、
    UTCのタイムゾーン情報を外したdatetimeを返します。
    """

    return datetime.now(timezone.utc).replace(tzinfo=None)


@router.get("/connect/start")
def start_line_connection(
    user_id: int,
    db: Session = Depends(get_db),
) -> RedirectResponse:
    """
    LINE連携を開始します。

    現在は動作確認用としてuser_idをクエリで受け取っています。
    本番では、ログイン中ユーザーのJWTやセッションから
    user_idを取得してください。
    """

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="指定されたユーザーが存在しません。",
        )

    # CSRF対策用のstateをランダム生成します
    state = secrets.token_urlsafe(32)

    # IDトークンのリプレイ攻撃対策用nonceです
    nonce = secrets.token_urlsafe(32)

    oauth_state = LineOAuthState(
        state=state,
        user_id=user_id,
        nonce=nonce,
        expires_at=utc_now_naive() + timedelta(minutes=10),
    )

    db.add(oauth_state)
    db.commit()

    authorization_params = {
        "response_type": "code",
        "client_id": settings.line_login_channel_id,
        "redirect_uri": settings.line_login_callback_url,
        "state": state,

        # profile:
        #   表示名や友だち関係確認に必要です
        #
        # openid:
        #   IDトークンとsubの取得に必要です
        "scope": "profile openid",

        "nonce": nonce,

        # LINEログイン後に友だち追加画面を明確に表示します
        "bot_prompt": "aggressive",
    }

    authorization_url = (
        "https://access.line.me/oauth2/v2.1/authorize?"
        + urlencode(authorization_params)
    )

    return RedirectResponse(
        url=authorization_url,
        status_code=302,
    )


@router.get("/callback")
async def line_login_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
    db: Session = Depends(get_db),
) -> RedirectResponse:
    """
    LINE Login完了後にLINEから呼ばれるコールバックです。
    """

    if error:
        # ユーザーが同意画面でキャンセルした場合などです
        redirect_url = (
            settings.frontend_line_result_url
            + "?"
            + urlencode(
                {
                    "linked": "0",
                    "error": error_description or error,
                }
            )
        )

        return RedirectResponse(redirect_url)

    if not code or not state:
        raise HTTPException(
            status_code=400,
            detail="codeまたはstateがありません。",
        )

    oauth_state = db.get(LineOAuthState, state)

    if oauth_state is None:
        raise HTTPException(
            status_code=400,
            detail="不正なstateです。",
        )

    if oauth_state.used_at is not None:
        raise HTTPException(
            status_code=400,
            detail="このstateは使用済みです。",
        )

    if oauth_state.expires_at < utc_now_naive():
        raise HTTPException(
            status_code=400,
            detail="LINE連携の有効時間が切れています。",
        )

    try:
        # 認可コードからLINE Loginのトークンを取得します
        token_data = await exchange_line_login_code(code)

        line_login_access_token = token_data["access_token"]
        id_token = token_data["id_token"]

        # IDトークンを検証し、LINEユーザーIDを取得します
        id_token_data = await verify_line_id_token(
            id_token=id_token,
            nonce=oauth_state.nonce,
        )

        line_user_id = id_token_data.get("sub")
        display_name = id_token_data.get("name")

        if not line_user_id:
            raise HTTPException(
                status_code=400,
                detail="LINEユーザーIDを取得できませんでした。",
            )

        # 公式アカウントの友だち追加状態を確認します
        is_friend = await get_friendship_status(
            line_login_access_token
        )

        # 同じLINEアカウントが別のアプリユーザーへ
        # すでに連携されていないか確認します
        existing_by_line_user = db.scalar(
            select(LineAccount).where(
                LineAccount.line_user_id == line_user_id
            )
        )

        if (
            existing_by_line_user is not None
            and existing_by_line_user.user_id
            != oauth_state.user_id
        ):
            raise HTTPException(
                status_code=409,
                detail=(
                    "このLINEアカウントは、"
                    "別のユーザーに連携されています。"
                ),
            )

        line_account = db.scalar(
            select(LineAccount).where(
                LineAccount.user_id == oauth_state.user_id
            )
        )

        if line_account is None:
            # 初回連携の場合は新規登録します
            line_account = LineAccount(
                user_id=oauth_state.user_id,
                line_user_id=line_user_id,
                display_name=display_name,
                is_friend=is_friend,
                status=(
                    "active"
                    if is_friend
                    else "needs_friend"
                ),
                linked_at=utc_now_naive(),
            )

            db.add(line_account)

        else:
            # 再連携の場合は既存レコードを更新します
            line_account.line_user_id = line_user_id
            line_account.display_name = display_name
            line_account.is_friend = is_friend
            line_account.status = (
                "active"
                if is_friend
                else "needs_friend"
            )
            line_account.linked_at = utc_now_naive()

        # 同じstateを二度使用できないようにします
        oauth_state.used_at = utc_now_naive()

        db.commit()

    except LineApiError as exc:
        db.rollback()

        raise HTTPException(
            status_code=502,
            detail={
                "message": "LINE APIの呼び出しに失敗しました。",
                "line_status": exc.status_code,
                "line_detail": exc.detail,
                "line_request_id": exc.line_request_id,
            },
        ) from exc

    redirect_url = (
        settings.frontend_line_result_url
        + "?"
        + urlencode(
            {
                "linked": "1",
                "friend": "1" if is_friend else "0",
            }
        )
    )

    return RedirectResponse(redirect_url)


@router.get("/status")
def get_line_connection_status(
    user_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """
    Next.js画面でLINE連携状態を表示するためのAPIです。
    """

    line_account = db.scalar(
        select(LineAccount).where(
            LineAccount.user_id == user_id
        )
    )

    if line_account is None:
        return {
            "linked": False,
            "is_friend": False,
            "status": "not_linked",
            "display_name": None,
        }

    return {
        "linked": True,
        "is_friend": line_account.is_friend,
        "status": line_account.status,
        "display_name": line_account.display_name,
    }


@router.post("/webhook")
async def receive_line_webhook(
    request: Request,
    x_line_signature: str = Header(
        default="",
        alias="X-Line-Signature",
    ),
    db: Session = Depends(get_db),
) -> dict:
    """
    友だち追加、ブロック等のイベントをLINEから受信します。

    LINEから送信されたリクエストであることを確認するため、
    X-Line-Signatureを必ず検証します。
    """

    raw_body = await request.body()

    digest = hmac.new(
        settings.line_messaging_channel_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).digest()

    expected_signature = base64.b64encode(digest).decode("utf-8")

    if not hmac.compare_digest(
        expected_signature,
        x_line_signature,
    ):
        raise HTTPException(
            status_code=400,
            detail="Webhook署名が不正です。",
        )

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail="WebhookのJSONが不正です。",
        ) from exc

    for event in payload.get("events", []):
        event_type = event.get("type")
        source = event.get("source", {})
        line_user_id = source.get("userId")

        if not line_user_id:
            continue

        line_account = db.scalar(
            select(LineAccount).where(
                LineAccount.line_user_id == line_user_id
            )
        )

        # まだアプリとの連携前なら更新対象がないため無視します
        if line_account is None:
            continue

        if event_type == "follow":
            # 友だち追加またはブロック解除
            line_account.is_friend = True
            line_account.status = "active"

        elif event_type == "unfollow":
            # ブロック
            line_account.is_friend = False
            line_account.status = "blocked"

    db.commit()

    return {"ok": True}