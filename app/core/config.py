from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )
    # Azure Speech
    azure_speech_key: str
    azure_speech_region: str

    # Azure OpenAI
    azure_openai_endpoint: str
    azure_openai_api_key: str
    azure_openai_api_version: str = "2024-05-01-preview"
    azure_openai_deployment_name: str

    # DB
    database_url: str

    # App
    app_env: str = "development"
    log_level: str = "INFO"

    # Messaging API用
    line_channel_access_token: str
    line_messaging_channel_secret: str

    # LINE Login用
    line_login_channel_id: str
    line_login_channel_secret: str
    line_login_callback_url: str

    # Next.js側のURL
    frontend_origin: str = "http://localhost:3000"
    frontend_line_result_url: str = "http://localhost:3000/settings/line"
    frontend_today_url: str

    # Googleカレンダーの日表示URL
    google_calendar_url: str = (
        "https://calendar.google.com/calendar/u/0/r/day"
    )

    # バッチAPI保護用
    internal_batch_token: str

    # 時刻設定
    app_timezone: str = "Asia/Tokyo"
    reminder_times: str = "07:00,10:00,13:00,15:00,17:00"

    @property
    def reminder_time_list(self) -> list[str]:
        """
        カンマ区切りの通知時刻を配列に変換します。

        例：
        "07:00,10:00" → ["07:00", "10:00"]
        """
        return [
            value.strip()
            for value in self.reminder_times.split(",")
            if value.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
# 他のファイルから
# from app.core.config import settings
# と読み込めるようにします。
settings = get_settings()