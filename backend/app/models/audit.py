from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class OrderEvent(Base):
    __tablename__ = "order_events"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    event_type = Column(String, nullable=False) # e.g., 'STATUS_CHANGE', 'ASSIGNMENT', 'UPDATE'
    actor_id = Column(Integer, nullable=True) # ID of user who performed action
    actor_role = Column(String, nullable=True) # Role of user
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    metadata_info = Column(JSON, nullable=True) # 'metadata' is reserved in SQLAlchemy Base

    order = relationship("Order", back_populates="events")
