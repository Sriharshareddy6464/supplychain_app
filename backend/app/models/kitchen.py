from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Kitchen(Base):
    __tablename__ = "kitchens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    restaurant_name = Column(String, index=True)
    address = Column(String)
    contact_number = Column(String)

    user = relationship("User", back_populates="kitchen")
    orders = relationship("Order", back_populates="kitchen")
