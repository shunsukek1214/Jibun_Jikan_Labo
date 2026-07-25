from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """アプリ全体で使用する環境変数を読み込みます。"""

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
    database_ssl_enabled: bool = False

    # App
    app_env: str = "development"
    log_level: str = "INFO"
    app_timezone: str = "Asia/Tokyo"
    backend_base_url: str = "http://localhost:8000"
    cors_origins: str = "http://localhost:3000"

    # Google OAuth / OpenID Connect
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str
    frontend_after_login_url: str = "http://localhost:3000/night"
    frontend_auth_error_url: str = "http://localhost:3000"
    oauth_state_ttl_minutes: int = 10

    # アプリのログインセッション
    session_cookie_name: str = "jibun_session"
    session_ttl_days: int = 7
    session_cookie_secure: bool = False
    session_cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    session_cookie_domain: str = ""

    # Googleトークン暗号化用のFernetキー
    token_encryption_key: str

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
    frontend_today_url: str = "http://localhost:3000/today"

    # Googleカレンダーの日表示URL
    google_calendar_url: str = "https://calendar.google.com/calendar/u/0/r/day"

    # バッチAPI保護用
    internal_batch_token: str

    # APScheduler
    scheduler_enabled: bool = True
    reminder_times: str = "07:00,10:00,13:00,15:00,17:00"

    @property
    def cors_origin_list(self) -> list[str]:
        """カンマ区切りの許可オリジンを配列へ変換します。"""
        return [
            origin.strip().rstrip("/")
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]

    @property
    def reminder_time_list(self) -> list[str]:
        """カンマ区切りの通知時刻を配列へ変換します。"""
        return [
            value.strip()
            for value in self.reminder_times.split(",")
            if value.strip()
        ]

    @property
    def session_cookie_domain_value(self) -> str | None:
        """空文字の場合はCookieのdomain属性を設定しません。"""
        value = self.session_cookie_domain.strip()
        return value or None


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
