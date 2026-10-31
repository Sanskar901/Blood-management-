from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.models.enums import BloodGroup, BloodComponent
from backend.app.services.search_service import search_blood_inventory
from backend.app.schemas.search import SearchResponse

router = APIRouter(prefix="/search", tags=["Public Discovery"])

@router.get("", response_model=SearchResponse)
async def search_inventory(
    blood_group: BloodGroup = Query(..., description="Target blood group (e.g. A+, O-, B+)"),
    component_type: BloodComponent = Query(..., description="Component type"),
    quantity: int = Query(1, ge=1, le=50, description="Required number of units"),
    lat: Optional[float] = Query(None, description="Requester latitude for distance sorting"),
    lng: Optional[float] = Query(None, description="Requester longitude for distance sorting"),
    pin_code: Optional[str] = Query(None, description="Optional target PIN code filter"),
    max_radius_km: Optional[float] = Query(None, description="Search radius limit in km"),
    db: AsyncSession = Depends(get_db)
):
    """
    Search available verified inventory across approved hospitals.
    Sorted by full fulfilment capability first, then distance.
    Regulated under NBTC clinical standards.
    """
    return await search_blood_inventory(
        db=db,
        blood_group=blood_group,
        component_type=component_type,
        quantity=quantity,
        lat=lat,
        lng=lng,
        pin_code=pin_code,
        max_radius_km=max_radius_km
    )
