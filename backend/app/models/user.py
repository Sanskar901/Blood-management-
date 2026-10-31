from sqlalchemy import String, Boolean, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin, generate_uuid
from backend.app.models.enums import UserRole

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(30), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, native_enum=False),
        default=UserRole.PUBLIC_REQUESTER,
        nullable=False,
        index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Hospital association for HOSPITAL_STAFF
    hospital_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("hospitals.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Relationships
    hospital = relationship("Hospital", back_populates="staff_members")
    requests = relationship("BloodRequest", back_populates="requester")
