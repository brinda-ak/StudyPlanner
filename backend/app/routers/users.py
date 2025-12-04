from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas, auth
from app.database import get_db
from datetime import timedelta
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    db_user = auth.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = None
    if user.password:
        hashed_password = auth.get_password_hash(user.password)
    
    db_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        google_id=user.google_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Login with email and password"""
    authenticated_user = auth.authenticate_user(db, user.email, user.password or "")
    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = auth.create_access_token(
        data={"sub": authenticated_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/google-signin", response_model=schemas.Token)
async def google_signin(request: dict, db: Session = Depends(get_db)):
    """Sign in with Google OAuth token"""
    token = request.get("token") or request.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token is required"
        )
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    
    try:
        # Verify Google token
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://www.googleapis.com/oauth2/v1/userinfo?access_token={token}"
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google token"
                )
            
            google_user = response.json()
            google_id = google_user.get("id")
            email = google_user.get("email")
            name = google_user.get("name")
            
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email not provided by Google"
                )
            
            # Check if user exists by Google ID
            db_user = auth.get_user_by_google_id(db, google_id=google_id)
            
            if not db_user:
                # Check if user exists by email
                db_user = auth.get_user_by_email(db, email=email)
                if db_user:
                    # Link Google account to existing user
                    db_user.google_id = google_id
                    db.commit()
                    db.refresh(db_user)
                else:
                    # Create new user
                    db_user = models.User(
                        email=email,
                        name=name,
                        google_id=google_id
                    )
                    db.add(db_user)
                    db.commit()
                    db.refresh(db_user)
            
            access_token_expires = timedelta(minutes=30)
            access_token = auth.create_access_token(
                data={"sub": db_user.email}, expires_delta=access_token_expires
            )
            return {"access_token": access_token, "token_type": "bearer"}
            
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to verify Google token"
        )


@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_info(current_user: models.User = Depends(auth.get_current_user)):
    """Get current user information"""
    return current_user

