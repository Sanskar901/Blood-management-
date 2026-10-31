from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from backend.app.models.enums import RequestUrgency, RequestStatus
from backend.app.schemas.inventory import BloodProductOut

class BloodRequestCreate(BaseModel):
    hospital_id: str
    product_id: str
    units_requested: int = Field(gt=0, le=20, description="Number of blood units requested")
    urgency_level: RequestUrgency = RequestUrgency.STANDARD
    patient_reference_code: str = Field(..., min_length=3, description="Anonymized hospital/patient reference")
    notes: Optional[str] = None

class BloodRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    requester_id: Optional[str] = None
    hospital_id: str
    product_id: str
    units_requested: int
    urgency_level: RequestUrgency
    patient_reference_code: str
    notes: Optional[str] = None
    status: RequestStatus
    tracking_token: str
    created_at: datetime
    product: Optional[BloodProductOut] = None

class RequestStatusUpdate(BaseModel):
    status: RequestStatus
    reason: Optional[str] = None
