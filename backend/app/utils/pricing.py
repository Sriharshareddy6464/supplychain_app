from typing import Dict, Any

# Simple Pricing Strategy configuration
PLATFORM_FEE_PERCENTAGE = 0.10  # 10%
TRANSPORT_BASE_RATE = 50.0      # Base currency unit
TRANSPORT_PER_KM = 10.0         # Placeholder, not used yet without distance

def calculate_kitchen_price(item_total: float) -> float:
    """
    Price the Kitchen pays (or the total order value collected from kitchen customer logic? 
    Using simplified model: Kitchen pays platform fee on top of order value? 
    Or Aggregator collects Total from Customer, pays Kitchen?
    
    Let's assume:
    Kitchen Invoice = Platform Fee + Transport (if Kitchen bears it)
    """
    return item_total * PLATFORM_FEE_PERCENTAGE

def calculate_vendor_payout(item_total: float) -> float:
    """
    What Aggregator pays to Vendor.
    """
    # Simply 100% of item cost for now. 
    # Realistically, Vendor might give a wholesale price.
    # Let's assume ITEM_TOTAL is the wholesale cost for this MVP.
    return item_total

def calculate_transport_payout(distance_km: float = 5.0) -> float:
    """
    What Aggregator pays to Transporter.
    """
    return TRANSPORT_BASE_RATE + (distance_km * TRANSPORT_PER_KM)
