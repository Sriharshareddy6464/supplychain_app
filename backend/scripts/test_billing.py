import requests
import sys
import json

# --- CONFIG ---
BASE_URL = "http://127.0.0.1:8000"

# CREDENTIALS
ADMIN = {"username": "supplier@aggregator.com", "password": "supplier123"}
KITCHEN = {"username": "chef@kitchen.com", "password": "chef123"}
VENDOR = {"username": "kuragailaraju@vendor.com", "password": "raju123"} 
DRIVER = {"username": "driver@transporter.com", "password": "driver123"}

def get_token(creds):
    resp = requests.post(f"{BASE_URL}/auth/login", data=creds)
    if resp.status_code == 200:
        return resp.json()["access_token"]
    print(f"❌ Login Failed for {creds['username']}")
    sys.exit(1)

def run_test():
    print("\n🧪 STARTING DYNAMIC BILLING TEST...")

    # 1. LOGINS
    print("🔑 Logging in actors...")
    t_admin = get_token(ADMIN)
    t_chef = get_token(KITCHEN)
    t_vendor = get_token(VENDOR)
    t_driver = get_token(DRIVER)

    h_chef = {"Authorization": f"Bearer {t_chef}"}
    h_admin = {"Authorization": f"Bearer {t_admin}"}
    h_vendor = {"Authorization": f"Bearer {t_vendor}"}
    h_driver = {"Authorization": f"Bearer {t_driver}"}

    # 2. CREATE ORDER (Standard Contract Price = $30)
    print("📝 Chef creates order (Contract Price: $30)...")
    order_payload = {
        "items": [{
            "item_id": "item_101", 
            "item_name": "Premium Potatoes",
            "quantity": 10,
            "vendor_cost": 25,  # Original Cost
            "selling_price": 30, # Contract Price
            "item_total": 300
        }]
    }
    resp = requests.post(f"{BASE_URL}/orders/", json=order_payload, headers=h_chef)
    order_id = resp.json()['id'] if isinstance(resp.json(), dict) else resp.json()[0]['id']
    print(f"   ✅ Order #{order_id} Created.")

    # 3. ASSIGN VENDOR (Get ID first)
    # Note: Assuming you know the vendor ID is 1 from the nuke/seed. 
    # If not, use the previous helper function to find it.
    requests.post(f"{BASE_URL}/orders/{order_id}/assign-vendor", 
                  json={"vendor_id": 1, "category": "vegetables"}, headers=h_admin)
    print("   ✅ Vendor Assigned.")

    requests.post(f"{BASE_URL}/orders/{order_id}/assign-transporter", 
                  json={"transporter_id": 4}, headers=h_admin) # Assuming Driver User ID is 4
    print("   ✅ Driver Assigned.")

    # 4. VENDOR PACKING (The Dynamic Part!)
    # Vendor accepts...
    requests.post(f"{BASE_URL}/orders/{order_id}/accept", headers=h_vendor)
    
    # Vendor PACKS with NEW MARKET PRICE ($40 instead of $25)
    print("📦 Vendor Packing with MARKET SURGE (Cost $25 -> $40)...")
    pack_payload = {
        "items": [{
            "item_id": "item_101",
            "packed_qty": 10,
            "new_market_cost": 40 # <--- THIS IS THE TEST
        }]
    }
    # Note: Ensure your API accepts this structure. 
    # If your API just takes status, we might need to update the payload format 
    # based on your specific implementation. 
    # Assuming standard /pack endpoint:
    requests.post(f"{BASE_URL}/orders/{order_id}/pack", json=pack_payload, headers=h_vendor)
    print("   ✅ Packed with new rates.")

    # 5. DRIVER DELIVERY (The Distance Part!)
    requests.post(f"{BASE_URL}/orders/{order_id}/pickup", headers=h_driver)
    
    print("🚚 Driver Delivering (Distance: 15 KM)...")
    deliver_payload = {"distance_km": 15.0}
    requests.post(f"{BASE_URL}/orders/{order_id}/deliver", json=deliver_payload, headers=h_driver)
    print("   ✅ Delivered.")

    # 6. CLOSE & VERIFY INVOICES
    print("💰 Closing Order & Checking Invoices...")
    requests.post(f"{BASE_URL}/billing/orders/{order_id}/close", headers=h_admin)
    
    # Fetch Invoices
    resp = requests.get(f"{BASE_URL}/billing/invoices/{order_id}", headers=h_admin)
    invoices = resp.json()

    print("\n--- 🧾 INVOICE AUDIT ---")
    for inv in invoices:
        print(f"Type: {inv['type']} | Amount: ${inv['amount']}")
        
        # VERIFICATION LOGIC
        if inv['type'] == 'KITCHEN_BILL':
            # Should be 10 qty * $30 (Contract) = 300
            if inv['amount'] == 300: print("   ✅ Kitchen Bill Correct (Contract Price Used)")
            else: print("   ❌ FAIL: Kitchen Bill Wrong")
            
        elif inv['type'] == 'VENDOR_PAYOUT':
            # Should be 10 qty * $40 (Market Rate) = 400
            if inv['amount'] == 400: print("   ✅ Vendor Payout Correct (Dynamic Market Rate Used)")
            else: print("   ❌ FAIL: Vendor Payout Wrong")
            
        elif inv['type'] == 'TRANSPORT_PAYOUT':
            # Formula: (15km * 10) + 150 Base = 300
            if inv['amount'] == 300: print("   ✅ Transport Payout Correct (Distance Formula Used)")
            else: print("   ❌ FAIL: Transport Payout Wrong")

if __name__ == "__main__":
    run_test()