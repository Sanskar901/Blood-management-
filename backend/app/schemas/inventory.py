from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict
from backend.app.models.enums import BloodGroup, BloodComponent, TransactionType

class BloodProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    blood_group: BloodGroup
    component_type: BloodComponent
    storage_temp_c: str
    shelf_life_days: int
    description: Optional[str] = None

class InventoryLotCreate(BaseModel):
    product_id: str
    batch_number: str
    quantity: int = Field(gt=0, description="Quantity of units to add")
    donation_date: date
    expiry_date: date

class InventoryLotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    hospital_id: str
    product_id: str
    batch_number: str
    quantity: int
    donation_date: date
    expiry_date: date
    verification_status: str
    created_at: datetime
    product: Optional[BloodProductOut] = None

class InventoryBalanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    hospital_id: str
    product_id: str
    total_units: int
    reserved_units: int
    available_units: int
    updated_at: datetime
    product: Optional[BloodProductOut] = None

class StockAdjustmentCreate(BaseModel):
    product_id: str
    lot_id: Optional[str] = None
    quantity_delta: int = Field(..., description="Positive for addition, negative for deduction")
    reason: str = Field(..., min_length=5, description="Auditable justification for the stock adjustment")

class InventoryTransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    hospital_id: str
    product_id: str
    lot_id: Optional[str] = None
    transaction_type: TransactionType
    quantity_delta: int
    reason: str
    actor_id: Optional[str] = None
    created_at: datetime
