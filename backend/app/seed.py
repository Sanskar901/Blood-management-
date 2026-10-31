import logging
from datetime import date, timedelta
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import AsyncSessionLocal, engine, Base
from backend.app.core.config import settings
from backend.app.core.security import hash_password
from backend.app.models.enums import (
    UserRole,
    HospitalStatus,
    BloodGroup,
    BloodComponent,
    TransactionType
)
from backend.app.models.user import User
from backend.app.models.hospital import Hospital
from backend.app.models.blood_product import BloodProduct
from backend.app.models.inventory import InventoryLot, InventoryBalance, InventoryTransaction
from backend.app.models.audit import AuditLog
import backend.app.models  # ensure all models are imported into Base.metadata

logger = logging.getLogger("bloodconnect.seed")

async def _seed_body(session: AsyncSession):
    # 1. Seed Blood Products
    prod_check = await session.execute(select(BloodProduct))
    if not prod_check.first():
        logger.info("Initializing blood product catalog...")
        components = [
            (BloodComponent.WHOLE_BLOOD, "2°C to 6°C", 35),
            (BloodComponent.RED_BLOOD_CELLS, "2°C to 6°C", 42),
            (BloodComponent.PLATELETS, "20°C to 24°C (Agitated)", 5),
            (BloodComponent.PLASMA, "≤ -18°C", 365),
            (BloodComponent.CRYOPRECIPITATE, "≤ -18°C", 365),
        ]
        for bg in BloodGroup:
            for comp, temp, shelf in components:
                product = BloodProduct(
                    blood_group=bg,
                    component_type=comp,
                    storage_temp_c=temp,
                    shelf_life_days=shelf,
                    description=f"Standard clinical grade {comp.value} ({bg.value})"
                )
                session.add(product)
        await session.commit()
        logger.info("Blood product catalog initialized.")

    # 2. Seed Super Admin
    admin_check = await session.execute(
        select(User).where(User.email == settings.FIRST_SUPERUSER_EMAIL.lower())
    )
    admin = admin_check.scalar_one_or_none()
    if not admin:
        logger.info("Initializing Regulatory Super Admin...")
        admin = User(
            email=settings.FIRST_SUPERUSER_EMAIL.lower(),
            hashed_password=hash_password(settings.FIRST_SUPERUSER_PASSWORD),
            full_name="National Blood Transfusion Council Administrator",
            phone_number="+91-11-23061234",
            role=UserRole.SUPER_ADMIN,
            is_active=True
        )
        session.add(admin)
        await session.commit()
        await session.refresh(admin)

    # 3. Seed Accredited Hospitals
    hosp_check = await session.execute(select(Hospital))
    if not hosp_check.first():
        logger.info("Initializing accredited hospital blood centers...")
        apollo = Hospital(
            name="Apollo Hospitals Blood Bank & Transfusion Medicine",
            licence_number="DL-BB-2022-00412",
            address="1 Sarita Vihar, Mathura Road",
            pin_code="110076",
            city="New Delhi",
            state="Delhi",
            latitude=28.5398,
            longitude=77.2882,
            contact_phone="+91-11-26925858",
            contact_email="bloodbank@apollo.local",
            emergency_helpline="1066",
            approval_status=HospitalStatus.APPROVED,
            is_active=True
        )
        max_hosp = Hospital(
            name="Max Super Speciality Hospital Blood Bank",
            licence_number="DL-BB-2021-00891",
            address="1 2 Press Enclave Road, Saket",
            pin_code="110017",
            city="New Delhi",
            state="Delhi",
            latitude=28.5284,
            longitude=77.2185,
            contact_phone="+91-11-26515050",
            contact_email="saket.blood@max.local",
            emergency_helpline="1057",
            approval_status=HospitalStatus.APPROVED,
            is_active=True
        )
        fortis = Hospital(
            name="Fortis Memorial Research Institute Blood Bank",
            licence_number="HR-BB-2020-00654",
            address="Sector 44, Opposite HUDA City Centre",
            pin_code="122002",
            city="Gurugram",
            state="Haryana",
            latitude=28.4595,
            longitude=77.0724,
            contact_phone="+91-124-4962200",
            contact_email="bloodbank@fortis.local",
            emergency_helpline="105010",
            approval_status=HospitalStatus.PENDING,
            is_active=True
        )
        session.add_all([apollo, max_hosp, fortis])
        await session.commit()
        await session.refresh(apollo)
        await session.refresh(max_hosp)

        # 4. Seed Hospital Staff User
        staff_apollo = User(
            email="staff@apollo.local",
            hashed_password=hash_password("Hospital@12345"),
            full_name="Dr. Rajesh Sharma, MD (Apollo Blood Bank)",
            phone_number="+91-11-26925858",
            role=UserRole.HOSPITAL_STAFF,
            hospital_id=apollo.id,
            is_active=True
        )
        public_user = User(
            email="requester@demo.local",
            hashed_password=hash_password("Requester@12345"),
            full_name="Pooja Verma (Emergency Requester)",
            phone_number="+91-9988776655",
            role=UserRole.PUBLIC_REQUESTER,
            is_active=True
        )
        session.add_all([staff_apollo, public_user])
        await session.commit()
        await session.refresh(staff_apollo)

        # 5. Seed Inventory Lots & Balances
        o_pos_wb_stmt = select(BloodProduct).where(
            BloodProduct.blood_group == BloodGroup.O_POSITIVE,
            BloodComponent.WHOLE_BLOOD == BloodProduct.component_type
        )
        o_pos_wb = (await session.execute(o_pos_wb_stmt)).scalar_one()

        a_pos_prbc_stmt = select(BloodProduct).where(
            BloodProduct.blood_group == BloodGroup.A_POSITIVE,
            BloodComponent.RED_BLOOD_CELLS == BloodProduct.component_type
        )
        a_pos_prbc = (await session.execute(a_pos_prbc_stmt)).scalar_one()

        # Lots
        lot_apollo_o = InventoryLot(
            hospital_id=apollo.id,
            product_id=o_pos_wb.id,
            batch_number="BATCH-DEL-2026-881",
            quantity=15,
            donation_date=date.today() - timedelta(days=4),
            expiry_date=date.today() + timedelta(days=31),
            verification_status="VERIFIED"
        )
        lot_apollo_a = InventoryLot(
            hospital_id=apollo.id,
            product_id=a_pos_prbc.id,
            batch_number="BATCH-DEL-2026-882",
            quantity=12,
            donation_date=date.today() - timedelta(days=2),
            expiry_date=date.today() + timedelta(days=40),
            verification_status="VERIFIED"
        )
        lot_max_o = InventoryLot(
            hospital_id=max_hosp.id,
            product_id=o_pos_wb.id,
            batch_number="BATCH-SAKET-2026-104",
            quantity=8,
            donation_date=date.today() - timedelta(days=5),
            expiry_date=date.today() + timedelta(days=30),
            verification_status="VERIFIED"
        )
        session.add_all([lot_apollo_o, lot_apollo_a, lot_max_o])

        # Balances
        bal_apollo_o = InventoryBalance(
            hospital_id=apollo.id,
            product_id=o_pos_wb.id,
            total_units=15,
            reserved_units=0,
            available_units=15,
            version=1
        )
        bal_apollo_a = InventoryBalance(
            hospital_id=apollo.id,
            product_id=a_pos_prbc.id,
            total_units=12,
            reserved_units=0,
            available_units=12,
            version=1
        )
        bal_max_o = InventoryBalance(
            hospital_id=max_hosp.id,
            product_id=o_pos_wb.id,
            total_units=8,
            reserved_units=0,
            available_units=8,
            version=1
        )
        session.add_all([bal_apollo_o, bal_apollo_a, bal_max_o])

        # Transactions
        tx1 = InventoryTransaction(
            hospital_id=apollo.id,
            product_id=o_pos_wb.id,
            lot_id=lot_apollo_o.id,
            transaction_type=TransactionType.DONATION_INFLOW,
            quantity_delta=15,
            reason="Voluntary donation collection verified by blood bank",
            actor_id=staff_apollo.id
        )
        tx2 = InventoryTransaction(
            hospital_id=apollo.id,
            product_id=a_pos_prbc.id,
            lot_id=lot_apollo_a.id,
            transaction_type=TransactionType.DONATION_INFLOW,
            quantity_delta=12,
            reason="Component separation and serology negative clearance",
            actor_id=staff_apollo.id
        )
        session.add_all([tx1, tx2])

        # Initial audit
        audit = AuditLog(
            actor_id=admin.id,
            action="REGULATORY_CATALOG_SYNC",
            target_type="System",
            details="National blood banking network initialized with verified regional facilities"
        )
        session.add(audit)

        await session.commit()
        logger.info("Accredited hospitals and inventory successfully initialized.")

async def seed_initial_demo_data(session: Optional[AsyncSession] = None):
    if session is not None:
        await _seed_body(session)
        return

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await _seed_body(session)

if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_initial_demo_data())
