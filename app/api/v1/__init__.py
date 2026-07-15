from fastapi import APIRouter

from app.api.v1 import schedule_structuring, reflection

api_router = APIRouter()
api_router.include_router(schedule_structuring.router, tags=["schedule-structuring"])
api_router.include_router(reflection.router, tags=["reflection"])