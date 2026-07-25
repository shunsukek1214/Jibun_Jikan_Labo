from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.calendar_event import CalendarEvent
from app.models.google_account import GoogleAccount
from app.models.schedule import Schedule
from app.models.task import Task
from app.models.user import User
from app.schemas.calendar import (
    CalendarEventCreateRequest,
    CalendarEventCreateResponse,
    CalendarEventItem,
    CalendarEventsResponse,
    CalendarStatusResponse,
)
from app.services.google_calendar_service import (
    GoogleCalendarError,
    GoogleCalendarNotConnectedError,
    GoogleCalendarPermissionError,
    GoogleReauthorizationRequiredError,
    create_calendar_event,
    list_events_for_date,
)


router = APIRouter(prefix="/calendar", tags=["Google Calendar"])


def _raise_calendar_http_error(exc: GoogleCalendarError) -> None:
    if isinstance(exc, GoogleReauthorizationRequiredError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "google_reauthorization_required",
                "message": str(exc),
            },
        ) from exc

    if isinstance(exc, GoogleCalendarNotConnectedError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "google_not_connected",
                "message": str(exc),
            },
        ) from exc

    if isinstance(exc, GoogleCalendarPermissionError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "google_calendar_permission_denied",
                "message": str(exc),
            },
        ) from exc

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail={
            "code": "google_calendar_api_error",
            "message": str(exc),
        },
    ) from exc


@router.get("/status", response_model=CalendarStatusResponse)
def get_calendar_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CalendarStatusResponse:
    account = db.scalar(
        select(GoogleAccount).where(
            GoogleAccount.user_id == current_user.id
        )
    )

    if account is None:
        return CalendarStatusResponse(connected=False)

    return CalendarStatusResponse(
        connected=True,
        google_email=account.google_email,
        has_refresh_token=account.refresh_token is not None,
        expires_at=account.expires_at,
    )


@router.get("/events", response_model=CalendarEventsResponse)
def get_calendar_events(
    target_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CalendarEventsResponse:
    try:
        events = list_events_for_date(
            db=db,
            user_id=current_user.id,
            target_date=target_date,
        )
    except GoogleCalendarError as exc:
        _raise_calendar_http_error(exc)

    return CalendarEventsResponse(
        target_date=target_date,
        calendar_id="primary",
        events=[CalendarEventItem(**event) for event in events],
    )


@router.post(
    "/events",
    response_model=CalendarEventCreateResponse,
    status_code=201,
)
def post_calendar_event(
    request_body: CalendarEventCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CalendarEventCreateResponse:
    if request_body.end <= request_body.start:
        raise HTTPException(
            status_code=422,
            detail="endはstartより後の日時にしてください。",
        )

    if request_body.task_id is not None:
        owned_task = db.scalar(
            select(Task)
            .join(Schedule, Schedule.id == Task.schedule_id)
            .where(
                Task.id == request_body.task_id,
                Schedule.user_id == current_user.id,
            )
        )
        if owned_task is None:
            raise HTTPException(
                status_code=404,
                detail="指定したtask_idは存在しないか、他のユーザーのタスクです。",
            )

    try:
        google_event = create_calendar_event(
            db=db,
            user_id=current_user.id,
            title=request_body.title,
            start=request_body.start,
            end=request_body.end,
            description=request_body.description,
        )
    except GoogleCalendarError as exc:
        _raise_calendar_http_error(exc)

    google_event_id = google_event.get("id")
    if not google_event_id:
        raise HTTPException(
            status_code=502,
            detail="Googleからevent_idを取得できませんでした。",
        )

    calendar_event = CalendarEvent(
        user_id=current_user.id,
        task_id=request_body.task_id,
        google_event_id=google_event_id,
        calendar_id="primary",
        html_link=google_event.get("htmlLink"),
        sync_status="synced",
    )
    db.add(calendar_event)

    try:
        db.commit()
        db.refresh(calendar_event)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail={
                "message": "同じGoogleイベントがすでにDBへ保存されています。",
                "google_event_id": google_event_id,
            },
        ) from exc
    except Exception as exc:
        db.rollback()
        # Google側では作成済みのため、手動照合できるIDだけ返します。
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Google予定は作成されましたがDB保存に失敗しました。",
                "google_event_id": google_event_id,
                "html_link": google_event.get("htmlLink"),
            },
        ) from exc

    return CalendarEventCreateResponse(
        calendar_event_id=calendar_event.id,
        google_event_id=calendar_event.google_event_id,
        calendar_id=calendar_event.calendar_id,
        html_link=calendar_event.html_link,
        sync_status=calendar_event.sync_status,
    )
