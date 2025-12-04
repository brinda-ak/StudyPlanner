from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/pomodoro", tags=["pomodoro"])


@router.get("/", response_model=List[schemas.PomodoroResponse])
def get_pomodoros(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all Pomodoro sessions for the current user"""
    pomodoros = db.query(models.Pomodoro).filter(
        models.Pomodoro.user_id == current_user.id
    ).order_by(models.Pomodoro.created_at.desc()).offset(skip).limit(limit).all()
    return pomodoros


@router.post("/", response_model=schemas.PomodoroResponse, status_code=status.HTTP_201_CREATED)
def create_pomodoro(
    pomodoro: schemas.PomodoroCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new Pomodoro session"""
    db_pomodoro = models.Pomodoro(**pomodoro.dict(), user_id=current_user.id)
    db.add(db_pomodoro)
    db.commit()
    db.refresh(db_pomodoro)
    return db_pomodoro


@router.get("/{pomodoro_id}", response_model=schemas.PomodoroResponse)
def get_pomodoro(
    pomodoro_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific Pomodoro session"""
    pomodoro = db.query(models.Pomodoro).filter(
        models.Pomodoro.id == pomodoro_id,
        models.Pomodoro.user_id == current_user.id
    ).first()
    if not pomodoro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pomodoro not found")
    return pomodoro


@router.put("/{pomodoro_id}", response_model=schemas.PomodoroResponse)
def update_pomodoro(
    pomodoro_id: int,
    pomodoro_update: schemas.PomodoroUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update a Pomodoro session"""
    pomodoro = db.query(models.Pomodoro).filter(
        models.Pomodoro.id == pomodoro_id,
        models.Pomodoro.user_id == current_user.id
    ).first()
    if not pomodoro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pomodoro not found")
    
    update_data = pomodoro_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pomodoro, field, value)
    
    db.commit()
    db.refresh(pomodoro)
    return pomodoro


@router.delete("/{pomodoro_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pomodoro(
    pomodoro_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a Pomodoro session"""
    pomodoro = db.query(models.Pomodoro).filter(
        models.Pomodoro.id == pomodoro_id,
        models.Pomodoro.user_id == current_user.id
    ).first()
    if not pomodoro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pomodoro not found")
    db.delete(pomodoro)
    db.commit()
    return None

