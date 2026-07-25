from datetime import datetime

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class GoogleAccount(Base):
    """GoogleアカウントとOAuthトークンを管理します。"""

    __tablename__ = "google_accounts"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_google_accounts_user_id"),
        UniqueConstraint("google_sub", name="uq_google_accounts_google_sub"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # 既存レコード移行中はNULLを許可します。
    # 全ユーザー再ログイン後、MySQL側でNOT NULLへ変更できます。
    google_sub: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    google_email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    # TEXT列にはFernet暗号文を保存します。
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    scope: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_type: Mapped[str | None] = mapped_column(String(30), nullable=True)

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
