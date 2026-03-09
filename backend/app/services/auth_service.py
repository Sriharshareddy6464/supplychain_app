from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, UserRole
from app.models.kitchen import Kitchen
from app.models.vendor import Vendor
from app.models.transport import Transport
from app.schemas.user_schema import UserCreate
from app.utils.security import get_password_hash, verify_password

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    db_user = get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    # Default is_active to True, Role comes from input
    new_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create associated profile based on role
    if new_user.role == UserRole.KITCHEN:
        profile = Kitchen(
            user_id=new_user.id,
            restaurant_name=f"{new_user.full_name}'s Kitchen",
            address="Pending Address",
            contact_number="Pending"
        )
        db.add(profile)
    elif new_user.role == UserRole.VENDOR:
        profile = Vendor(
            user_id=new_user.id,
            business_name=f"{new_user.full_name}'s Business",
            address="Pending Address",
            rating=5.0
        )
        db.add(profile)
    elif new_user.role == UserRole.TRANSPORTER:
        profile = Transport(
            user_id=new_user.id,
            driver_name=new_user.full_name,
            vehicle_number="PENDING",
            vehicle_type="Bike"
        )
        db.add(profile)
    
    db.commit()
    return new_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user
