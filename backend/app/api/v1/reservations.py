from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_role
from backend.app.models.user import User
from backend.app.models.reservation import Reservation
from backend.app.models.enums import UserRole
from backend.app.services.reservation_service import (
    create_atomic_reservation,
    cancel_or_release_reservation,
    fulfil_reservation,
)
from backend.app.schemas.reservation import ReservationCreate, ReservationOut

router = APIRouter(prefix="/reservations", tags=["Reservations"])

@router.post("", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
async def reserve_stock(
    res_in: ReservationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Atomically places a 30-minute hold on blood units.
    Uses pessimistic row locks and an idempotency key to prevent overbooking races.
    """
    return await create_atomic_reservation(
        db=db,
        request_id=res_in.request_id,
        idempotency_key=res_in.idempotency_key,
        actor_id=current_user.id
    )

@router.post("/{reservation_id}/cancel", response_model=ReservationOut)
async def cancel_reservation(
    reservation_id: str,
    reason: str = "User cancelled hold",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Atomically cancels the reservation and releases reserved inventory.
    """
    return await cancel_or_release_reservation(
        db=db,
        reservation_id=reservation_id,
        reason=reason,
        actor_id=current_user.id
    )

@router.post("/{reservation_id}/fulfil", response_model=ReservationOut)
async def complete_fulfilment(
    reservation_id: str,
    current_user: User = Depends(require_role(UserRole.HOSPITAL_STAFF)),
    db: AsyncSession = Depends(get_db)
):
    """
    Hospital clinical verification and permanent stock issue fulfilment.
    """
    # Verify that the reservation belongs to this hospital
    stmt = select(Reservation).where(Reservation.id == reservation_id)
    res = await db.execute(stmt)
    reservation = res.scalar_one_or_none()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
        
    if reservation.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Cannot fulfil reservations for another hospital")

    return await fulfil_reservation(
        db=db,
        reservation_id=reservation_id,
        actor_id=current_user.id
    )
