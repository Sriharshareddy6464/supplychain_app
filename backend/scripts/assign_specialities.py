import json
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from app.config import settings

def assign_roles():
    engine = create_engine(settings.DATABASE_URL)
    
    # Map Email -> List of Categories (Actual Python Lists now)
    vendor_assignments = {
        "kuragailaraju@vendor.com": {"cat": ["vegetables", "fruits"], "name": "Raju Veggies"},
        "butcher@vendor.com":       {"cat": ["meat"],                 "name": "The City Butcher"},
        "dairyproducts@vendor.com": {"cat": ["dairy"],                "name": "Daily Dairy Farm"}
    }

    with engine.connect() as conn:
        conn = conn.execution_options(isolation_level="AUTOCOMMIT")
        print("\n--- UPDATING VENDOR LICENSES (JSON FORMAT) ---")
        
        for email, data in vendor_assignments.items():
            # 1. Get User ID
            result = conn.execute(text(f"SELECT id FROM users WHERE email = '{email}'"))
            user = result.fetchone()
            
            if not user:
                print(f"❌ SKIPPED: User {email} not found.")
                continue
            
            user_id = user.id
            business_name = data['name']
            
            # CONVERT LIST TO JSON STRING: ["vegetables", "fruits"]
            category_json = json.dumps(data['cat']) 

            # 2. Check existence in vendors table
            v_result = conn.execute(text(f"SELECT id FROM vendors WHERE user_id = {user_id}"))
            vendor_row = v_result.fetchone()

            # Note: We use '{category_json}' inside the SQL string. 
            # This puts the JSON string inside single quotes, which SQL requires.
            if vendor_row:
                # UPDATE
                conn.execute(text(f"""
                    UPDATE vendors 
                    SET categories = '{category_json}', business_name = '{business_name}'
                    WHERE user_id = {user_id}
                """))
                print(f"✅ UPDATED: {email} license -> {category_json}")
            else:
                # INSERT
                conn.execute(text(f"""
                    INSERT INTO vendors (user_id, business_name, address, rating, categories)
                    VALUES ({user_id}, '{business_name}', '123 Market St', 5.0, '{category_json}')
                """))
                print(f"✅ CREATED: Profile for {email} -> {category_json}")

if __name__ == "__main__":
    assign_roles()