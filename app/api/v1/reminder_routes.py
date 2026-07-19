import hmac
import uuid
from datetime import date
from typing import Literal

from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
)
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.services.line_api import LineApiError, send_push_message
from app.models.line_account import LineAccount
from app.services.reminder_service import (
    build_key_point_message,
    build_morning_message,
    run_reminder_batch,
)


router = APIRouter(
    prefix="/api/reminders",
    tags=["LINE通知"],
)


class RunReminderRequest(BaseModel):
    """
    バッチ実行APIの入力です。
    """

    scheduled_time: str
    target_date: date | None = None


class TestSendRequest(BaseModel):
    """
    特定ユーザーへテスト通知するAPIの入力です。
    """

    user_id: int

    notification_type: Literal[
        "morning",
        "key_point",
    ]

    # key_pointテスト時だけ指定します
    today_key_point: str | None = None


def verify_batch_token(
    x_batch_token: str = Header(
        default="",
        alias="X-Batch-Token",
    ),
) -> None:
    """
    バッチAPIを外部から勝手に実行されないようにします。
    """

    if not hmac.compare_digest(
        x_batch_token,
        settings.internal_batch_token,
    ):
        raise HTTPException(
            status_code=401,
            detail="バッチトークンが不正です。",
        )


@router.post(
    "/run",
    dependencies=[Depends(verify_batch_token)],
)
async def run_reminders(
    request_body: RunReminderRequest,
) -> dict:
    """
    バッチから呼び出す通知実行APIです。
    """

    if (
        request_body.scheduled_time
        not in settings.reminder_time_list
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "設定されていない通知時刻です。"
                f"有効値：{settings.reminder_time_list}"
            ),
        )

    try:
        return await run_reminder_batch(
            scheduled_time=request_body.scheduled_time,
            target_date=request_body.target_date,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.post(
    "/test-send",
    dependencies=[Depends(verify_batch_token)],
)
async def send_test_message(
    request_body: TestSendRequest,
    db: Session = Depends(get_db),
) -> dict:
    """
    Swagger UIから手動で通知を確認するためのAPIです。
    """

    line_account = db.scalar(
        select(LineAccount).where(
            LineAccount.user_id == request_body.user_id
        )
    )

    if line_account is None:
        raise HTTPException(
            status_code=404,
            detail="LINE連携情報がありません。",
        )

    if not line_account.is_friend:
        raise HTTPException(
            status_code=409,
            detail="LINE公式アカウントが友だち追加されていません。",
        )

    if request_body.notification_type == "morning":
        message_text = build_morning_message()

    else:
        if not request_body.today_key_point:
            raise HTTPException(
                status_code=400,
                detail=(
                    "key_point通知では"
                    "today_key_pointが必要です。"
                ),
            )

        message_text = build_key_point_message(
            request_body.today_key_point
        )

    retry_key = str(uuid.uuid4())

    try:
        line_request_id = await send_push_message(
            line_user_id=line_account.line_user_id,
            message_text=message_text,
            retry_key=retry_key,
        )

    except LineApiError as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "message": "LINE通知に失敗しました。",
                "line_status": exc.status_code,
                "line_detail": exc.detail,
                "line_request_id": exc.line_request_id,
            },
        ) from exc

    return {
        "sent": True,
        "line_request_id": line_request_id,
    }