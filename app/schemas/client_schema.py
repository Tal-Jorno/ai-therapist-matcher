from pydantic import BaseModel, EmailStr
from typing import Optional
from pydantic import BaseModel, EmailStr

class ClientRegisterRequest(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None



class ClientUpdateRequest(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    role: str
    email: EmailStr
    full_name: str | None = None
    is_active: bool

    class Config:
        from_attributes = True