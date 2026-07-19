from collections.abc import Generator

from sqlalchemy.orm import Session

from app.db.database import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """
    FastAPIのリクエストごとにDBセッションを作成し、
    処理終了後に必ず閉じます。
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()