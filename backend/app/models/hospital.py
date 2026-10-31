from sqlalchemy import String, Boolean, Float, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin, generate_uuid
from backend.app.models.enums import HospitalStatus

class Hospital(Base, TimestampMixin):
    __tablename__ = "hospitals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    licence_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    address: Mapped[str] = mapped_column(String(300), nullable=False)
    pin_code: Mapped[str] = mapped_column(String(12), nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    
    contact_phone: Mapped[str] = mapped_column(String(30), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    emergency_helpline: Mapped[str] = mapped_column(String(30), nullable=True)

    approval_status: Mapped[HospitalStatus] = mapped_column(
        SQLEnum(HospitalStatus, native_enum=False),
        default=HospitalStatus.PENDING,
        nullable=False,
        index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    staff_members = relationship("User", back_populates="hospital")
    inventory_lots = relationship("InventoryLot", back_populates="hospital")
    inventory_balances = relationship("InventoryBalance", back_populates="hospital")
    blood_requests = relationship("BloodRequest", back_populates="hospital")
    reservations = relationship("Reservation", back_populates="hospital")
    transactions = relationship("InventoryTransaction", back_populates="hospital")
