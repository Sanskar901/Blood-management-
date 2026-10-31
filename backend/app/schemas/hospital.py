from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from backend.app.models.enums import HospitalStatus

class HospitalBase(BaseModel):
    name: str
    licence_number: str
    address: str
    pin_code: str
    city: str
    state: str
    latitude: float
    longitude: float
    contact_phone: str
    contact_email: str
    emergency_helpline: Optional[str] = None

class HospitalCreate(HospitalBase):
    pass

class HospitalStatusUpdate(BaseModel):
    approval_status: HospitalStatus
    reason: Optional[str] = None

class HospitalOut(HospitalBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    approval_status: HospitalStatus
    is_active: bool
    created_at: datetime
