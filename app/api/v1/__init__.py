from fastapi import APIRouter

from app.api.v1 import (
    auth_routes,
    calendar_routes,
    reflection,
    schedule_structuring,
)


api_router = APIRouter()
api_router.include_router(auth_routes.router)
api_router.include_router(calendar_routes.router)
api_router.include_router(
    schedule_structuring.router,
    tags=["schedule-structuring"],
)
api_router.include_router(reflection.router, tags=["reflection"])
