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

class LineOAuthState(Base):
    """
    LINE Login開始時のstateとnonceを一時保存します。

    state:
        CSRF攻撃防止

    nonce:
        IDトークンの使い回し防止

    認証完了後はused_atを設定します。
    """

    __tablename__ = "line_oauth_states"

    state: Mapped[str] = mapped_column(
        String(128),
        primary_key=True,
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id",ondelete="CASCADE",),
        nullable=False,
    )

    nonce: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    used_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )