from datetime import date, datetime

from pydantic import BaseModel, Field


class CalendarEventItem(BaseModel):
    google_event_id: str
    title: str
    start: str
    end: str
    all_day: bool
    html_link: str | None = None
    status: str | None = None


class CalendarEventsResponse(BaseModel):
    target_date: date
    calendar_id: str
    events: list[CalendarEventItem]


class CalendarEventCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    start: datetime
    end: datetime
    description: str | None = Field(default=None, max_length=5000)
    task_id: int | None = None


class CalendarEventCreateResponse(BaseModel):
    calendar_event_id: int
    google_event_id: str
    calendar_id: str
    html_link: str | None
    sync_status: str


class CalendarStatusResponse(BaseModel):
    connected: bool
    google_email: str | None = None
    has_refresh_token: bool = False
    expires_at: datetime | None = None
