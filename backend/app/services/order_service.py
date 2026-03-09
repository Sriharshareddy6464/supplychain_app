from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from app.models.order import Order, OrderStatus
from app.models.user import User, UserRole
from app.models.kitchen import Kitchen
from app.models.vendor import Vendor
from app.models.transport import Transport
from app.schemas.order_schema import OrderCreate, OrderAssignment, OrderUpdateStatus
from app.services import audit_service, billing_service

# --- Helper Validators ---

def verify_ownership(order: Order, user: User):
    if user.role == UserRole.AGGREGATOR: return 
    
    if user.role == UserRole.KITCHEN:
        if order.kitchen_id != user.kitchen.id: raise HTTPException(status_code=403, detail="Not authorized")
    elif user.role == UserRole.VENDOR:
        if not order.vendor_id or order.vendor_id != user.vendor.id: raise HTTPException(status_code=403, detail="Not authorized")
    elif user.role == UserRole.TRANSPORTER:
        if not order.transporter_id or order.transporter_id != user.transporter.id: raise HTTPException(status_code=403, detail="Not authorized")

def enforce_action_permission(role: UserRole, action: str, order: Order, user: User):
    if action not in ["CREATE"]: verify_ownership(order, user)
    
    allowed = False
    if role == UserRole.KITCHEN:
        if action in ["CREATE", "CONFIRM"]: allowed = True
    elif role == UserRole.AGGREGATOR:
        allowed = True 
    elif role == UserRole.VENDOR:
        if action in ["ACCEPT", "PACK", "REJECT"]: allowed = True
    elif role == UserRole.TRANSPORTER:
        if action in ["PICKUP", "DELIVER", "FAIL_DELIVERY"]: allowed = True
            
    if not allowed: raise HTTPException(status_code=403, detail=f"Role {role} not permitted to perform {action}")

def validate_state_transition(order: Order, new_status: OrderStatus, role: UserRole):
    current = order.status
    valid_transitions = {
        OrderStatus.CREATED: [OrderStatus.ASSIGNED], # Review -> Assign transition
        OrderStatus.ASSIGNED: [OrderStatus.ACCEPTED, OrderStatus.REJECTED], 
        OrderStatus.ACCEPTED: [OrderStatus.PACKED],
        OrderStatus.PACKED: [OrderStatus.IN_TRANSIT],
        OrderStatus.IN_TRANSIT: [OrderStatus.DELIVERED, OrderStatus.DELIVERY_FAILED],
        OrderStatus.DELIVERED: [OrderStatus.CONFIRMED],
        OrderStatus.CONFIRMED: [OrderStatus.CLOSED],
        OrderStatus.REJECTED: [OrderStatus.ASSIGNED], 
        OrderStatus.DELIVERY_FAILED: [OrderStatus.ASSIGNED, OrderStatus.PACKED], 
        OrderStatus.CLOSED: [],
        OrderStatus.CANCELLED: [] 
    }
    
    if new_status == OrderStatus.CANCELLED:
        if current == OrderStatus.CLOSED: raise HTTPException(status_code=409, detail={"error": "Cannot cancel CLOSED order"})
        return 

    allowed_next = valid_transitions.get(current, [])
    if new_status not in allowed_next:
         raise HTTPException(status_code=409, detail={"error": f"Invalid transition {current}->{new_status}", "allowed": allowed_next})

# --- Logic ---

def calculate_billing(items: List[Dict]) -> Dict[str, Any]:
    items_subtotal = sum(item['item_total'] for item in items)
    transport_fee = 50.0 
    platform_fee = items_subtotal * 0.10
    total_amount = items_subtotal + transport_fee + platform_fee
    
    return {
        "items_subtotal": items_subtotal,
        "transport_fee": transport_fee,
        "platform_fee": platform_fee,
        "total_amount": total_amount
    }

def find_best_vendor(db: Session, category: str) -> Optional[Vendor]:
    vendors = db.query(Vendor).all()
    search_cat = category.lower().strip()
    for v in vendors:
        if v.categories:
            # Case-insensitive check
            v_cats = [c.lower().strip() for c in v.categories]
            if search_cat in v_cats: 
                return v
    return None

def create_order(db: Session, order_data: OrderCreate, user_id: int) -> List[Order]:
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user.role != UserRole.KITCHEN: raise HTTPException(status_code=403, detail="Only Kitchen can create orders")
            
        kitchen = user.kitchen
        if not kitchen: raise HTTPException(status_code=400, detail="Kitchen profile missing")
            
        grouped_items = {}
        for item in order_data.items:
            cat = getattr(item, 'category', 'General') 
            if cat not in grouped_items: grouped_items[cat] = []
            grouped_items[cat].append(item.dict())

        created_orders = []
        
        for category, items in grouped_items.items():
            pricing = calculate_billing(items)
            
            # Auto Assign Attempt (BUT Step 3 says Aggregator Reviews First)
            # So we create in CREATED state. We DO NOT assign yet.
            # Review step will trigger assignment.
            
            new_order = Order(
                kitchen_id=kitchen.id,
                category=category,
                items=items,
                total_amount=pricing['total_amount'],
                pricing_breakdown=pricing,
                status=OrderStatus.CREATED,
                version=1
            )
            db.add(new_order)
            db.flush()
            
            audit_service.log_event(db, new_order.id, "ORDER_CREATED_SPLIT", user, None, {"category": category})
            created_orders.append(new_order)
        
        db.commit()
        for o in created_orders: db.refresh(o)
        return created_orders
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=409, detail=f"Creation failed: {str(e)}")

def review_order(db: Session, order_id: int, action: str, notes: str, user: User):
    """
    Step 3: Aggregator Review.
    Approved -> Attempts Auto-Assign -> ASSIGNED (or CREATED if no vendor found)
    Rejected -> CANCELLED
    """
    try:
        order = get_order(db, order_id)
        if not order: raise HTTPException(status_code=404, detail="Order not found")
        
        if user.role != UserRole.AGGREGATOR: raise HTTPException(status_code=403, detail="Only Admin can review")
        
        if order.status != OrderStatus.CREATED: raise HTTPException(status_code=409, detail="Order already processed")

        if action == "reject":
            order.status = OrderStatus.CANCELLED
            order.cancellation_reason = f"Review Rejected: {notes}"
            order.cancelled_at = datetime.utcnow()
            audit_service.log_event(db, order.id, "REVIEW_REJECTED", user, None, {"notes": notes})
            
        elif action == "approve":
            # Auto-Assign Trigger
            vendor = find_best_vendor(db, order.category)
            if vendor:
                order.vendor_id = vendor.id
                order.status = OrderStatus.ASSIGNED
                order.assigned_at = datetime.utcnow()
                audit_service.log_event(db, order.id, "REVIEW_APPROVED_AUTO_ASSIGN", user, None, {"vendor": vendor.id})
            else:
                # Approved but no vendor found, stays CREATED (or maybe specialized 'APPROVED' state? 
                # Strict transition map says CREATED->ASSIGNED. 
                # If we don't assign, we can't move forward in strict map. 
                # Let's verify manual assignment handles CREATED->ASSIGNED which covers 'Approved manually later'
                audit_service.log_event(db, order.id, "REVIEW_APPROVED_NO_VENDOR", user, None, {"msg": "Wait for manual assign"})
                
        order.version += 1
        db.commit()
        db.refresh(order)
        return order
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=409, detail=f"Review failed: {str(e)}")

def confirm_order(db: Session, order_id: int, discrepancy_report: Dict[str, Any], user: User):
    try:
        order = get_order(db, order_id)
        if not order: raise HTTPException(status_code=404, detail="Order not found")
        
        enforce_action_permission(user.role, "CONFIRM", order, user)
        validate_state_transition(order, OrderStatus.CONFIRMED, user.role)
        
        old_status = order.status
        order.status = OrderStatus.CONFIRMED
        order.confirmed_at = datetime.utcnow()
        order.discrepancy_report = discrepancy_report
        order.version += 1
        
        audit_service.log_event(db, order.id, "CONFIRMED", user, {"status": old_status}, {"status": "CONFIRMED"})
        
        db.commit()
        db.refresh(order)
        return order
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=409, detail=f"Confirmation failed: {str(e)}")

def get_order(db: Session, order_id: int):
    return db.query(Order).filter(Order.id == order_id).first()

def get_orders(db: Session, user: User, skip: int = 0, limit: int = 100):
    query = db.query(Order)
    if user.role == UserRole.KITCHEN: query = query.filter(Order.kitchen_id == user.kitchen.id)
    elif user.role == UserRole.VENDOR: query = query.filter(Order.vendor_id == user.vendor.id)
    elif user.role == UserRole.TRANSPORTER: query = query.filter(Order.transporter_id == user.transporter.id)
    return query.offset(skip).limit(limit).all()

def assign_order(db: Session, order_id: int, vendor_id: int, category: str, user: User):
    """
    Manual Assignment with Category Validation.
    """
    try:
        order = get_order(db, order_id)
        if not order: raise HTTPException(status_code=404, detail="Order not found")
        
        if user.role != UserRole.AGGREGATOR: raise HTTPException(status_code=403, detail="Only Admin")
        
        # Category Validation
        if category != order.category:
            # Maybe user wants to correct it? But generally mismatch is risky.
             pass # Warn?
        
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor: raise HTTPException(status_code=404, detail="Vendor not found")
        
        # Case-insensitive validation
        search_cat = order.category.lower().strip()
        v_cats = [c.lower().strip() for c in (vendor.categories or [])]
        
        if search_cat not in v_cats:
             raise HTTPException(status_code=400, detail=f"Vendor does not support category {order.category} (Vendor has: {vendor.categories})")

        if order.status != OrderStatus.CREATED:
             if order.status in [OrderStatus.REJECTED, OrderStatus.DELIVERY_FAILED]:
                 raise HTTPException(status_code=400, detail="Use /reassign-vendor")
             # Allow if still created
             raise HTTPException(status_code=409, detail="Invalid state for assign")

        old_val = {"vendor": order.vendor_id}
        order.vendor_id = vendor_id
        order.status = OrderStatus.ASSIGNED
        order.assigned_at = datetime.utcnow()
        order.version += 1
        
        audit_service.log_event(db, order.id, "ASSIGNMENT_MANUAL", user, old_val, {"vendor": vendor_id})
        
        db.commit()
        db.refresh(order)
        return order
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=409, detail=f"Assignment failed: {str(e)}")

def reassign_vendor(db: Session, order_id: int, new_vendor_id: int, user: User):
    try:
        order = get_order(db, order_id)
        if not order: raise HTTPException(status_code=404, detail="Order not found")
        
        if user.role != UserRole.AGGREGATOR: raise HTTPException(status_code=403, detail="Only Admin")

        # FIX: Validate Category for Reassignment too!
        vendor = db.query(Vendor).filter(Vendor.id == new_vendor_id).first()
        if not vendor: raise HTTPException(status_code=404, detail="Vendor not found")
        
        # Case-insensitive
        search_cat = order.category.lower().strip()
        v_cats = [c.lower().strip() for c in (vendor.categories or [])]
        if search_cat not in v_cats:
             # Just strict rejection
             raise HTTPException(status_code=400, detail=f"Vendor does not support category {order.category}")

        if order.status not in [OrderStatus.REJECTED, OrderStatus.DELIVERY_FAILED]:
            raise HTTPException(status_code=400, detail="State not REJECTED/FAILED")
            
        old_vendor = order.vendor_id
        order.vendor_id = new_vendor_id
        order.status = OrderStatus.ASSIGNED
        
        # Reset
        order.rejected_at = None
        order.rejection_reason = None
        order.accepted_at = None
        order.packed_at = None
        order.picked_up_at = None
        order.delivered_at = None
        order.failed_delivery_at = None
        order.delivery_failure_reason = None
        order.cancelled_at = None
        order.cancellation_reason = None
        
        order.assigned_at = datetime.utcnow()
        order.version += 1
        
        audit_service.log_event(db, order.id, "VENDOR_REASSIGNED", user, {"old": old_vendor}, {"new": new_vendor_id})
        
        db.commit()
        db.refresh(order)
        return order
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=409, detail=f"Reassignment failed: {str(e)}")

def assign_transporter(db: Session, order_id: int, transporter_id: int, user: User):
     # Helper for Transporter assignment since 'assign_order' was specialized
    try:
        order = get_order(db, order_id)
        if not order: raise HTTPException(status_code=404, detail="Order not found")
        if user.role != UserRole.AGGREGATOR: raise HTTPException(status_code=403, detail="Only Admin")
        
        order.transporter_id = transporter_id
        # Status usually stays PACKED until pickup
        order.version += 1
        audit_service.log_event(db, order.id, "TRANSPORTER_ASSIGNED", user, None, {"tr": transporter_id})
        db.commit()
        db.refresh(order)
        return order
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=409, detail=f"Tr Assignment failed: {str(e)}")

def update_status(db: Session, order_id: int, update: OrderUpdateStatus, user: User):
    try:
        order = get_order(db, order_id)
        if not order: raise HTTPException(status_code=404, detail="Order not found")
        
        if order.version != update.expected_version:
             raise HTTPException(status_code=409, detail="Order modified by another user")

        action_map = {
            OrderStatus.ACCEPTED: "ACCEPT",
            OrderStatus.PACKED: "PACK",
            OrderStatus.IN_TRANSIT: "PICKUP",
            OrderStatus.DELIVERED: "DELIVER",
            OrderStatus.CLOSED: "CLOSE",
            OrderStatus.REJECTED: "REJECT",
            OrderStatus.DELIVERY_FAILED: "FAIL_DELIVERY",
            OrderStatus.CANCELLED: "CANCEL",
        }
        action = action_map.get(update.status, "UPDATE_STATUS")
        
        enforce_action_permission(user.role, action, order, user)
        validate_state_transition(order, update.status, user.role)
        
        old_status = order.status
        order.status = update.status
        order.version += 1
        now = datetime.utcnow()
        
        if update.status == OrderStatus.ACCEPTED: order.accepted_at = now
        elif update.status == OrderStatus.PACKED:
            order.packed_at = now
            order.packing_photo_url = update.photo_url
            # Capture Vendor Variance (If updated items provided)
            # Schema needs to support 'items' field in OrderUpdateStatus or via separate arg.
            # Assuming 'update.metadata_info' or similar? 
            # Wait, schemas needs update first. But I am in OrderService.
            # I will access 'update' object. Let's assume I add 'items' to OrderUpdateStatus schema next.
            if hasattr(update, 'items') and update.items:
                # Update item costs/quantities (Market Rate)
                order.items = [item.dict() for item in update.items]
                
        elif update.status == OrderStatus.IN_TRANSIT: order.picked_up_at = now
        elif update.status == OrderStatus.DELIVERED:
            order.delivered_at = now
            order.delivery_proof_url = update.photo_url
            # Capture Distance
            if hasattr(update, 'distance_km') and update.distance_km is not None:
                order.distance_km = update.distance_km
            else:
                # Default if not provided (e.g. fixed route)
                order.distance_km = 10.0 
                
        elif update.status == OrderStatus.REJECTED:
            order.rejected_at = now
            order.rejection_reason = update.reason
        elif update.status == OrderStatus.DELIVERY_FAILED:
            order.failed_delivery_at = now
            order.delivery_failure_reason = update.reason
        elif update.status == OrderStatus.CANCELLED:
            order.cancelled_at = now
            order.cancellation_reason = update.reason
        elif update.status == OrderStatus.CLOSED:
            order.closed_at = now
            # INVOICE TRIGGER (Step 11/12)
            billing_service.generate_invoices_for_order(db, order)
            
        audit_service.log_event(db, order.id, "STATUS_CHANGE", user, {"status": old_status}, {"status": order.status, "reason": update.reason})
        
        db.commit()
        db.refresh(order)
        return order
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=409, detail=f"Update failed: {str(e)}")
