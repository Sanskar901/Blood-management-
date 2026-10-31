from sqlalchemy import String, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base
from backend.app.models.base import TimestampMixin, generate_uuid
from backend.app.models.enums import BloodGroup, BloodComponent

class BloodProduct(Base, TimestampMixin):
    __tablename__ = "blood_products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    blood_group: Mapped[BloodGroup] = mapped_column(
        SQLEnum(BloodGroup, native_enum=False),
        nullable=False,
        index=True
    )
    component_type: Mapped[BloodComponent] = mapped_column(
        SQLEnum(BloodComponent, native_enum=False),
        nullable=False,
        index=True
    )
    storage_temp_c: Mapped[str] = mapped_column(String(50), default="2°C to 6°C")
    shelf_life_days: Mapped[int] = mapped_column(default=35)
    description: Mapped[str] = mapped_column(String(255), nullable=True)

    __table_args__ = (
        UniqueConstraint("blood_group", "component_type", name="uq_blood_group_component"),
    )

    # Relationships
    lots = relationship("InventoryLot", back_populates="product")
    balances = relationship("InventoryBalance", back_populates="product")
    requests = relationship("BloodRequest", back_populates="product")
