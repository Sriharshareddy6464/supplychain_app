from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime

from app.models.order import Order, OrderStatus
from app.models.invoice import Invoice, InvoiceType
from app.models.user import User
from app.utils.pricing import calculate_kitchen_price, calculate_vendor_payout, calculate_transport_payout
from app.schemas.invoice_schema import FinancialReport

def generate_invoices_for_order(db: Session, order: Order):
    """
    Generates 3 invoices/bills when an order is closed.
    """
    # Safety Check: Only close orders can be billed
    if order.status != OrderStatus.CLOSED:
        return []
    
    # Check if invoices already exist to avoid duplicates (Double Billing protection)
    existing = db.query(Invoice).filter(Invoice.order_id == order.id).first()
    if existing:
        return []

    invoices = []
    
    # 1. Logic Constants (Should be in Config/DB in real system)
    TRANSPORT_FUEL_RATE = 10.0 # Per KM
    TRANSPORT_DRIVER_FEE = 150.0 # Fixed per ride
    PLATFORM_FEE_PCT = 0.10 # 10%
    
    # 2. Calculate Amounts
    
    # A. Kitchen Amount = Sum(Qty * SellingPrice)
    kitchen_total = 0.0
    # B. Vendor Payout = Sum(Qty * VendorCost)
    vendor_total = 0.0
    
    if order.items:
        for item in order.items:
            # Handle Dictionary vs Object safely
            qty = item.get('quantity') if isinstance(item, dict) else item.quantity
            sell_price = item.get('selling_price') if isinstance(item, dict) else item.selling_price
            cost_price = item.get('vendor_cost') if isinstance(item, dict) else item.vendor_cost
            
            kitchen_total += (qty * sell_price)
            vendor_total += (qty * cost_price)

    # C. Transport Payout = (Dist * Rate) + Fee
    dist = order.distance_km if order.distance_km else 5.0 # Min distance fallback
    transport_total = (dist * TRANSPORT_FUEL_RATE) + TRANSPORT_DRIVER_FEE
    
    # Update Order Final Bill Amount
    order.final_bill_amount = kitchen_total
    db.add(order) # Stage update
    
    # 3. Create Invoices
    
    # Invoice 1: Kitchen Receivable
    inv_kitchen = Invoice(
        order_id=order.id,
        type=InvoiceType.KITCHEN_BILL,
        amount=kitchen_total
    )
    db.add(inv_kitchen)
    invoices.append(inv_kitchen)
    
    # Invoice 2: Vendor Payout
    inv_vendor = Invoice(
        order_id=order.id,
        type=InvoiceType.VENDOR_PAYOUT,
        amount=vendor_total
    )
    db.add(inv_vendor)
    invoices.append(inv_vendor)

    # Invoice 3: Transport Payout
    inv_transport = Invoice(
        order_id=order.id,
        type=InvoiceType.TRANSPORT_PAYOUT,
        amount=transport_total
    )
    db.add(inv_transport)
    invoices.append(inv_transport)
    
    db.commit()
    return invoices

def get_financial_report(db: Session):
    """
    Aggregates financial data for the Admin Dashboard.
    """
    # Sum by type (Using correct 'amount' column)
    kitchen_revenue = db.query(func.sum(Invoice.amount)).filter(Invoice.type == InvoiceType.KITCHEN_BILL).scalar() or 0.0
    vendor_cost = db.query(func.sum(Invoice.amount)).filter(Invoice.type == InvoiceType.VENDOR_PAYOUT).scalar() or 0.0
    transport_cost = db.query(func.sum(Invoice.amount)).filter(Invoice.type == InvoiceType.TRANSPORT_PAYOUT).scalar() or 0.0
    
    # Net Profit = (Money In) - (Money Out)
    net_profit = kitchen_revenue - (vendor_cost + transport_cost)
    
    return FinancialReport(
        total_revenue=kitchen_revenue,
        total_vendor_payout=vendor_cost,
        total_transport_payout=transport_cost,
        net_profit=net_profit
    )

def close_order(db: Session, order_id: int, user: User):
    from app.services.order_service import update_status
    from app.schemas.order_schema import OrderUpdateStatus
    
    # 1. Close the order (handles validation and state transition)
    order = update_status(db, order_id, OrderUpdateStatus(status=OrderStatus.CLOSED), user)
    
    # 2. Generate financials immediately
    generate_invoices_for_order(db, order)
    
    return order