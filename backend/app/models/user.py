from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    AGGREGATOR = "AGGREGATOR"
    KITCHEN = "KITCHEN"
    VENDOR = "VENDOR"
    TRANSPORTER = "TRANSPORTER"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.KITCHEN)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    kitchen = relationship("Kitchen", back_populates="user", uselist=False)
    vendor = relationship("Vendor", back_populates="user", uselist=False)
    transporter = relationship("Transport", back_populates="user", uselist=False)
