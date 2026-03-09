from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.kitchen import Kitchen
from app.models.vendor import Vendor
from app.models.transport import Transport
from app.models.order import Order
from app.models.invoice import Invoice
from app.models.audit import OrderEvent
from app.utils.security import get_password_hash

def seed_users():
    db = SessionLocal()
    
    users = [
        {"full_name": "Aggregator Admin", "email": "admin@aggregator.com",     "password": "admin123",     "role": UserRole.AGGREGATOR},
        {"full_name": "Head Chef",        "email": "chef@kitchen.com",          "password": "chef123",      "role": UserRole.KITCHEN},
        {"full_name": "Vendor Manager",   "email": "vendor@vendor.com",         "password": "vendor123",    "role": UserRole.VENDOR},
        {"full_name": "Driver",           "email": "driver@logistics.com",      "password": "driver123",    "role": UserRole.TRANSPORTER},
    ]

    print("--- SEEDING USERS ---")
    for u in users:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if existing:
            # Check if profile exists; if not Create it? (Simplification: just skip)
            print(f"Skipping {u['email']} (Already exists)")
            continue

        # Create Base User
        new_user = User(
            email=u["email"],
            hashed_password=get_password_hash(u["password"]),
            full_name=u["full_name"],
            role=u["role"],
            is_active=True
        )
        db.add(new_user)
        db.commit() # Commit to get ID
        db.refresh(new_user)

        # Create Profile
        if u["role"] == UserRole.KITCHEN:
            profile = Kitchen(
                user_id=new_user.id,
                restaurant_name=u.get("business_name"),
                address="100 Feet Road, Indiranagar",
                contact_number="9999999999"
            )
            db.add(profile)
        elif u["role"] == UserRole.VENDOR:
            profile = Vendor(
                user_id=new_user.id,
                business_name=u.get("business_name"),
                address="City Market"
            )
            # wait, vendor.py did not have contact_phone in the view!
            # Let me recheck vendor.py content quickly in my head:
            # id, user_id, business_name, address, rating, categories.
            # NO contact_phone in vendor.py provided in Step 850.
            # Removing contact_phone.
            db.add(profile)
        elif u["role"] == UserRole.TRANSPORTER:
            profile = Transport(
                user_id=new_user.id,
                driver_name=u["full_name"],
                vehicle_number=u.get("vehicle_number"),
                # phone_number="7777777777" # Check transport.py Step 851: driver_name, vehicle_number, vehicle_type. NO phone_number.
                vehicle_type="Van"
            )
            db.add(profile)
            
        print(f"✔ Created {u['role'].name}: {u['email']}")

    db.commit()
    db.close()
    print("--- SEEDING COMPLETE ---")

if __name__ == "__main__":
    seed_users()
