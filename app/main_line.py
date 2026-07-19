from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.line_routes import router as line_router
from app.api.v1.reminder_routes import router as reminder_router
from app.core.config import settings
from app.core.logging_config import setup_logging


setup_logging()

app = FastAPI(
    title="じぶん時間ラボ LINE機能確認用API",
    description="LINE連携・LINE通知だけを確認する開発用API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LINEログイン・連携
app.include_router(line_router)

# LINE通知の手動実行
app.include_router(reminder_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "feature": "line",
    }