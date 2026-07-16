from sqlalchemy import Column, BigInteger, String, Date, Text, DateTime, func

from app.db.database import Base


class Schedule(Base):
    """明日の予定構造化結果を保持するテーブル

    RFP上のuser_idはGoogleカレンダー連携（他モジュール）側のUsersテーブルと
    紐づく想定だが、本モジュールでは外部キー制約は付与せず、IDのみ保持する。
    """

    __tablename__ = "schedules"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    # user_id: Users テーブル（他モジュール管理）への想定リンク。外部キーは付与しない
    user_id = Column(BigInteger, nullable=False, index=True)
    target_date = Column(Date, nullable=False)
    raw_text = Column(Text, nullable=False)  # 音声を文字起こししたテキスト
    summary = Column(Text, nullable=True)  # Azure OpenAIがまとめた予定概要（JSON文字列想定）
    created_at = Column(DateTime, server_default=func.now(), nullable=False)