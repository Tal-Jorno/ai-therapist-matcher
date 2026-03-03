from pydantic import BaseModel
from typing import Optional
from decimal import Decimal

class TherapistCreate(BaseModel):
    full_name: str
    specialization: str
    bio: Optional[str] = None
    languages: Optional[str] = None
    city: Optional[str] = None
    is_online: bool = True
    price_per_session: Optional[float] = None


class TherapistResponse(TherapistCreate):
    id: int

    class Config:
        from_attributes = True


class TherapistUpdate(BaseModel):
    full_name: str | None = None
    specialization: str | None = None
    bio: str | None = None
    languages: str | None = None
    city: str | None = None
    is_online: bool | None = None
    price_per_session: Decimal | None = None