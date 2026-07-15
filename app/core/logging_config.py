import logging
from app.core.config import get_settings

_SENSITIVE_KEYS = ("key", "token", "secret", "password")


class SensitiveDataFilter(logging.Filter):
    """ログにAPIキー・トークン等が平文で出力されないようマスクするフィルタ"""

    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        for key in _SENSITIVE_KEYS:
            if key in msg.lower():
                record.msg = "[MASKED: sensitive data suppressed]"
                record.args = ()
                break
        return True


def setup_logging() -> None:
    settings = get_settings()
    logging.basicConfig(
        level=settings.log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    root_logger = logging.getLogger()
    root_logger.addFilter(SensitiveDataFilter())