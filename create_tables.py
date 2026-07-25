"""
DBテーブル作成スクリプト
使い方: python create_tables.py
"""
import sys

import app.models  # noqa: F401 すべてのモデルをBaseへ登録する
from app.db.database import Base, engine


if __name__ == "__main__":
    print(f"接続先: {engine.url.render_as_string(hide_password=True)}")
    print("未作成テーブルを作成します...")

    try:
        Base.metadata.create_all(bind=engine)
        print("完了しました。")
        print("登録済みテーブル:")
        for table_name in sorted(Base.metadata.tables):
            print(f"- {table_name}")
    except Exception as exc:
        print(f"エラー: {exc}", file=sys.stderr)
        sys.exit(1)

