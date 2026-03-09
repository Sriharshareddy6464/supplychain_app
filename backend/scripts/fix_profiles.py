import sys
import os
import importlib
import pkgutil

# 1. Setup Python Path
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.kitchen import Kitchen
from app.models.vendor import Vendor
from app.models.transport import Transport

# --- THE NUCLEAR FIX: IMPORT ALL MODELS AUTOMATICALLY ---
def load_all_models():
    """
    Scans the 'app/models' directory and imports every .py file found.
    This ensures SQLAlchemy knows about OrderEvent, OrderItem, etc.
    """
    models_path = os.path.join(os.getcwd(), "app", "models")
    if not os.path.exists(models_path):
        print(f"❌ Error: Could not find models directory at {models_path}")
        return

    print("🔌 Auto-loading models...")
    for filename in os.listdir(models_path):
        if filename.endswith(".py") and filename != "__init__.py":
            module_name = f"app.models.{filename[:-3]}" # remove .py
            try:
                importlib.import_module(module_name)
                # print(f"   - Loaded {module_name}")
            except Exception as e:
                print(f"   ⚠️ Warning: Could not import {module_name}: {e}")

def fix_profiles():
    # Load everything first!
    load_all_models()
    
    db = SessionLocal()
    try:
        print("\n🔍 SCANNING USER PROFILES...")
        users = db.query(User).all()
        fixed_count = 0
        
        for user in users:
            # --- 1. FIX KITCHEN ---
            if user.role == UserRole.KITCHEN:
                # Use getattr to avoid crash if relationship isn't mapped yet
                if not getattr(user, 'kitchen', None):
                    print(f"   🔧 Fixing Kitchen profile for: {user.email}")
                    db.add(Kitchen(
                        user_id=user.id,
                        restaurant_name=f"{user.full_name}'s Kitchen",
                        address="123 Culinary Ave, Food City",
                        contact_number="9876543210"
                    ))
                    fixed_count += 1

            # --- 2. FIX VENDOR ---
            elif user.role == UserRole.VENDOR:
                if not getattr(user, 'vendor', None):
                    print(f"   🔧 Fixing Vendor profile for: {user.email}")
                    # Assign a valid JSON category so it doesn't crash later
                    db.add(Vendor(
                        user_id=user.id,
                        business_name=f"{user.full_name}'s Market",
                        address="456 Farm Road",
                        rating=5.0,
                        categories='["general"]' 
                    ))
                    fixed_count += 1

            # --- 3. FIX TRANSPORTER ---
            elif user.role == UserRole.TRANSPORTER:
                if not getattr(user, 'transporter', None): 
                    print(f"   🔧 Fixing Transport profile for: {user.email}")
                    db.add(Transport(
                        user_id=user.id,
                        driver_name=user.full_name,
                        vehicle_number="KA-05-AB-1234",
                        vehicle_type="Truck"
                    ))
                    fixed_count += 1
                    
        db.commit()
        print(f"\n✅ DONE: Created {fixed_count} missing profiles.")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_profiles()