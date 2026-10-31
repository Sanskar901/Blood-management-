from sqlalchemy import String, Integer, ForeignKey, Enum as SQLEnum, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin, generate_uuid
from backend.app.models.enums import RequestUrgency, RequestStatus

class BloodRequest(Base, TimestampMixin):
    __tablename__ = "blood_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    requester_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("blood_products.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    units_requested: Mapped[int] = mapped_column(Integer, nullable=False)
    urgency_level: Mapped[RequestUrgency] = mapped_column(
        SQLEnum(RequestUrgency, native_enum=False),
        default=RequestUrgency.STANDARD,
        nullable=False
    )
    patient_reference_code: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. Anonymized ICU-Ref-402
    notes: Mapped[str] = mapped_column(String(500), nullable=True)
    
    status: Mapped[RequestStatus] = mapped_column(
        SQLEnum(RequestStatus, native_enum=False),
        default=RequestStatus.SUBMITTED,
        nullable=False,
        index=True
    )
    
    # Cryptographic tracking token for requester to check status without exposing PII
    tracking_token: Mapped[str] = mapped_column(String(64), unique=True, index=True, default=generate_uuid)

    __table_args__ = (
        CheckConstraint("units_requested > 0", name="chk_units_requested_positive"),
    )

    requester = relationship("User", back_populates="requests")
    hospital = relationship("Hospital", back_populates="blood_requests")
    product = relationship("BloodProduct", back_populates="requests")
    reservation = relationship("Reservation", back_populates="request", uselist=False)
