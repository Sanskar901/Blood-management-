from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.core.config import settings
from backend.app.models.enums import (
    HospitalStatus,
    RequestStatus,
    ReservationStatus,
    TransactionType,
)
from backend.app.models.hospital import Hospital
from backend.app.models.inventory import InventoryBalance, InventoryTransaction
from backend.app.models.request import BloodRequest
from backend.app.models.reservation import Reservation
from backend.app.models.audit import AuditLog

async def create_atomic_reservation(
    db: AsyncSession,
    request_id: str,
    idempotency_key: str,
    actor_id: Optional[str] = None
) -> Reservation:
    """
    Executes an atomic pessimistic reservation workflow.
    Guarantees no race-condition overbooking, zero negative stock,
    and strict idempotency deduplication.
    """
    # 1. Check for existing reservation with the exact same idempotency key
    existing_key_stmt = select(Reservation).where(Reservation.idempotency_key == idempotency_key)
    existing_key_res = await db.execute(existing_key_stmt)
    existing_reservation = existing_key_res.scalar_one_or_none()
    
    if existing_reservation:
        if existing_reservation.request_id != request_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Idempotency key reused with a different request payload."
            )
        return existing_reservation

    # 2. Fetch the blood request
    req_stmt = select(BloodRequest).where(BloodRequest.id == request_id)
    req_res = await db.execute(req_stmt)
    request_obj = req_res.scalar_one_or_none()
    
    if not request_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found."
        )

    if request_obj.status not in (RequestStatus.SUBMITTED, RequestStatus.UNDER_REVIEW):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reserve request in status: {request_obj.status.value}"
        )

    # 3. Validate hospital status
    hosp_stmt = select(Hospital).where(Hospital.id == request_obj.hospital_id)
    hosp_res = await db.execute(hosp_stmt)
    hospital = hosp_res.scalar_one_or_none()
    
    if not hospital or hospital.approval_status != HospitalStatus.APPROVED or not hospital.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hospital is not approved or inactive. Inventory reservation prohibited."
        )

    # 4. Acquire Pessimistic Row Lock on the Inventory Balance
    # Ordering by id ensures stable deterministic lock acquisition to avoid deadlocks
    balance_stmt = (
        select(InventoryBalance)
        .where(
            and_(
                InventoryBalance.hospital_id == request_obj.hospital_id,
                InventoryBalance.product_id == request_obj.product_id
            )
        )
        .order_by(InventoryBalance.id.asc())
        .with_for_update()
    )
    
    balance_res = await db.execute(balance_stmt)
    balance = balance_res.scalar_one_or_none()

    if not balance:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "No inventory record exists for this product at this hospital.",
                "requested_units": request_obj.units_requested,
                "available_units": 0
            }
        )

    # 5. Check available stock strictly inside the locked transaction
    requested_units = request_obj.units_requested
    if balance.available_units < requested_units:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Insufficient stock to complete reservation hold.",
                "requested_units": requested_units,
                "available_units": balance.available_units
            }
        )

    # 6. Apply stock reservation update atomically
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.DEFAULT_RESERVATION_TIMEOUT_MINUTES)

    balance.reserved_units += requested_units
    balance.available_units = balance.total_units - balance.reserved_units
    balance.version += 1

    # 7. Create Reservation record
    reservation = Reservation(
        request_id=request_obj.id,
        hospital_id=request_obj.hospital_id,
        product_id=request_obj.product_id,
        units_reserved=requested_units,
        idempotency_key=idempotency_key,
        status=ReservationStatus.ACTIVE,
        expires_at=expires_at
    )
    db.add(reservation)
    await db.flush()  # flush to generate reservation.id

    # 8. Append Immutable Inventory Ledger Record
    ledger_entry = InventoryTransaction(
        hospital_id=request_obj.hospital_id,
        product_id=request_obj.product_id,
        transaction_type=TransactionType.RESERVATION_HOLD,
        quantity_delta=-requested_units,
        reason=f"Reservation hold placed for request {request_obj.id} (Ref: {request_obj.patient_reference_code})",
        actor_id=actor_id,
        reservation_id=reservation.id
    )
    db.add(ledger_entry)

    # 9. Transition Blood Request status
    request_obj.status = RequestStatus.RESERVED
    
    # 10. Audit Log
    audit = AuditLog(
        actor_id=actor_id,
        action="RESERVATION_CREATED",
        target_type="Reservation",
        target_id=reservation.id,
        details=f"Reserved {requested_units} units for request {request_obj.id} at hospital {request_obj.hospital_id}"
    )
    db.add(audit)

    await db.commit()
    await db.refresh(reservation)
    return reservation

async def cancel_or_release_reservation(
    db: AsyncSession,
    reservation_id: str,
    reason: str,
    actor_id: Optional[str] = None
) -> Reservation:
    """
    Atomically releases an active reservation hold exactly once.
    Prevents double-release races between competing cancellation and expiry workers.
    """
    # 1. Lock the reservation row
    res_stmt = (
        select(Reservation)
        .where(Reservation.id == reservation_id)
        .with_for_update()
    )
    res_result = await db.execute(res_stmt)
    reservation = res_result.scalar_one_or_none()

    if not reservation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")

    if reservation.status != ReservationStatus.ACTIVE:
        # Already released, cancelled, or confirmed - return without modifying stock
        return reservation

    # 2. Lock the inventory balance row
    bal_stmt = (
        select(InventoryBalance)
        .where(
            and_(
                InventoryBalance.hospital_id == reservation.hospital_id,
                InventoryBalance.product_id == reservation.product_id
            )
        )
        .with_for_update()
    )
    bal_result = await db.execute(bal_stmt)
    balance = bal_result.scalar_one_or_none()

    if balance:
        balance.reserved_units = max(0, balance.reserved_units - reservation.units_reserved)
        balance.available_units = balance.total_units - balance.reserved_units
        balance.version += 1

    # 3. Mark reservation released
    now = datetime.now(timezone.utc)
    reservation.status = ReservationStatus.RELEASED
    reservation.released_at = now

    # 4. Update request status
    req_stmt = select(BloodRequest).where(BloodRequest.id == reservation.request_id)
    req_res = await db.execute(req_stmt)
    request_obj = req_res.scalar_one_or_none()
    if request_obj and request_obj.status == RequestStatus.RESERVED:
        request_obj.status = RequestStatus.CANCELLED

    # 5. Ledger record
    ledger = InventoryTransaction(
        hospital_id=reservation.hospital_id,
        product_id=reservation.product_id,
        transaction_type=TransactionType.RESERVATION_RELEASE,
        quantity_delta=reservation.units_reserved,
        reason=f"Reservation {reservation.id} cancelled/released: {reason}",
        actor_id=actor_id,
        reservation_id=reservation.id
    )
    db.add(ledger)

    # 6. Audit
    audit = AuditLog(
        actor_id=actor_id,
        action="RESERVATION_RELEASED",
        target_type="Reservation",
        target_id=reservation.id,
        details=f"Released {reservation.units_reserved} units. Reason: {reason}"
    )
    db.add(audit)

    await db.commit()
    await db.refresh(reservation)
    return reservation

async def fulfil_reservation(
    db: AsyncSession,
    reservation_id: str,
    actor_id: str
) -> Reservation:
    """
    Hospital-authorized clinical verification and physical blood issue fulfilment.
    Transitions reservation to CONFIRMED, request to FULFILLED,
    and converts the reserved stock into a permanent deduction.
    """
    res_stmt = (
        select(Reservation)
        .where(Reservation.id == reservation_id)
        .with_for_update()
    )
    res_result = await db.execute(res_stmt)
    reservation = res_result.scalar_one_or_none()

    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    if reservation.status != ReservationStatus.ACTIVE:
        raise HTTPException(status_code=400, detail=f"Cannot fulfil reservation in status: {reservation.status.value}")

    bal_stmt = (
        select(InventoryBalance)
        .where(
            and_(
                InventoryBalance.hospital_id == reservation.hospital_id,
                InventoryBalance.product_id == reservation.product_id
            )
        )
        .with_for_update()
    )
    bal_res = await db.execute(bal_stmt)
    balance = bal_res.scalar_one_or_none()

    if not balance:
        raise HTTPException(status_code=404, detail="Inventory balance not found")

    # Deduct permanently from total and release reserved
    balance.reserved_units = max(0, balance.reserved_units - reservation.units_reserved)
    balance.total_units = max(0, balance.total_units - reservation.units_reserved)
    balance.available_units = balance.total_units - balance.reserved_units
    balance.version += 1

    now = datetime.now(timezone.utc)
    reservation.status = ReservationStatus.CONFIRMED
    reservation.confirmed_at = now

    req_stmt = select(BloodRequest).where(BloodRequest.id == reservation.request_id)
    req_res = await db.execute(req_stmt)
    req_obj = req_res.scalar_one_or_none()
    if req_obj:
        req_obj.status = RequestStatus.FULFILLED

    # Ledger
    ledger = InventoryTransaction(
        hospital_id=reservation.hospital_id,
        product_id=reservation.product_id,
        transaction_type=TransactionType.ISSUE_FULFILMENT,
        quantity_delta=-reservation.units_reserved,
        reason=f"Clinically verified issue fulfilled for request {reservation.request_id}",
        actor_id=actor_id,
        reservation_id=reservation.id
    )
    db.add(ledger)

    # Audit
    audit = AuditLog(
        actor_id=actor_id,
        action="RESERVATION_FULFILLED",
        target_type="Reservation",
        target_id=reservation.id,
        details=f"Issued {reservation.units_reserved} units to requester"
    )
    db.add(audit)

    await db.commit()
    await db.refresh(reservation)
    return reservation
