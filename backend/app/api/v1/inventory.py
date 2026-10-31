from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_role
from backend.app.models.user import User
from backend.app.models.hospital import Hospital
from backend.app.models.blood_product import BloodProduct
from backend.app.models.inventory import InventoryLot, InventoryBalance, InventoryTransaction
from backend.app.models.audit import AuditLog
from backend.app.models.enums import UserRole, TransactionType
from backend.app.schemas.inventory import (
    BloodProductOut,
    InventoryLotCreate,
    InventoryLotOut,
    InventoryBalanceOut,
    StockAdjustmentCreate,
    InventoryTransactionOut
)

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])

@router.get("/products", response_model=List[BloodProductOut])
async def list_blood_products(db: AsyncSession = Depends(get_db)):
    stmt = select(BloodProduct).order_by(BloodProduct.blood_group, BloodProduct.component_type)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/balances", response_model=List[InventoryBalanceOut])
async def get_my_hospital_balances(
    current_user: User = Depends(require_role(UserRole.HOSPITAL_STAFF, UserRole.SUPER_ADMIN)),
    hospital_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    target_hospital_id = current_user.hospital_id
    if current_user.role == UserRole.SUPER_ADMIN and hospital_id:
        target_hospital_id = hospital_id

    if not target_hospital_id:
        raise HTTPException(status_code=400, detail="No hospital associated with this account")

    stmt = (
        select(InventoryBalance)
        .where(InventoryBalance.hospital_id == target_hospital_id)
        .options(selectinload(InventoryBalance.product))
    )
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/lots", response_model=List[InventoryLotOut])
async def get_my_hospital_lots(
    current_user: User = Depends(require_role(UserRole.HOSPITAL_STAFF, UserRole.SUPER_ADMIN)),
    hospital_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    target_hospital_id = current_user.hospital_id
    if current_user.role == UserRole.SUPER_ADMIN and hospital_id:
        target_hospital_id = hospital_id

    if not target_hospital_id:
        raise HTTPException(status_code=400, detail="No hospital associated with this account")

    stmt = (
        select(InventoryLot)
        .where(InventoryLot.hospital_id == target_hospital_id)
        .options(selectinload(InventoryLot.product))
        .order_by(InventoryLot.expiry_date.asc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/lots", response_model=InventoryLotOut, status_code=status.HTTP_201_CREATED)
async def add_inventory_lot(
    lot_in: InventoryLotCreate,
    current_user: User = Depends(require_role(UserRole.HOSPITAL_STAFF)),
    db: AsyncSession = Depends(get_db)
):
    hospital_id = current_user.hospital_id
    if not hospital_id:
        raise HTTPException(status_code=400, detail="User is not linked to any hospital")

    # Check batch uniqueness in hospital
    batch_stmt = select(InventoryLot).where(
        and_(
            InventoryLot.hospital_id == hospital_id,
            InventoryLot.batch_number == lot_in.batch_number.strip()
        )
    )
    batch_res = await db.execute(batch_stmt)
    if batch_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Batch number already registered at this hospital")

    # Create lot
    lot = InventoryLot(
        hospital_id=hospital_id,
        product_id=lot_in.product_id,
        batch_number=lot_in.batch_number.strip(),
        quantity=lot_in.quantity,
        donation_date=lot_in.donation_date,
        expiry_date=lot_in.expiry_date,
        verification_status="VERIFIED"
    )
    db.add(lot)
    await db.flush()

    # Update or create balance atomically
    bal_stmt = (
        select(InventoryBalance)
        .where(
            and_(
                InventoryBalance.hospital_id == hospital_id,
                InventoryBalance.product_id == lot_in.product_id
            )
        )
        .with_for_update()
    )
    bal_res = await db.execute(bal_stmt)
    balance = bal_res.scalar_one_or_none()

    if not balance:
        balance = InventoryBalance(
            hospital_id=hospital_id,
            product_id=lot_in.product_id,
            total_units=lot_in.quantity,
            reserved_units=0,
            available_units=lot_in.quantity,
            version=1
        )
        db.add(balance)
    else:
        balance.total_units += lot_in.quantity
        balance.available_units = balance.total_units - balance.reserved_units
        balance.version += 1

    # Ledger entry
    ledger = InventoryTransaction(
        hospital_id=hospital_id,
        product_id=lot_in.product_id,
        lot_id=lot.id,
        transaction_type=TransactionType.DONATION_INFLOW,
        quantity_delta=lot_in.quantity,
        reason=f"Batch {lot.batch_number} received and verified into stock",
        actor_id=current_user.id
    )
    db.add(ledger)

    # Audit log
    audit = AuditLog(
        actor_id=current_user.id,
        action="INVENTORY_LOT_ADDED",
        target_type="InventoryLot",
        target_id=lot.id,
        details=f"Added lot {lot.batch_number} with {lot_in.quantity} units"
    )
    db.add(audit)

    await db.commit()
    await db.refresh(lot)
    
    # Reload with product relation
    stmt = select(InventoryLot).where(InventoryLot.id == lot.id).options(selectinload(InventoryLot.product))
    res = await db.execute(stmt)
    return res.scalar_one()

@router.post("/adjust", response_model=InventoryBalanceOut)
async def adjust_stock(
    adj_in: StockAdjustmentCreate,
    current_user: User = Depends(require_role(UserRole.HOSPITAL_STAFF)),
    db: AsyncSession = Depends(get_db)
):
    hospital_id = current_user.hospital_id
    if not hospital_id:
        raise HTTPException(status_code=400, detail="User is not linked to any hospital")

    # Lock balance row
    bal_stmt = (
        select(InventoryBalance)
        .where(
            and_(
                InventoryBalance.hospital_id == hospital_id,
                InventoryBalance.product_id == adj_in.product_id
            )
        )
        .with_for_update()
    )
    bal_res = await db.execute(bal_stmt)
    balance = bal_res.scalar_one_or_none()

    if not balance:
        raise HTTPException(status_code=404, detail="Inventory balance not found for this product")

    new_total = balance.total_units + adj_in.quantity_delta
    new_available = new_total - balance.reserved_units

    if new_total < 0 or new_available < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Adjustment would result in negative stock. Current available: {balance.available_units}"
        )

    balance.total_units = new_total
    balance.available_units = new_available
    balance.version += 1

    # Ledger entry
    ledger = InventoryTransaction(
        hospital_id=hospital_id,
        product_id=adj_in.product_id,
        lot_id=adj_in.lot_id,
        transaction_type=TransactionType.STOCK_ADJUSTMENT,
        quantity_delta=adj_in.quantity_delta,
        reason=adj_in.reason,
        actor_id=current_user.id
    )
    db.add(ledger)

    # Audit
    audit = AuditLog(
        actor_id=current_user.id,
        action="STOCK_ADJUSTED",
        target_type="InventoryBalance",
        target_id=balance.id,
        details=f"Stock adjusted by {adj_in.quantity_delta}. Reason: {adj_in.reason}"
    )
    db.add(audit)

    await db.commit()
    await db.refresh(balance)

    stmt = select(InventoryBalance).where(InventoryBalance.id == balance.id).options(selectinload(InventoryBalance.product))
    res = await db.execute(stmt)
    return res.scalar_one()

@router.get("/transactions", response_model=List[InventoryTransactionOut])
async def get_inventory_transactions(
    current_user: User = Depends(require_role(UserRole.HOSPITAL_STAFF, UserRole.SUPER_ADMIN)),
    hospital_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    target_hospital_id = current_user.hospital_id
    if current_user.role == UserRole.SUPER_ADMIN and hospital_id:
        target_hospital_id = hospital_id

    if not target_hospital_id:
        raise HTTPException(status_code=400, detail="No hospital associated with this account")

    stmt = (
        select(InventoryTransaction)
        .where(InventoryTransaction.hospital_id == target_hospital_id)
        .order_by(InventoryTransaction.created_at.desc())
        .limit(100)
    )
    res = await db.execute(stmt)
    return res.scalars().all()
