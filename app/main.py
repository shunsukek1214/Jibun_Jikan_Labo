from fastapi import FastAPI
from app.api.v1 import api_router
from app.core.logging_config import setup_logging
from fastapi.middleware.cors import CORSMiddleware

setup_logging()

app = FastAPI(
    title="じぶん時間ラボ API",
    description="Speech to Text + Azure OpenAI を用いた予定構造化・振り返りAPI",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 後日NetlifyのURLも追加します
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
