from pydantic import BaseModel
from typing import Optional


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