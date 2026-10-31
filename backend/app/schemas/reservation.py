from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from backend.app.models.enums import ReservationStatus

class ReservationCreate(BaseModel):
    request_id: str
    idempotency_key: str = Field(..., min_length=8, description="Unique client key preventing duplicate holds")

class ReservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    request_id: str
    hospital_id: str
    product_id: str
    units_reserved: int
    idempotency_key: str
    status: ReservationStatus
    expires_at: datetime
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    released_at: Optional[datetime] = None
