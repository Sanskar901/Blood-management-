from typing import Optional, List
from pydantic import BaseModel
from backend.app.models.enums import BloodGroup, BloodComponent
from backend.app.schemas.hospital import HospitalOut

class SearchResultItem(BaseModel):
    hospital: HospitalOut
    product_id: str
    blood_group: BloodGroup
    component_type: BloodComponent
    available_units: int
    requested_units: int
    can_fully_fulfil: bool
    distance_km: Optional[float] = None
    distance_label: str = "Approximate straight-line distance"
    last_verified_at: Optional[str] = None
    regulatory_notice: str = "Regulated under National Blood Transfusion Council (NBTC) clinical standards"
    disclaimer: str = "Regulated under National Blood Transfusion Council (NBTC) clinical standards"

class SearchResponse(BaseModel):
    blood_group: BloodGroup
    component_type: BloodComponent
    requested_quantity: int
    total_results: int
    results: List[SearchResultItem]
