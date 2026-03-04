from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class MatchSessionCreateRequest(BaseModel):
    client_user_id: int = Field(..., gt=0)


class MatchSessionResponse(BaseModel):
    id: int
    client_user_id: int
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class MatchMessageCreateRequest(BaseModel):
    content: str = Field(..., min_length=1)


class MatchMessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    created_at: datetime


class MatchResultResponse(BaseModel):
    session_id: int
    payload: dict[str, Any]
    created_at: datetime


class MatchSessionStatusUpdate(BaseModel):
    status: str