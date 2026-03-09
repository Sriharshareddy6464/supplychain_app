from sqlalchemy import Column, Integer, String, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    business_name = Column(String, index=True)
    address = Column(String)
    rating = Column(Float, default=5.0)
    categories = Column(JSON, nullable=True) # List of supported categories e.g. ["Vegetables", "Dairy"]

    user = relationship("User", back_populates="vendor")
    orders = relationship("Order", back_populates="vendor")
