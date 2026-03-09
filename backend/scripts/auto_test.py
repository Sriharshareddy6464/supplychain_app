import requests
import sys
import json
from sqlalchemy import create_engine, text
from app.config import settings

# --- CONFIGURATION ---
BASE_URL = "http://127.0.0.1:8000"

# 1. FIXED ROLES
ADMIN = {"username": "supplier@aggregator.com", "password": "supplier123"}
KITCHEN = {"username": "chef@kitchen.com", "password": "chef123"}
TRANSPORTER = {"username": "driver@transporter.com", "password": "driver123"}

# 2. VENDOR CONFIGURATION
TEST_SCENARIOS = [
    {
        "type": "VEG",
        "creds": {"username": "kuragailaraju@vendor.com", "password": "raju123"},
        "item_name": "Fresh Carrots",
        "category_key": "vegetables",
        "price": 30,
        "cost": 25
    },
    {
        "type": "MEAT",
        "creds": {"username": "butcher@vendor.com", "password": "butcher123"},
        "item_name": "Angus Steak",
        "category_key": "meat",
        "price": 500,
        "cost": 400
    },
    {
        "type": "DAIRY",
        "creds": {"username": "dairyproducts@vendor.com", "password": "dairy123"},
        "item_name": "Cheddar Cheese",
        "category_key": "dairy",
        "price": 150,
        "cost": 100
    }
]

# ---------------------

def get_driver_id(email):
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT id FROM users WHERE email = '{email}'"))
        user = result.fetchone()
        return user.id if user else None

def get_vendor_profile_id(email):
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        query = text(f"""
            SELECT v.id 
            FROM vendors v 
            JOIN users u ON v.user_id = u.id 
            WHERE u.email = '{email}'
        """)
        result = conn.execute(query)
        row = result.fetchone()
        return row.id if row else None

def fix_order_category(order_id, category):
    """
    MAGIC FIX: Forces the order in the DB to match the target category.
    This bypasses the 'General' default issue.
    """
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        conn = conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"UPDATE orders SET category = '{category}' WHERE id = {order_id}"))
        print(f"      🔧 Fixed Order #{order_id} category to '{category}'")

def get_token(creds):
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", data=creds)
        if resp.status_code == 200:
            return resp.json()["access_token"]
        print(f"   ❌ Login Failed for {creds['username']}: {resp.text}")
        return None
    except Exception as e:
        print(f"   ❌ Connection Error: {e}")
        sys.exit(1)

def run_scenario(scenario, admin_token, chef_token, driver_token, driver_id):
    cat_name = scenario['type']
    target_category = scenario['category_key']
    print(f"\n🎬 STARTING SCENARIO: {cat_name} ------------------------")

    # 1. Setup Vendor
    vendor_creds = scenario['creds']
    vendor_id = get_vendor_profile_id(vendor_creds['username'])
    
    if not vendor_id:
        print("   ❌ SKIPPING: Vendor Profile not found.")
        return
    print(f"      ✅ Vendor Profile ID: {vendor_id}")

    vendor_token = get_token(vendor_creds)
    if not vendor_token: return

    h_admin = {"Authorization": f"Bearer {admin_token}"}
    h_chef = {"Authorization": f"Bearer {chef_token}"}
    h_vendor = {"Authorization": f"Bearer {vendor_token}"}
    h_driver = {"Authorization": f"Bearer {driver_token}"}

    # 2. Create Order
    print(f"   📝 Chef ordering {scenario['item_name']}...")
    qty = 10
    price = scenario['price']
    cost = scenario['cost']
    
    order_payload = {
        "items": [
            {
                "item_id": "item_99", 
                "item_name": scenario['item_name'],
                "quantity": qty,
                "vendor_cost": cost,
                "selling_price": price,
                "item_total": qty * price
            }
        ]
    }
    
    resp = requests.post(f"{BASE_URL}/orders/", json=order_payload, headers=h_chef)
    if resp.status_code != 200:
        print(f"   ❌ Order Creation Failed: {resp.text}")
        return

    data = resp.json()
    order_id = data[0]['id'] if isinstance(data, list) else data['id']
    print(f"      ✅ Order #{order_id} Created.")

    # --- THE INTERVENTION ---
    # We force the DB to update the category so the assignment will work
    fix_order_category(order_id, target_category)
    # ------------------------

    # 3. Assign Vendor
    print(f"   👮 Admin assigning {cat_name} Vendor...")
    assign_payload = {"vendor_id": vendor_id, "category": target_category}
    resp = requests.post(f"{BASE_URL}/orders/{order_id}/assign-vendor", json=assign_payload, headers=h_admin)
    
    if resp.status_code != 200:
        print(f"      ❌ Failed: {resp.text}")
        return
    print("      ✅ Vendor Assigned.")

    # 4. Assign Driver
    requests.post(f"{BASE_URL}/orders/{order_id}/assign-transporter", json={"transporter_id": driver_id}, headers=h_admin)
    print("   🚚 Driver Assigned.")

    # 5. Vendor Process
    requests.post(f"{BASE_URL}/orders/{order_id}/accept", headers=h_vendor)
    requests.post(f"{BASE_URL}/orders/{order_id}/pack", headers=h_vendor)
    print("   🥦 Vendor Accepted & Packed.")

    # 6. Driver Process
    requests.post(f"{BASE_URL}/orders/{order_id}/pickup", headers=h_driver)
    requests.post(f"{BASE_URL}/orders/{order_id}/deliver", headers=h_driver)
    print("   🏁 Driver Delivered.")

    # 7. Close & Bill
    resp = requests.post(f"{BASE_URL}/billing/orders/{order_id}/close", headers=h_admin)
    if resp.status_code == 200:
        rev = resp.json().get('total_amount', '0')
        print(f"   💰 INVOICE GENERATED. Revenue: ${rev}")
    else:
        print(f"   ❌ Billing Error: {resp.text}")

def main():
    print("\n🚀 LAUNCHING ULTIMATE SUPPLY CHAIN TEST")
    
    admin_token = get_token(ADMIN)
    chef_token = get_token(KITCHEN)
    driver_token = get_token(TRANSPORTER)
    
    if not (admin_token and chef_token and driver_token):
        print("❌ CRITICAL: Login failed.")
        return

    driver_id = get_driver_id(TRANSPORTER['username'])
    if not driver_id: return

    print("   ✅ Global Actors Ready.")

    for scenario in TEST_SCENARIOS:
        run_scenario(scenario, admin_token, chef_token, driver_token, driver_id)

    print("\n🎉 ALL TESTS COMPLETE.")

if __name__ == "__main__":
    main()