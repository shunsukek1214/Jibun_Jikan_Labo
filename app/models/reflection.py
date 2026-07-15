from sqlalchemy import Column, BigInteger, String, Date, Text, DateTime, func

from app.db.database import Base


class Reflection(Base):
    """振り返り結果（要約・ズレ分析・重点ポイント・予定修正案）を保持するテーブル"""

    __tablename__ = "reflection"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    # user_id: Users テーブル（他モジュール管理）への想定リンク。外部キーは付与しない
    user_id = Column(BigInteger, nullable=False, index=True)
    reflection_date = Column(Date, nullable=False)  # 振り返り対象日
    proposal_date = Column(Date, nullable=False)  # 重点ポイント・予定修正案の対象日
    raw_text = Column(Text, nullable=False)  # 振り返り発話の文字起こしテキスト
    reflection_summary = Column(Text, nullable=True)
    gap_analysis = Column(Text, nullable=True)  # 予定と実績のズレ分析
    gap_reason = Column(Text, nullable=True)  # ズレの理由
    today_key_point = Column(Text, nullable=True)  # 今日の重点ポイント
    proposed_schedule_change = Column(Text, nullable=True)  # 予定修正案（JSON文字列想定）
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)