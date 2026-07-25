from datetime import date, datetime

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Reflection(Base):
    """振り返り結果を保持します。"""

    __tablename__ = "reflection"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reflection_date: Mapped[date] = mapped_column(Date, nullable=False)
    proposal_date: Mapped[date] = mapped_column(Date, nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    reflection_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    gap_analysis: Mapped[str | None] = mapped_column(Text, nullable=True)
    gap_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    today_key_point: Mapped[str | None] = mapped_column(Text, nullable=True)
    proposed_schedule_change: Mapped[str | None] = mapped_column(Text, nullable=True)
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
