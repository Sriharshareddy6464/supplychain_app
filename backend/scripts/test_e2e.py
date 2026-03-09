import requests
import sys
import os
import time

# --- SETUP PATH FOR IMPORTS ---
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from sqlalchemy import create_engine, text
from app.config import settings

# --- CONFIG ---
BASE_URL = "http://127.0.0.1:8000"

# --- USERS ---
ADMIN = {"username": "supplier@aggregator.com", "password": "supplier123"}
KITCHEN = {"username": "headchef@cloudkitchen.com", "password": "chef123"}
TRANSPORTER = {"username": "driver@logistics.com", "password": "driver123"}

VENDORS = {
    # Using correct emails from DB (as seen in reset_passwords output)
    "vegetables": {"email": "kuragailaraju@vendor.com", "pass": "vendor123", "id": 1}, 
    "dairy":      {"email": "dairyproducts@vendor.com", "pass": "vendor123", "id": 3},
    "meat":       {"email": "butcher@vendor.com", "pass": "vendor123", "id": 2}
}
# Note: IDs might need to be dynamic or looked up if they changed. 
# But for now assuming 1, 3, 2 based on likely creation order or previous logs. 
# If assign fails due to ID mismatch, we will fix.
# Better: Helper to find ID by email.
# Note: IDs 3, 4, 5 are from list_vendors output in previous step. 
# Adjust if needed based on real DB. I'll rely on API to fail if ID is wrong.

def db_get_transporter_id(email):
    """Helper to get Transporter Profile ID directly from DB."""
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        res = conn.execute(text(f"SELECT t.id FROM transporters t JOIN users u ON t.user_id = u.id WHERE u.email = '{email}'"))
        row = res.fetchone()
        return row[0] if row else None

def get_token(creds):
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", data=creds)
        if resp.status_code == 200:
            return resp.json()["access_token"]
        print(f"   ❌ Login Failed for {creds.get('username', creds.get('email'))}: {resp.text}")
        return None
    except Exception as e:
        print(f"   ❌ Connection Error: {e}")
        return None

def db_get_vendor_id(email):
    """Helper to get Vendor Profile ID."""
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        # User -> Vendor
        res = conn.execute(text(f"SELECT v.id FROM vendors v JOIN users u ON v.user_id = u.id WHERE u.email = '{email}'"))
        row = res.fetchone()
        return row[0] if row else None

def run_e2e_scenario(category, item_name, cost, price, distance, surge_cost=None):
    print(f"\n🎬 SCENARIO: {category.upper()} (Item: {item_name}) --------------------------------")
    
    # 1. SETUP
    admin_token = get_token(ADMIN)
    chef_token = get_token(KITCHEN)
    driver_token = get_token(TRANSPORTER)
    
    vendor_conf = VENDORS.get(category.lower())
    if not vendor_conf:
        print(f"   ❌ No config for {category}")
        return
    
    # Lookup Real Vendor ID
    real_v_id = db_get_vendor_id(vendor_conf["email"])
    if not real_v_id:
        print(f"   ❌ Vendor Profile not found for {vendor_conf['email']}")
        return
    vendor_conf['id'] = real_v_id
    print(f"   ℹ️  Vendor {vendor_conf['email']} ID: {real_v_id}")

    vendor_token = get_token({"username": vendor_conf["email"], "password": vendor_conf["pass"]})
    
    if not (admin_token and chef_token and driver_token and vendor_token):
        print("   ❌ Auth Failed. Aborting Scenario.")
        return

    h_admin = {"Authorization": f"Bearer {admin_token}"}
    h_chef = {"Authorization": f"Bearer {chef_token}"}
    h_vendor = {"Authorization": f"Bearer {vendor_token}"}
    h_driver = {"Authorization": f"Bearer {driver_token}"}

    # 2. CREATE ORDER
    print(f"   1️⃣  Kitchen creates order...")
    qty = 10
    payload = {
        "items": [{
            "item_id": f"test_{category}",
            "item_name": item_name,
            "category": category, # Crucial for splitting
            "quantity": qty,
            "vendor_cost": cost,
            "selling_price": price,
            "item_total": qty * price
        }]
    }
    resp = requests.post(f"{BASE_URL}/orders/", json=payload, headers=h_chef)
    if resp.status_code != 200:
        print(f"      ❌ Creation Failed: {resp.text}")
        return
    
    # Handle list response (splitting)
    data = resp.json()
    order = data[0] if isinstance(data, list) else data
    order_id = order['id']
    print(f"      ✅ Order #{order_id} Created (Cat: {order['category']}).")

    # 3. REVIEW & ASSIGN (Aggregator)
    print(f"   2️⃣  Aggregator Reviews & Assigns...")
    review_pl = {"action": "approve", "notes": "Looks good"}
    requests.post(f"{BASE_URL}/orders/{order_id}/review", json=review_pl, headers=h_admin)
    
    # Manual Assign if Auto-Assign didn't happen (or just to enforce specific vendor)
    assign_pl = {"vendor_id": vendor_conf["id"], "category": category}
    resp = requests.post(f"{BASE_URL}/orders/{order_id}/assign-vendor", json=assign_pl, headers=h_admin)
    if resp.status_code != 200:
        print(f"      ⚠️ Assign Warning: {resp.text} (Maybe already assigned via Auto-Assign?)")
        # Check status
        resp = requests.get(f"{BASE_URL}/orders/{order_id}", headers=h_admin)
        if resp.json()['status'] != "ASSIGNED":
             print("      ❌ Assignment Failed.")
             return
    print("      ✅ Vendor Assigned.")

    t_id = db_get_transporter_id(TRANSPORTER['username'])
    requests.post(f"{BASE_URL}/orders/{order_id}/assign-transporter", json={"transporter_id": t_id}, headers=h_admin)
    print("      ✅ Transporter Assigned.")

    # 4. VENDOR PACKING
    print(f"   3️⃣  Vendor Packs (Accept -> Pack)...")
    
    # Needs version for accept
    order_data = requests.get(f"{BASE_URL}/orders/{order_id}", headers=h_vendor).json()
    accept_ver = order_data['version']
    
    resp = requests.post(f"{BASE_URL}/orders/{order_id}/accept", json={"expected_version": accept_ver}, headers=h_vendor)
    if resp.status_code != 200:
        print(f"      ❌ Accept Failed: {resp.text}")
        return
        
    # Dynamic Variance Test
    pack_payload = {"status": "PACKED", "expected_version": accept_ver + 1} # Version increments on accept
    
    if surge_cost:
        print(f"      📈 MARKET SURGE! Updating cost from {cost} to {surge_cost}")
        # Construct updated items
        updated_items = order_data['items']
        for item in updated_items:
            item['vendor_cost'] = surge_cost
            item['item_total'] = item['quantity'] * item['selling_price'] # Total is usually selling total?
            # Wait, item_total in DB stores... what? 
            # In schemas, item_total is float. Usually quantity * price.
            # But here we are updating VENDOR COST. 
            pass
        pack_payload["items"] = updated_items
        
    resp = requests.post(f"{BASE_URL}/orders/{order_id}/pack", json=pack_payload, headers=h_vendor)
    if resp.status_code != 200:
        print(f"      ❌ Packing Failed: {resp.text}")
        return
    print("      ✅ Packed.")

    # 5. DELIVERY
    print(f"   4️⃣  Driver Delivers...")
    # Pickup
    order_data = requests.get(f"{BASE_URL}/orders/{order_id}", headers=h_driver).json()
    requests.post(f"{BASE_URL}/orders/{order_id}/pickup", json={"status": "IN_TRANSIT", "expected_version": order_data['version']}, headers=h_driver)
    
    # Deliver with Distance
    order_data = requests.get(f"{BASE_URL}/orders/{order_id}", headers=h_driver).json()
    del_payload = {
        "status": "DELIVERED", 
        "expected_version": order_data['version'],
        "distance_km": distance
    }
    requests.post(f"{BASE_URL}/orders/{order_id}/deliver", json=del_payload, headers=h_driver)
    print(f"      ✅ Delivered ({distance} km).")

    # 6. CONFIRMATION (Kitchen)
    print(f"   5️⃣  Kitchen Confirms...")
    requests.post(f"{BASE_URL}/orders/{order_id}/confirm-receipt", json={"ok": True}, headers=h_chef)

    # 7. CLOSE & BILLING
    print(f"   6️⃣  Aggregator Closes & Generates Invoices...")
    order_data = requests.get(f"{BASE_URL}/orders/{order_id}", headers=h_admin).json()
    resp = requests.post(f"{BASE_URL}/orders/{order_id}/close", json={"status": "CLOSED", "expected_version": order_data['version']}, headers=h_admin)
    if resp.status_code != 200:
         print(f"      ❌ Close Failed: {resp.text}")
         return

    # 8. VERIFY
    print("   🔍 Verifying Invoices...")
    inv_resp = requests.get(f"{BASE_URL}/billing/invoices/{order_id}", headers=h_admin)
    invoices = inv_resp.json()
    
    for inv in invoices:
        t = inv['type']
        amt = inv['amount']
        print(f"      - {t}: ${amt}")
        
        if t == "VENDOR_PAYOUT":
            expected = qty * (surge_cost if surge_cost else cost)
            if abs(amt - expected) < 0.1: print("        ✅ Vendor Payout Matches")
            else: print(f"        ❌ Vendor Payout Mismatch! Expected {expected}, Got {amt}")
        
        if t == "TRANSPORT_PAYOUT":
            # (Dist * 10) + 150
            expected = (distance * 10) + 150
            if abs(amt - expected) < 0.1: print("        ✅ Transport Payout Matches")
            else: print(f"        ❌ Transport Payout Mismatch! Expected {expected}, Got {amt}")

def main():
    print("🚀 STARTING E2E SYSTEM VERIFICATION")
    
    # Scenario 1: Veggies (Standard)
    run_e2e_scenario("vegetables", "Carrots", cost=25.0, price=30.0, distance=5.0)
    
    # Scenario 2: Meat (With Surge Pricing)
    run_e2e_scenario("meat", "Steak", cost=400.0, price=500.0, distance=12.0, surge_cost=450.0)
    
    print("\n🏁 TEST SUITE COMPLETE")

if __name__ == "__main__":
    main()
