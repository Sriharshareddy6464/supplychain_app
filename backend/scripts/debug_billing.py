import sys
import os
import importlib

# 1. Setup Python Path
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models.order import Order
from app.models.invoice import Invoice, InvoiceType # <--- Import the valid Enum

from app.services import billing_service
from app.models.invoice import InvoiceType

# --- AUTO-LOAD MODELS ---
def load_all_models():
    models_path = os.path.join(os.getcwd(), "app", "models")
    for filename in os.listdir(models_path):
        if filename.endswith(".py") and filename != "__init__.py":
            module_name = f"app.models.{filename[:-3]}"
            try:
                importlib.import_module(module_name)
            except:
                pass

def diagnose_order(order_id):
    load_all_models()
    db = SessionLocal()
    
    print(f"\n--- BILLING ENGINE TEST: Order #{order_id} ---")
    
    try:
        # 1. FETCH ORDER
        order = db.query(Order).get(order_id)
        if not order:
            print(f"❌ Error: Order #{order_id} not found!")
            return

        print(f"✅ Order Found. Status: {order.status}")
        
        # Mock status for test if needed
        original_status = order.status
        order.status = "CLOSED" 
        
        # 2. RUN GENERATOR
        print("\n🧪 Running 3-Way Split Logic...")
        invoices = billing_service.generate_invoices_for_order(db, order)
        
        if not invoices:
            print("⚠️ No invoices generated (Maybe already exist?)")
            # Fetch existing
            invoices = db.query(Invoice).filter(Invoice.order_id==order.id).all()
            
        print(f"\n📄 Generated {len(invoices)} Invoices:")
        for inv in invoices:
            print(f"   - [{inv.type.value}] Amount: ${inv.amount}")
            
        # Revert status if we mocked it (and didn't commit)
        # But generate_invoices commits... so this is a real test. 
        # Ideally we rollback.
        
        print("\n✅ Verification Complete.")

    except Exception as e:
        print("\n💥 CRASH DETECTED!")
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # You might need to change ID to an existing one
    diagnose_order(1)