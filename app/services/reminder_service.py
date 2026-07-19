import uuid
from datetime import date, datetime, time, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.db.database import SessionLocal
from app.services.line_api import LineApiError, send_push_message
from app.models.line_account import LineAccount
from app.models.notification_log import NotificationLog
from app.models.reflection import Reflection


def utc_now_naive() -> datetime:
    """
    UTCの現在日時を、MySQL保存用のnaive datetimeで返します。
    """

    return datetime.now(timezone.utc).replace(tzinfo=None)


def build_morning_message() -> str:
    """
    7:00通知の本文を作成します。
    """

    return (
        "今日の予定です。\n\n"
        "Googleカレンダー\n"
        f"{settings.google_calendar_url}\n\n"
        "じぶん時間ラボのToday画面\n"
        f"{settings.frontend_today_url}"
    )


def build_key_point_message(today_key_point: str) -> str:
    """
    10:00、13:00、15:00、17:00通知の本文を作成します。
    """

    return (
        "今日の重点ポイントです。\n\n"
        f"{today_key_point}\n\n"
        "Today画面を確認する\n"
        f"{settings.frontend_today_url}"
    )


async def run_reminder_batch(
    scheduled_time: str,
    target_date: date | None = None,
) -> dict:
    """
    指定時刻分のLINE通知を実行します。

    scheduled_time:
        "07:00"、"10:00"等

    target_date:
        通常は日本時間の当日です。
        テスト時だけ任意の日付を指定できます。
    """
    # 自動バッチが実行されたことを確認するログです
    print(
        f"[LINE Batch] 開始 scheduled_time={scheduled_time}, "
        f"target_date={target_date}"
    )

    try:
        hour_text, minute_text = scheduled_time.split(":")
        hour = int(hour_text)
        minute = int(minute_text)
    except ValueError as exc:
        raise ValueError(
            "scheduled_timeはHH:MM形式で指定してください。"
        ) from exc

    jst = ZoneInfo(settings.app_timezone)

    if target_date is None:
        target_date = datetime.now(jst).date()

    # 日本時間での実行予定日時を作ります
    scheduled_local = datetime.combine(
        target_date,
        time(hour=hour, minute=minute),
        tzinfo=jst,
    )

    # DBではUTCで保存します
    scheduled_at_utc = (
        scheduled_local
        .astimezone(timezone.utc)
        .replace(tzinfo=None)
    )

    notification_type = (
        "morning"
        if scheduled_time == "07:00"
        else "key_point"
    )

    db = SessionLocal()

    sent_count = 0
    failed_count = 0
    skipped_count = 0
    duplicate_count = 0

    try:
        # LINE連携済み、友だち追加済みのユーザーだけ対象にします
        line_accounts = list(
            db.scalars(
                select(LineAccount).where(
                    LineAccount.status == "active",
                    LineAccount.is_friend.is_(True),
                )
            )
        )
        # 通知対象者数を確認します
        print(
            f"[LINE Batch] 通知対象者数={len(line_accounts)}"
        )

        for line_account in line_accounts:
            message_text: str | None = None

            if notification_type == "morning":
                message_text = build_morning_message()

            else:
                # 当日用として作成された最新の重点ポイントを取得します
                reflection = db.scalar(
                    select(Reflection)
                    .where(
                        Reflection.user_id
                        == line_account.user_id,
                        Reflection.proposal_date
                        == target_date,
                    )
                    .order_by(
                        Reflection.updated_at.desc(),
                        Reflection.id.desc(),
                    )
                )

                if (
                    reflection is None
                    or not reflection.today_key_point
                    or not reflection.today_key_point.strip()
                ):
                    # 重点ポイントがなければ送らず、
                    # skippedとして記録します
                    message_text = None

                else:
                    message_text = build_key_point_message(
                        reflection.today_key_point.strip()
                    )

            retry_key = str(uuid.uuid4())

            log = NotificationLog(
                user_id=line_account.user_id,
                notification_type=notification_type,
                scheduled_at=scheduled_at_utc,
                message_text=message_text,
                retry_key=retry_key,
                status=(
                    "processing"
                    if message_text
                    else "skipped"
                ),
                error_message=(
                    None
                    if message_text
                    else "today_key_pointが存在しません。"
                ),
            )

            db.add(log)

            try:
                # UNIQUE制約を先に確定させます。
                # 同じ通知がすでに存在すれば、ここで失敗します。
                db.commit()
                db.refresh(log)

            except IntegrityError:
                db.rollback()

                # 同じユーザー、通知種別、時刻のログがあるため、
                # 二重送信せずスキップします
                duplicate_count += 1
                continue

            if message_text is None:
                skipped_count += 1
                continue

            try:
                line_request_id = await send_push_message(
                    line_user_id=line_account.line_user_id,
                    message_text=message_text,
                    retry_key=retry_key,
                )

                log.status = "sent"
                log.line_request_id = line_request_id
                log.sent_at = utc_now_naive()
                log.error_message = None

                db.commit()

                sent_count += 1

            except LineApiError as exc:
                log.status = "failed"
                log.line_request_id = exc.line_request_id
                log.error_message = str(exc)[:2000]

                db.commit()

                failed_count += 1

        return {
            "scheduled_time": scheduled_time,
            "target_date": target_date.isoformat(),
            "sent": sent_count,
            "failed": failed_count,
            "skipped": skipped_count,
            "duplicates": duplicate_count,
        }

    finally:
        db.close()