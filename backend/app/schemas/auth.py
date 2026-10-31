from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from backend.app.models.enums import UserRole

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: str
    full_name: str
    hospital_id: Optional[str] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    phone_number: Optional[str] = None
    role: UserRole = UserRole.PUBLIC_REQUESTER
    hospital_id: Optional[str] = None

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    role: UserRole
    hospital_id: Optional[str] = None
    is_active: bool
