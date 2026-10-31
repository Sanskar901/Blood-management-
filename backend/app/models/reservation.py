from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum as SQLEnum, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin, generate_uuid, utc_now
from backend.app.models.enums import ReservationStatus

class Reservation(Base, TimestampMixin):
    __tablename__ = "reservations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    request_id: Mapped[str] = mapped_column(String(36), ForeignKey("blood_requests.id", ondelete="CASCADE"), unique=True, nullable=False)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("blood_products.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    units_reserved: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Critical idempotency key constraint to prevent duplicate reservations
    idempotency_key: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    
    status: Mapped[ReservationStatus] = mapped_column(
        SQLEnum(ReservationStatus, native_enum=False),
        default=ReservationStatus.ACTIVE,
        nullable=False,
        index=True
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    confirmed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    released_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("units_reserved > 0", name="chk_units_reserved_positive"),
    )

    request = relationship("BloodRequest", back_populates="reservation")
    hospital = relationship("Hospital", back_populates="reservations")
    product = relationship("BloodProduct")
