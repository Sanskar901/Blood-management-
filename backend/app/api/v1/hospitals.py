from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_role
from backend.app.models.user import User
from backend.app.models.hospital import Hospital
from backend.app.models.enums import UserRole, HospitalStatus
from backend.app.models.audit import AuditLog
from backend.app.schemas.hospital import HospitalCreate, HospitalOut, HospitalStatusUpdate

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])

@router.get("", response_model=List[HospitalOut])
async def list_hospitals(
    status_filter: Optional[HospitalStatus] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Hospital)
    if status_filter:
        stmt = stmt.where(Hospital.approval_status == status_filter)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{hospital_id}", response_model=HospitalOut)
async def get_hospital(hospital_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Hospital).where(Hospital.id == hospital_id)
    result = await db.execute(stmt)
    hospital = result.scalar_one_or_none()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital

@router.post("/apply", response_model=HospitalOut, status_code=status.HTTP_201_CREATED)
async def apply_hospital(
    hospital_in: HospitalCreate,
    db: AsyncSession = Depends(get_db)
):
    # Check unique licence number
    stmt = select(Hospital).where(Hospital.licence_number == hospital_in.licence_number.strip())
    existing = await db.execute(stmt)
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="A hospital with this licence number is already registered")

    hospital = Hospital(
        name=hospital_in.name,
        licence_number=hospital_in.licence_number.strip(),
        address=hospital_in.address,
        pin_code=hospital_in.pin_code,
        city=hospital_in.city,
        state=hospital_in.state,
        latitude=hospital_in.latitude,
        longitude=hospital_in.longitude,
        contact_phone=hospital_in.contact_phone,
        contact_email=hospital_in.contact_email,
        emergency_helpline=hospital_in.emergency_helpline,
        approval_status=HospitalStatus.PENDING,
        is_active=True
    )
    db.add(hospital)
    await db.commit()
    await db.refresh(hospital)
    return hospital

@router.patch("/{hospital_id}/status", response_model=HospitalOut)
async def update_hospital_status(
    hospital_id: str,
    status_update: HospitalStatusUpdate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Hospital).where(Hospital.id == hospital_id)
    result = await db.execute(stmt)
    hospital = result.scalar_one_or_none()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    old_status = hospital.approval_status
    hospital.approval_status = status_update.approval_status
    hospital.is_active = status_update.approval_status == HospitalStatus.APPROVED

    old_status_val = getattr(old_status, "value", str(old_status))
    new_status_val = getattr(status_update.approval_status, "value", str(status_update.approval_status))
    
    # Audit log
    audit = AuditLog(
        actor_id=current_user.id,
        action="HOSPITAL_STATUS_CHANGED",
        target_type="Hospital",
        target_id=hospital.id,
        details=f"Status transitioned from {old_status_val} to {new_status_val}. Reason: {status_update.reason or 'N/A'}"
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(hospital)
    return hospital
