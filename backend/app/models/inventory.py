from datetime import date, datetime
from sqlalchemy import String, Integer, Date, DateTime, ForeignKey, Enum as SQLEnum, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin, generate_uuid, utc_now
from backend.app.models.enums import TransactionType

class InventoryLot(Base, TimestampMixin):
    __tablename__ = "inventory_lots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("blood_products.id", ondelete="RESTRICT"), nullable=False, index=True)
    batch_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    donation_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    verification_status: Mapped[str] = mapped_column(String(50), default="VERIFIED", nullable=False) # VERIFIED, QUARANTINED, EXPIRED

    __table_args__ = (
        CheckConstraint("quantity >= 0", name="chk_lot_quantity_non_negative"),
        UniqueConstraint("hospital_id", "batch_number", name="uq_hospital_batch"),
    )

    hospital = relationship("Hospital", back_populates="inventory_lots")
    product = relationship("BloodProduct", back_populates="lots")
    transactions = relationship("InventoryTransaction", back_populates="lot")

class InventoryBalance(Base, TimestampMixin):
    __tablename__ = "inventory_balances"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("blood_products.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    total_units: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reserved_units: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    available_units: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    __table_args__ = (
        CheckConstraint("total_units >= 0", name="chk_total_units_non_negative"),
        CheckConstraint("reserved_units >= 0", name="chk_reserved_units_non_negative"),
        CheckConstraint("available_units >= 0", name="chk_available_units_non_negative"),
        CheckConstraint("available_units = total_units - reserved_units", name="chk_available_equals_total_minus_reserved"),
        UniqueConstraint("hospital_id", "product_id", name="uq_hospital_product_balance"),
    )

    hospital = relationship("Hospital", back_populates="inventory_balances")
    product = relationship("BloodProduct", back_populates="balances")

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("blood_products.id", ondelete="RESTRICT"), nullable=False, index=True)
    lot_id: Mapped[str] = mapped_column(String(36), ForeignKey("inventory_lots.id", ondelete="SET NULL"), nullable=True)
    
    transaction_type: Mapped[TransactionType] = mapped_column(
        SQLEnum(TransactionType, native_enum=False),
        nullable=False,
        index=True
    )
    quantity_delta: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(300), nullable=False)
    actor_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reservation_id: Mapped[str] = mapped_column(String(36), ForeignKey("reservations.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    hospital = relationship("Hospital", back_populates="transactions")
    lot = relationship("InventoryLot", back_populates="transactions")
    actor = relationship("User")
