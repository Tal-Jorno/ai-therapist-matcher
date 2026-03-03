from pydantic import BaseModel, EmailStr
from typing import Optional

class ClientRegisterRequest(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None