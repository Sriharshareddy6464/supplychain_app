from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Transport(Base):
    __tablename__ = "transporters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    driver_name = Column(String)
    vehicle_number = Column(String)
    vehicle_type = Column(String) # e.g., Bike, Van

    user = relationship("User", back_populates="transporter")
    orders = relationship("Order", back_populates="transporter")
