from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.services import auth_service
from app.schemas.user_schema import Token, UserCreate, UserResponse
from app.utils.security import create_access_token
from app.config import settings
from app.models.user import UserRole
from app.utils.permissions import RoleChecker

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.email,
        role=user.role,
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserResponse, dependencies=[Depends(RoleChecker([UserRole.AGGREGATOR]))])
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Only Aggregators can register new users (Vendors, Kitchens, Transporters).
    """
    return auth_service.create_user(db, user)
