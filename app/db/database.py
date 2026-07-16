from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import get_settings

settings = get_settings()

_is_sqlite = settings.database_url.startswith("sqlite")

if _is_sqlite:
    # SQLite はスレッド制約を緩和する必要がある
    engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False},
    )
else:
    # MySQL / Azure MySQL（SSL必須: --require_secure_transport=ON）
    # pymysql は ssl={"ssl_disabled": False} の形式で SSL を有効化する
    engine = create_engine(
        settings.database_url,
        connect_args={"ssl": {"ssl_disabled": False}},
        pool_pre_ping=True,
        pool_recycle=3600,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()