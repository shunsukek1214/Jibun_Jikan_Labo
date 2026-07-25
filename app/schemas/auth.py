from pydantic import BaseModel


class CurrentUserResponse(BaseModel):
    id: int
    name: str
    email: str
    calendar_connected: bool
