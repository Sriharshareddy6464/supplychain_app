import sys
import os

# --- SETUP PATH ---
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models.user import User
# Explicitly import related models to populate registry
from app.models.kitchen import Kitchen
from app.models.vendor import Vendor
from app.models.transport import Transport
from app.models.order import Order
from app.models.invoice import Invoice
from app.models.audit import OrderEvent
from app.utils.security import get_password_hash

def reset_passwords():
    db = SessionLocal()
    users = db.query(User).all()
    
    new_hash = get_password_hash("password123")
    
    print(f"🔧 Resetting passwords for {len(users)} users to 'password123'...")
    
    for user in users:
        user.hashed_password = new_hash
        print(f"   - {user.email}")
        
    db.commit()
    db.close()
    print("✅ All passwords reset.")

if __name__ == "__main__":
    reset_passwords()
