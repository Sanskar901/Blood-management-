import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.enums import (
    BloodGroup,
    BloodComponent,
    HospitalStatus,
    RequestStatus,
    ReservationStatus,
)
from backend.app.models.hospital import Hospital
from backend.app.models.blood_product import BloodProduct
from backend.app.models.inventory import InventoryBalance
from backend.app.models.request import BloodRequest
from backend.app.services.reservation_service import (
    create_atomic_reservation,
    cancel_or_release_reservation
)
from fastapi import HTTPException

async def _get_or_create_product(db_session: AsyncSession, bg: BloodGroup, comp: BloodComponent, temp: str = "4C", shelf: int = 35) -> BloodProduct:
    stmt = select(BloodProduct).where(BloodProduct.blood_group == bg, BloodProduct.component_type == comp)
    res = await db_session.execute(stmt)
    existing = res.scalar_one_or_none()
    if existing:
        return existing
    prod = BloodProduct(
        blood_group=bg,
        component_type=comp,
        storage_temp_c=temp,
        shelf_life_days=shelf
    )
    db_session.add(prod)
    await db_session.flush()
    return prod

@pytest.mark.asyncio
async def test_idempotency_prevents_duplicate_reservations(db_session: AsyncSession):
    # Setup test hospital & product
    hosp = Hospital(
        name="Test Idempotency Hospital",
        licence_number="LIC-IDEMP-001",
        address="123 Test Road",
        pin_code="110001",
        city="Test City",
        state="Test State",
        latitude=28.0,
        longitude=77.0,
        contact_phone="1234567890",
        contact_email="test@idemp.com",
        approval_status=HospitalStatus.APPROVED,
        is_active=True
    )
    db_session.add(hosp)
    prod = await _get_or_create_product(db_session, BloodGroup.AB_POSITIVE, BloodComponent.PLASMA, "-18C", 365)
    await db_session.flush()

    bal = InventoryBalance(
        hospital_id=hosp.id,
        product_id=prod.id,
        total_units=10,
        reserved_units=0,
        available_units=10,
        version=1
    )
    req = BloodRequest(
        hospital_id=hosp.id,
        product_id=prod.id,
        units_requested=3,
        patient_reference_code="REF-IDEMP-1"
    )
    db_session.add_all([bal, req])
    await db_session.commit()

    idempotency_key = "idemp-key-unique-12345"

    # First call
    res1 = await create_atomic_reservation(
        db=db_session,
        request_id=req.id,
        idempotency_key=idempotency_key
    )
    assert res1.units_reserved == 3
    assert res1.status == ReservationStatus.ACTIVE

    # Verify balance was decremented to 7
    await db_session.refresh(bal)
    assert bal.available_units == 7
    assert bal.reserved_units == 3

    # Duplicate call with same key
    res2 = await create_atomic_reservation(
        db=db_session,
        request_id=req.id,
        idempotency_key=idempotency_key
    )
    assert res2.id == res1.id

    # Verify balance was NOT double-decremented!
    await db_session.refresh(bal)
    assert bal.available_units == 7
    assert bal.reserved_units == 3

@pytest.mark.asyncio
async def test_double_cancellation_releases_stock_only_once(db_session: AsyncSession):
    # Setup hospital & product
    hosp = Hospital(
        name="Test Cancellation Hospital",
        licence_number="LIC-CANCEL-001",
        address="456 Cancel Road",
        pin_code="110001",
        city="Test City",
        state="Test State",
        latitude=28.0,
        longitude=77.0,
        contact_phone="1234567890",
        contact_email="test@cancel.com",
        approval_status=HospitalStatus.APPROVED,
        is_active=True
    )
    db_session.add(hosp)
    prod = await _get_or_create_product(db_session, BloodGroup.O_NEGATIVE, BloodComponent.RED_BLOOD_CELLS, "4C", 42)
    await db_session.flush()

    bal = InventoryBalance(
        hospital_id=hosp.id,
        product_id=prod.id,
        total_units=10,
        reserved_units=0,
        available_units=10,
        version=1
    )
    req = BloodRequest(
        hospital_id=hosp.id,
        product_id=prod.id,
        units_requested=4,
        patient_reference_code="REF-CANCEL-1"
    )
    db_session.add_all([bal, req])
    await db_session.commit()

    # Reserve 4 units
    res = await create_atomic_reservation(
        db=db_session,
        request_id=req.id,
        idempotency_key="cancel-key-unique-999"
    )
    await db_session.refresh(bal)
    assert bal.available_units == 6
    assert bal.reserved_units == 4

    # Cancel once
    await cancel_or_release_reservation(
        db=db_session,
        reservation_id=res.id,
        reason="Patient discharged"
    )
    await db_session.refresh(bal)
    assert bal.available_units == 10
    assert bal.reserved_units == 0

    # Cancel a second time (racing cancellation)
    await cancel_or_release_reservation(
        db=db_session,
        reservation_id=res.id,
        reason="Automated expiry timer"
    )
    await db_session.refresh(bal)
    # Available stock MUST remain 10, not 14!
    assert bal.available_units == 10
    assert bal.reserved_units == 0

@pytest.mark.asyncio
async def test_concurrent_competing_reservations_prevent_overbooking(db_session: AsyncSession):
    """
    Master Prompt Critical Invariant:
    If 5 units exist and two requests each request 4 units,
    only one reservation must succeed, one must fail with 409 Conflict,
    and final available quantity must be exactly 1 (never negative).
    """
    hosp = Hospital(
        name="Apollo Emergency Hub",
        licence_number="LIC-CONCUR-5U",
        address="789 Ring Road",
        pin_code="110001",
        city="Delhi",
        state="Delhi",
        latitude=28.6,
        longitude=77.2,
        contact_phone="1234567890",
        contact_email="emergency@apollo.com",
        approval_status=HospitalStatus.APPROVED,
        is_active=True
    )
    db_session.add(hosp)
    prod = await _get_or_create_product(db_session, BloodGroup.O_POSITIVE, BloodComponent.WHOLE_BLOOD, "4C", 35)
    await db_session.flush()

    # Initial balance: 5 units
    bal = InventoryBalance(
        hospital_id=hosp.id,
        product_id=prod.id,
        total_units=5,
        reserved_units=0,
        available_units=5,
        version=1
    )
    # Request 1: 4 units
    req1 = BloodRequest(
        hospital_id=hosp.id,
        product_id=prod.id,
        units_requested=4,
        patient_reference_code="REQ-A-4UNITS"
    )
    # Request 2: 4 units
    req2 = BloodRequest(
        hospital_id=hosp.id,
        product_id=prod.id,
        units_requested=4,
        patient_reference_code="REQ-B-4UNITS"
    )
    db_session.add_all([bal, req1, req2])
    await db_session.commit()

    # Request 1 executes and reserves 4 units
    res1 = await create_atomic_reservation(
        db=db_session,
        request_id=req1.id,
        idempotency_key="idemp-req-1"
    )
    assert res1.units_reserved == 4

    # Request 2 tries to reserve 4 units when only 1 unit remains
    with pytest.raises(HTTPException) as exc_info:
        await create_atomic_reservation(
            db=db_session,
            request_id=req2.id,
            idempotency_key="idemp-req-2"
        )
    
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail["available_units"] == 1
    assert exc_info.value.detail["requested_units"] == 4

    # Final available units MUST be exactly 1
    await db_session.refresh(bal)
    assert bal.available_units == 1
    assert bal.reserved_units == 4
    assert bal.total_units == 5

