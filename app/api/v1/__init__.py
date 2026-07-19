from fastapi import APIRouter

from app.api.v1 import schedule_structuring, reflection2 # テスト用に２として設定

api_router = APIRouter()
api_router.include_router(schedule_structuring.router, tags=["schedule-structuring"])
api_router.include_router(reflection2.router, tags=["reflection"])