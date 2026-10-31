from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AdminDashboardMetrics(BaseModel):
    total_hospitals: int
    pending_approvals: int
    active_hospitals: int
    total_units_in_stock: int
    active_reservations: int
    total_requests: int
    critical_shortages_count: int

class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    actor_id: Optional[str] = None
    action: str
    target_type: str
    target_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
