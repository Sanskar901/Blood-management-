import math
from typing import Optional, List
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models.enums import BloodGroup, BloodComponent, HospitalStatus
from backend.app.models.hospital import Hospital
from backend.app.models.blood_product import BloodProduct
from backend.app.models.inventory import InventoryBalance
from backend.app.schemas.search import SearchResponse, SearchResultItem
from backend.app.schemas.hospital import HospitalOut

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the approximate straight-line distance in kilometers between two points
    on the Earth using the Haversine formula.
    """
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

async def search_blood_inventory(
    db: AsyncSession,
    blood_group: BloodGroup,
    component_type: BloodComponent,
    quantity: int = 1,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    pin_code: Optional[str] = None,
    max_radius_km: Optional[float] = None
) -> SearchResponse:
    # 1. Locate the product
    product_stmt = select(BloodProduct).where(
        and_(
            BloodProduct.blood_group == blood_group,
            BloodProduct.component_type == component_type
        )
    )
    product_res = await db.execute(product_stmt)
    product = product_res.scalar_one_or_none()
    
    if not product:
        return SearchResponse(
            blood_group=blood_group,
            component_type=component_type,
            requested_quantity=quantity,
            total_results=0,
            results=[]
        )

    # 2. Query balances for approved & active hospitals
    stmt = (
        select(InventoryBalance, Hospital)
        .join(Hospital, InventoryBalance.hospital_id == Hospital.id)
        .where(
            and_(
                InventoryBalance.product_id == product.id,
                Hospital.approval_status == HospitalStatus.APPROVED,
                Hospital.is_active == True,
                InventoryBalance.available_units > 0
            )
        )
    )
    
    if pin_code:
        stmt = stmt.where(Hospital.pin_code == pin_code)

    res = await db.execute(stmt)
    rows = res.all()

    items: List[SearchResultItem] = []
    for balance, hospital in rows:
        distance: Optional[float] = None
        if lat is not None and lng is not None:
            distance = haversine_distance(lat, lng, hospital.latitude, hospital.longitude)
            if max_radius_km and distance > max_radius_km:
                continue

        can_fully_fulfil = balance.available_units >= quantity

        items.append(
            SearchResultItem(
                hospital=HospitalOut.model_validate(hospital),
                product_id=product.id,
                blood_group=blood_group,
                component_type=component_type,
                available_units=balance.available_units,
                requested_units=quantity,
                can_fully_fulfil=can_fully_fulfil,
                distance_km=distance,
                distance_label="Approximate straight-line distance" if distance is not None else "Distance not requested",
                last_verified_at=balance.updated_at.isoformat() if balance.updated_at else None
            )
        )

    # Sort results:
    # Priority 1: Can fully fulfil (True before False)
    # Priority 2: Distance ascending (if available), then Available units descending
    def sort_key(item: SearchResultItem):
        full_match = 0 if item.can_fully_fulfil else 1
        dist = item.distance_km if item.distance_km is not None else 999999.0
        avail = -item.available_units
        return (full_match, dist, avail)

    items.sort(key=sort_key)

    return SearchResponse(
        blood_group=blood_group,
        component_type=component_type,
        requested_quantity=quantity,
        total_results=len(items),
        results=items
    )
