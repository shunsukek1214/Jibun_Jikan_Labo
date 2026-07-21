from fastapi import APIRouter

from app.api.v1 import (
  calendar_auth,
  calendar_events,
  reflection,
  schedule_structuring,
)

api_router = APIRouter()
api_router.include_router(schedule_structuring.router, tags=["schedule-structuring"])
api_router.include_router(reflection.router, tags=["reflection"])
api_router.include_router(calendar_auth.router, tags=["calendar-auth"])
api_router.include_router(calendar_events.router, tags=["calendar-events"])