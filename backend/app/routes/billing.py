from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services import billing_service
from app.schemas.order_schema import OrderResponse
from app.schemas.invoice_schema import InvoiceResponse, FinancialReport
from app.models.user import User, UserRole
from app.utils.permissions import RoleChecker

router = APIRouter(
    prefix="/billing",
    tags=["Billing"]
)

@router.post("/orders/{order_id}/close", response_model=OrderResponse)
def close_order(
    order_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(RoleChecker([UserRole.AGGREGATOR]))
):
    """
    Closes the order and triggers invoice generation.
    """
    return billing_service.close_order(db, order_id, current_user)

@router.get("/reports", response_model=FinancialReport)
def get_report(
    db: Session = Depends(get_db), 
    current_user: User = Depends(RoleChecker([UserRole.AGGREGATOR]))
):
    return billing_service.get_financial_report(db)

@router.get("/invoices/{order_id}", response_model=List[InvoiceResponse])
def get_order_invoices(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.AGGREGATOR]))
):
    # Retrieve invoices for a specific order
    from app.models.invoice import Invoice
    return db.query(Invoice).filter(Invoice.order_id == order_id).all()
