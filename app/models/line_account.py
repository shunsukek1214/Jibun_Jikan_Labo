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


class LineAccount(Base):
    """
    アプリのユーザーとLINEユーザーを対応付けるテーブルです。

    user_id:
        じぶん時間ラボ側のユーザーID

    line_user_id:
        LINE LoginのIDトークンから取得するsub
        Messaging APIの送信先として使用します
    """

    __tablename__ = "line_accounts"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id",ondelete="CASCADE",),
        unique=True,
        nullable=False,
    )

    line_user_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )

    display_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    # 公式アカウントを友だち追加済みか
    is_friend: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("0"),
    )

    # active、needs_friend、disabled等を保存します
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="active",
        server_default="active",
    )

    linked_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
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