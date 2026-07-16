"""
DBテーブル作成スクリプト
使い方: python create_tables.py
"""
import sys
from app.db.database import Base, engine
from app.models.schedule import Schedule  # noqa: F401 テーブル登録のためインポート
from app.models.reflection import Reflection  # noqa: F401 テーブル登録のためインポート

if __name__ == "__main__":
    print(f"接続先: {engine.url.render_as_string(hide_password=True)}")
    print("テーブルを作成します...")
    try:
        Base.metadata.create_all(bind=engine)
        print("完了: schedules, reflection テーブルが作成されました。")
    except Exception as e:
        print(f"エラー: {e}", file=sys.stderr)
        print("\n【ヒント】", file=sys.stderr)
        print("  - .env の DATABASE_URL を確認してください", file=sys.stderr)
        print("  - ローカル開発用に SQLite を使う場合:", file=sys.stderr)
        print("    DATABASE_URL=sqlite:///./dev.db", file=sys.stderr)
        sys.exit(1)
