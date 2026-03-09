from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.services import order_service, audit_service
from app.schemas.order_schema import OrderCreate, OrderResponse, OrderAssignment, OrderUpdateStatus, OrderEventResponse, ReviewRequest
from app.models.user import User, UserRole
from app.utils.permissions import get_current_active_user, RoleChecker

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

@router.post("/", response_model=List[OrderResponse])
def create_order(
    order: OrderCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(RoleChecker([UserRole.KITCHEN]))
):
    return order_service.create_order(db, order, current_user.id)

@router.post("/{order_id}/review", response_model=OrderResponse)
def review_order(
    order_id: int,
    request: ReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.AGGREGATOR]))
):
    return order_service.review_order(db, order_id, request.action, request.notes, current_user)

@router.post("/{order_id}/confirm-receipt", response_model=OrderResponse)
def confirm_receipt(
    order_id: int,
    discrepancy_report: dict = Body(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.KITCHEN])) # Strict role
):
    return order_service.confirm_order(db, order_id, discrepancy_report, current_user)

@router.post("/{order_id}/assign-vendor", response_model=OrderResponse)
def assign_vendor(
    order_id: int,
    body: dict = Body(...), # Expect { "vendor_id": ..., "category": ... }
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.AGGREGATOR]))
):
    vendor_id = body.get("vendor_id")
    category = body.get("category")
    if not vendor_id or not category:
         raise HTTPException(status_code=400, detail="vendor_id and category required")
    return order_service.assign_order(db, order_id, vendor_id, category, current_user)


@router.post("/{order_id}/assign-transporter", response_model=OrderResponse)
def assign_transporter(
    order_id: int,
    body: dict = Body(...), # Expect { "transporter_id": ... }
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.AGGREGATOR]))
):
    tid = body.get("transporter_id")
    if not tid: raise HTTPException(status_code=400, detail="transporter_id required")
    return order_service.assign_transporter(db, order_id, tid, current_user)

# --- Action Workflows ---

@router.post("/{order_id}/accept", response_model=OrderResponse)
def accept_order(
    order_id: int,
    expected_version: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Vendor Accept
    update = OrderUpdateStatus(status="ACCEPTED", expected_version=expected_version)
    return order_service.update_status(db, order_id, update, current_user)

@router.post("/{order_id}/pack", response_model=OrderResponse)
def pack_order(
    order_id: int,
    body: OrderUpdateStatus, # Expect full body including optional items
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Vendor Pack (with optional items update for variance)
    # Ensure status is correct in body, or override it?
    # Safer to just use the body as is, but validate status is PACKED.
    if body.status != "PACKED": 
        raise HTTPException(status_code=400, detail="Status must be PACKED")
    return order_service.update_status(db, order_id, body, current_user)

@router.post("/{order_id}/pickup", response_model=OrderResponse)
def pickup_order(
    order_id: int,
    expected_version: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Transporter Pickup
    update = OrderUpdateStatus(status="IN_TRANSIT", expected_version=expected_version)
    return order_service.update_status(db, order_id, update, current_user)

@router.post("/{order_id}/deliver", response_model=OrderResponse)
def deliver_order(
    order_id: int,
    body: OrderUpdateStatus, # Expect full body including distance_km
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Transporter Deliver
    if body.status != "DELIVERED":
         raise HTTPException(status_code=400, detail="Status must be DELIVERED")
    return order_service.update_status(db, order_id, body, current_user)
    
@router.post("/{order_id}/close", response_model=OrderResponse)
def close_order(
    order_id: int,
    expected_version: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.AGGREGATOR]))
):
    # Aggregator Close
    update = OrderUpdateStatus(status="CLOSED", expected_version=expected_version)
    return order_service.update_status(db, order_id, update, current_user)

# --- Failures & Reassignments (Existing) ---
@router.post("/{order_id}/reject", response_model=OrderResponse)
def reject_order(
    order_id: int,
    reason: str = Body(...),
    expected_version: int = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    update = OrderUpdateStatus(status="REJECTED", expected_version=expected_version, reason=reason)
    return order_service.update_status(db, order_id, update, current_user)

@router.post("/{order_id}/fail-delivery", response_model=OrderResponse)
def fail_delivery(
    order_id: int,
    reason: str = Body(...),
    expected_version: int = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    update = OrderUpdateStatus(status="DELIVERY_FAILED", expected_version=expected_version, reason=reason)
    return order_service.update_status(db, order_id, update, current_user)

@router.post("/{order_id}/reassign-vendor", response_model=OrderResponse)
def reassign_vendor(
    order_id: int,
    new_vendor_id: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.AGGREGATOR]))
):
    return order_service.reassign_vendor(db, order_id, new_vendor_id, current_user)

@router.post("/{order_id}/reassign-transporter", response_model=OrderResponse)
def reassign_transporter(
    order_id: int,
    transporter_id: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.AGGREGATOR]))
):
    return order_service.assign_transporter(db, order_id, transporter_id, current_user)

# --- Queries ---

@router.get("/", response_model=List[OrderResponse])
def read_orders(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    return order_service.get_orders(db, current_user, skip, limit)

@router.get("/{order_id}", response_model=OrderResponse)
def read_order(
    order_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    order = order_service.get_order(db, order_id)
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    order_service.verify_ownership(order, current_user)
    return order

@router.get("/{order_id}/audit-log", response_model=List[OrderEventResponse])
def get_audit_log(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    order = order_service.get_order(db, order_id)
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    order_service.verify_ownership(order, current_user)
    return audit_service.get_events(db, order_id)
