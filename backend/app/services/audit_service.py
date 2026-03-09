from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime
from app.models.audit import OrderEvent
from app.models.user import User

def log_event(
    db: Session, 
    order_id: int, 
    event_type: str, 
    actor: User, 
    old_value: Optional[Dict[str, Any]] = None, 
    new_value: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Logs an immutable event for an order.
    """
    event = OrderEvent(
        order_id=order_id,
        event_type=event_type,
        actor_id=actor.id,
        actor_role=actor.role.value if actor.role else None,
        old_value=old_value,
        new_value=new_value,
        metadata_info=metadata
    )
    db.add(event)
    # Note: We don't commit here usually, assuming it's part of the main transaction.
    # But for audit, sometimes we want it even if main fails? 
    # For now, let's assume it shares the transaction scope of the main action.
    
    return event

def get_events(db: Session, order_id: int):
    return db.query(OrderEvent).filter(OrderEvent.order_id == order_id).order_by(OrderEvent.timestamp.asc()).all()
