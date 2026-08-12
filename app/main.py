from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.api.v1.line_routes import router as line_router
from app.api.v1.reminder_routes import router as reminder_router
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.scheduler import start_scheduler, stop_scheduler


setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPIの起動時にスケジューラーを開始し、終了時に停止します。"""
    if settings.scheduler_enabled:
        start_scheduler()

    yield

    if settings.scheduler_enabled:
        stop_scheduler()


app = FastAPI(
    title="じぶん時間ラボ API",
    description="認証、Google Calendar、予定構造化、振り返り、LINE通知API",
    version="0.2.0",
    lifespan=lifespan,

    # Swagger / ReDoc / OpenAPI を常に無効化
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Content-Type",
        "Origin",
        "X-Batch-Token",
    ],
)

# 通常APIは/api/v1配下へ統一します。
app.include_router(api_router, prefix="/api/v1")

# 既存LINE URLを壊さないため、既存プレフィックスを維持します。
app.include_router(line_router)
app.include_router(reminder_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
