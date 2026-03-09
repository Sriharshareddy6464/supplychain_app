from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.schemas.user_schema import UserResponse
from app.database import get_db
from app.services import auth_service
from app.schemas.user_schema import Token, UserCreate, UserResponse, LoginResponse
from app.utils.security import create_access_token
from app.config import settings
from app.models.user import User, UserRole
from app.utils.permissions import RoleChecker, get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/login", response_model=LoginResponse)
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
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return current_user

@router.post("/register", response_model=UserResponse, dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.AGGREGATOR]))])
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Only Admins and Aggregators can register new users.
    """
    return auth_service.create_user(db, user)
