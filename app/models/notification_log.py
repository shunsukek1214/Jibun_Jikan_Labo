from datetime import date, datetime
from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)

from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base

class NotificationLog(Base):
    """
    LINE通知の実行結果を保存します。

    user_id、notification_type、scheduled_atの組み合わせを
    UNIQUEにすることで、同じ通知の二重送信を防ぎます。
    """

    __tablename__ = "notification_logs"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "notification_type",
            "scheduled_at",
            name="uq_notification_user_type_schedule",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id",ondelete="CASCADE",),
        nullable=False,
        index=True,
    )

    notification_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    # UTCに変換した実行予定日時を保存します
    scheduled_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    message_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # LINE APIの再試行キーです
    retry_key: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
    )

    # processing、sent、failed、skipped等
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    line_request_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )