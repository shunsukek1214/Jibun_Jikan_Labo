"""
DBテーブル作成スクリプト
使い方: python create_tables.py
"""
from app.db.database import Base, engine
from app.models.schedule import Schedule  # noqa: F401 テーブル登録のためインポート
from app.models.reflection import Reflection  # noqa: F401 テーブル登録のためインポート

if __name__ == "__main__":
    print("テーブルを作成します...")
    Base.metadata.create_all(bind=engine)
    print("完了: schedules, reflection テーブルが作成されました。")
