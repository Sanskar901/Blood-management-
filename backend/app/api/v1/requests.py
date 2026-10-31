from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_role
from backend.app.models.user import User
from backend.app.models.request import BloodRequest
from backend.app.models.enums import UserRole, RequestStatus
from backend.app.models.audit import AuditLog
from backend.app.schemas.request import BloodRequestCreate, BloodRequestOut, RequestStatusUpdate

router = APIRouter(prefix="/requests", tags=["Blood Requests"])

@router.post("", response_model=BloodRequestOut, status_code=status.HTTP_201_CREATED)
async def create_request(
    req_in: BloodRequestCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    request_obj = BloodRequest(
        requester_id=current_user.id if current_user else None,
        hospital_id=req_in.hospital_id,
        product_id=req_in.product_id,
        units_requested=req_in.units_requested,
        urgency_level=req_in.urgency_level,
        patient_reference_code=req_in.patient_reference_code,
        notes=req_in.notes,
        status=RequestStatus.SUBMITTED
    )
    db.add(request_obj)
    await db.commit()
    await db.refresh(request_obj)

    stmt = select(BloodRequest).where(BloodRequest.id == request_obj.id).options(selectinload(BloodRequest.product))
    res = await db.execute(stmt)
    return res.scalar_one()

@router.get("/track/{tracking_token}", response_model=BloodRequestOut)
async def track_request_by_token(tracking_token: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(BloodRequest)
        .where(BloodRequest.tracking_token == tracking_token.strip())
        .options(selectinload(BloodRequest.product))
    )
    res = await db.execute(stmt)
    request_obj = res.scalar_one_or_none()
    if not request_obj:
        raise HTTPException(status_code=404, detail="Request not found with this tracking token")
    return request_obj

@router.get("/hospital", response_model=List[BloodRequestOut])
async def list_hospital_requests(
    current_user: User = Depends(require_role(UserRole.HOSPITAL_STAFF, UserRole.SUPER_ADMIN)),
    hospital_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    target_hospital_id = current_user.hospital_id
    if current_user.role == UserRole.SUPER_ADMIN and hospital_id:
        target_hospital_id = hospital_id

    if not target_hospital_id:
        raise HTTPException(status_code=400, detail="User is not linked to any hospital")

    stmt = (
        select(BloodRequest)
        .where(BloodRequest.hospital_id == target_hospital_id)
        .options(selectinload(BloodRequest.product))
        .order_by(BloodRequest.created_at.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()

@router.patch("/{request_id}/status", response_model=BloodRequestOut)
async def update_request_status(
    request_id: str,
    status_in: RequestStatusUpdate,
    current_user: User = Depends(require_role(UserRole.HOSPITAL_STAFF, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(BloodRequest).where(BloodRequest.id == request_id).options(selectinload(BloodRequest.product))
    res = await db.execute(stmt)
    request_obj = res.scalar_one_or_none()
    
    if not request_obj:
        raise HTTPException(status_code=404, detail="Request not found")

    if current_user.role == UserRole.HOSPITAL_STAFF and request_obj.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Cannot modify requests for another hospital")

    request_obj.status = status_in.status
    
    new_status_val = getattr(status_in.status, "value", str(status_in.status))
    audit = AuditLog(
        actor_id=current_user.id,
        action="REQUEST_STATUS_UPDATED",
        target_type="BloodRequest",
        target_id=request_obj.id,
        details=f"Status set to {new_status_val}. Reason: {status_in.reason or 'N/A'}"
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(request_obj)
    return request_obj
