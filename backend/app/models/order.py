from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime, JSON, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class OrderStatus(str, enum.Enum):
    CREATED = "CREATED"
    ASSIGNED = "ASSIGNED"
    ACCEPTED = "ACCEPTED"
    PACKED = "PACKED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    CONFIRMED = "CONFIRMED"
    CLOSED = "CLOSED"
    REJECTED = "REJECTED"
    DELIVERY_FAILED = "DELIVERY_FAILED"
    CANCELLED = "CANCELLED"

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    kitchen_id = Column(Integer, ForeignKey("kitchens.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True) # Null until assigned
    transporter_id = Column(Integer, ForeignKey("transporters.id"), nullable=True) # Null until assigned
    
    category = Column(String, nullable=True) # The category this order belongs to (Veg, Fruit, etc)
    items = Column(JSON, nullable=False) # List of detailed items
    total_amount = Column(Float, nullable=True) 
    pricing_breakdown = Column(JSON, nullable=True) # Detailed pricing
    distance_km = Column(Float, nullable=True) # For Logistics billing
    final_bill_amount = Column(Float, nullable=True) # Final amount charged to Kitchen
    
    status = Column(Enum(OrderStatus), default=OrderStatus.CREATED)
    version = Column(Integer, default=1, nullable=False) # Optimistic locking
    
    # Timestamps for tracking lifecycle
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    packed_at = Column(DateTime(timezone=True), nullable=True)
    picked_up_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    confirmed_at = Column(DateTime(timezone=True), nullable=True) # Kitchen confirmation
    closed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Failure timestamps
    rejected_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    failed_delivery_at = Column(DateTime(timezone=True), nullable=True)

    # Failure reasons
    rejection_reason = Column(String, nullable=True)
    cancellation_reason = Column(String, nullable=True)
    delivery_failure_reason = Column(String, nullable=True)
    discrepancy_report = Column(JSON, nullable=True) # Kitchen reported issues

    # Proof Images
    packing_photo_url = Column(String, nullable=True)
    delivery_proof_url = Column(String, nullable=True)

    # Relationships
    kitchen = relationship("Kitchen", back_populates="orders")
    vendor = relationship("Vendor", back_populates="orders")
    transporter = relationship("Transport", back_populates="orders")
    invoices = relationship("Invoice", back_populates="order")
    events = relationship("OrderEvent", back_populates="order")
