from zoneinfo import ZoneInfo

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.services.reminder_service import run_reminder_batch


scheduler = AsyncIOScheduler(
    timezone=ZoneInfo(settings.app_timezone)
)


def start_scheduler() -> None:
    """
    .envのREMINDER_TIMESを読み取り、
    各時刻にLINE通知バッチを登録します。
    """

    if scheduler.running:
        return

    for scheduled_time in settings.reminder_time_list:
        hour_text, minute_text = scheduled_time.split(":")

        scheduler.add_job(
            run_reminder_batch,
            trigger=CronTrigger(
                hour=int(hour_text),
                minute=int(minute_text),
                timezone=ZoneInfo(settings.app_timezone),
            ),
            kwargs={
                "scheduled_time": scheduled_time,
            },
            id=f"line-reminder-{scheduled_time}",
            replace_existing=True,

            # 複数回分が遅延した場合、まとめて1回だけ実行します
            coalesce=True,

            # 同じジョブを並行実行しません
            max_instances=1,

            # 最大5分までの遅延実行を許可します
            misfire_grace_time=300,
        )

    scheduler.start()

    # 登録されたバッチと次回実行日時をターミナルへ表示します
    for job in scheduler.get_jobs():
        print(
            f"[Scheduler] job={job.id}, "
            f"next_run_time={job.next_run_time}"
        )


def stop_scheduler() -> None:
    """
    FastAPI終了時にスケジューラーを停止します。
    """

    if scheduler.running:
        scheduler.shutdown(wait=False)