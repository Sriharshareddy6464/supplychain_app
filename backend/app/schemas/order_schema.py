from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime
from app.models.order import OrderStatus

# --- Item & Pricing Schemas ---
class PricingBreakdown(BaseModel):
    items_subtotal: float
    transport_fee: float
    platform_fee: float
    total_amount: float

class OrderItem(BaseModel):
    item_id: str
    item_name: str
    category: Optional[str] = "General" # Added category for splitting
    quantity: int
    unit: str = "qty"
    vendor_cost: float
    selling_price: float
    item_total: float
    notes: Optional[str] = None

class OrderCreate(BaseModel):
    items: List[OrderItem]
    
class OrderAssignment(BaseModel):
    vendor_id: Optional[int] = None
    transporter_id: Optional[int] = None
    category: Optional[str] = None # Added for manual assign validation

class ReviewRequest(BaseModel):
    action: str # "approve" or "reject"
    notes: Optional[str] = None

class OrderUpdateStatus(BaseModel):
    status: OrderStatus
    expected_version: int 
    photo_url: Optional[str] = None 
    reason: Optional[str] = None 
    items: Optional[List[OrderItem]] = None # For Vendor Variance during Packing
    distance_km: Optional[float] = None # For Transporter during Delivery 

class OrderEventResponse(BaseModel):
    id: int
    event_type: str
    actor_role: Optional[str]
    timestamp: datetime
    metadata_info: Optional[Dict[str, Any]] = Field(None, alias="metadata")

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    kitchen_id: int
    vendor_id: Optional[int]
    transporter_id: Optional[int]
    
    category: Optional[str] # Added
    items: List[OrderItem]
    total_amount: Optional[float]
    pricing_breakdown: Optional[PricingBreakdown]
    
    status: OrderStatus
    version: int
    
    created_at: datetime
    assigned_at: Optional[datetime]
    accepted_at: Optional[datetime]
    packed_at: Optional[datetime]
    picked_up_at: Optional[datetime]
    delivered_at: Optional[datetime]
    confirmed_at: Optional[datetime] # Added
    closed_at: Optional[datetime]
    
    rejected_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    failed_delivery_at: Optional[datetime]
    
    rejection_reason: Optional[str]
    cancellation_reason: Optional[str]
    delivery_failure_reason: Optional[str]
    discrepancy_report: Optional[Dict[str, Any]] # Added

    packing_photo_url: Optional[str]
    delivery_proof_url: Optional[str]

    class Config:
        from_attributes = True
