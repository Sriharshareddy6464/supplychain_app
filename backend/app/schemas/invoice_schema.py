from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.invoice import InvoiceType

class InvoiceResponse(BaseModel):
    id: int
    order_id: int
    type: InvoiceType
    amount: float
    issued_at: datetime
    pdf_url: Optional[str] = None

    class Config:
        from_attributes = True

class FinancialReport(BaseModel):
    total_revenue: float
    total_vendor_payout: float
    total_transport_payout: float
    net_profit: float
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
