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
        # 1. Aggregator
        {
            "email": "supplier@aggregator.com",
            "full_name": "Supplier Admin",
            "role": UserRole.AGGREGATOR,
            "password": "supplier123"
        },
        # 2. Kitchen
        {
            "email": "headchef@cloudkitchen.com",
            "full_name": "Head Chef",
            "role": UserRole.KITCHEN,
            "business_name": "The Cloud Kitchen",
            "password": "chef123"
        },
        # 3. Vendors
        {
            "email": "kuragailaraju@vendor.com",
            "full_name": "Raju Veggies",
            "role": UserRole.VENDOR,
            "business_name": "Raju's Farm Fresh",
            "password": "vendor123"
        },
        {
            "email": "butcher@vendor.com",
            "full_name": "Bob The Butcher",
            "role": UserRole.VENDOR,
            "business_name": "Premium Meats Inc",
            "password": "vendor123"
        },
        {
            "email": "dairyproducts@vendor.com",
            "full_name": "Daisy Dairy",
            "role": UserRole.VENDOR,
            "business_name": "Milky Way",
            "password": "vendor123"
        },
        # 4. Transporter
        {
            "email": "driver@logistics.com",
            "full_name": "Fast Eddie",
            "role": UserRole.TRANSPORTER,
            "vehicle_number": "KA-01-AB-1234",
            "password": "driver123"
        }
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
