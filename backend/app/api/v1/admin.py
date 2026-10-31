import io
import csv
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db
from backend.app.core.security import require_role
from backend.app.models.user import User
from backend.app.models.hospital import Hospital
from backend.app.models.inventory import InventoryBalance
from backend.app.models.request import BloodRequest
from backend.app.models.reservation import Reservation
from backend.app.models.audit import AuditLog
from backend.app.models.enums import UserRole, HospitalStatus, ReservationStatus
from backend.app.schemas.admin import AdminDashboardMetrics, AuditLogOut

router = APIRouter(prefix="/admin", tags=["Super Admin Operations"])

@router.get("/dashboard", response_model=AdminDashboardMetrics)
async def get_dashboard_metrics(
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    total_hosp_res = await db.execute(select(func.count(Hospital.id)))
    total_hospitals = int(total_hosp_res.scalar() or 0)

    pending_hosp_res = await db.execute(
        select(func.count(Hospital.id)).where(Hospital.approval_status == HospitalStatus.PENDING)
    )
    pending_approvals = int(pending_hosp_res.scalar() or 0)

    active_hosp_res = await db.execute(
        select(func.count(Hospital.id)).where(
            and_(
                Hospital.approval_status == HospitalStatus.APPROVED,
                Hospital.is_active == True
            )
        )
    )
    active_hospitals = int(active_hosp_res.scalar() or 0)

    stock_res = await db.execute(select(func.sum(InventoryBalance.total_units)))
    total_units_in_stock = int(stock_res.scalar() or 0)

    active_res_count = await db.execute(
        select(func.count(Reservation.id)).where(Reservation.status == ReservationStatus.ACTIVE)
    )
    active_reservations = int(active_res_count.scalar() or 0)

    total_req_count = await db.execute(select(func.count(BloodRequest.id)))
    total_requests = int(total_req_count.scalar() or 0)

    shortages_res = await db.execute(
        select(func.count(InventoryBalance.id)).where(InventoryBalance.available_units <= 2)
    )
    critical_shortages_count = int(shortages_res.scalar() or 0)

    return AdminDashboardMetrics(
        total_hospitals=total_hospitals,
        pending_approvals=pending_approvals,
        active_hospitals=active_hospitals,
        total_units_in_stock=total_units_in_stock,
        active_reservations=active_reservations,
        total_requests=total_requests,
        critical_shortages_count=critical_shortages_count
    )

@router.get("/audit-logs", response_model=List[AuditLogOut])
async def get_audit_logs(
    action: Optional[str] = Query(None),
    target_type: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AuditLog)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if target_type:
        stmt = stmt.where(AuditLog.target_type == target_type)
    stmt = stmt.order_by(AuditLog.created_at.desc()).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/export/inventory")
async def export_inventory_csv(
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(InventoryBalance, Hospital)
        .join(Hospital, InventoryBalance.hospital_id == Hospital.id)
        .options(selectinload(InventoryBalance.product))
    )
    res = await db.execute(stmt)
    rows = res.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Hospital ID",
        "Hospital Name",
        "City",
        "Blood Group",
        "Component Type",
        "Total Units",
        "Reserved Units",
        "Available Units",
        "Last Updated UTC",
        "Disclaimer"
    ])

    for balance, hospital in rows:
        bg_val = getattr(balance.product.blood_group, "value", str(balance.product.blood_group)) if balance.product else "N/A"
        comp_val = getattr(balance.product.component_type, "value", str(balance.product.component_type)) if balance.product else "N/A"
        writer.writerow([
            hospital.id,
            hospital.name,
            hospital.city,
            bg_val,
            comp_val,
            balance.total_units,
            balance.reserved_units,
            balance.available_units,
            balance.updated_at.isoformat() if balance.updated_at else "",
            "CONFIDENTIAL MEDICAL AUDIT - NBTC COMPLIANT"
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=bloodconnect_inventory_export.csv"}
    )
