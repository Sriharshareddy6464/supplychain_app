from sqlalchemy import Column, Integer, String, ForeignKey, Float, Enum, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class InvoiceType(str, enum.Enum):
    VENDOR_PAYOUT = "VENDOR_PAYOUT" # Aggregator pays Vendor
    KITCHEN_BILL = "KITCHEN_BILL"   # Kitchen pays Aggregator
    TRANSPORT_PAYOUT = "TRANSPORT_PAYOUT" # Aggregator pays Transporter

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    type = Column(Enum(InvoiceType), nullable=False)
    amount = Column(Float, nullable=False)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    pdf_url = Column(String, nullable=True)

    order = relationship("Order", back_populates="invoices")
