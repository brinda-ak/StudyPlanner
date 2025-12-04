from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import models, auth
from app.database import get_db
from app.schemas_advanced import ClassCreate, ClassUpdate, ClassResponse
import json

router = APIRouter(prefix="/classes", tags=["classes"])


@router.get("/", response_model=List[ClassResponse])
def get_classes(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all classes for the current user"""
    classes = db.query(models.Class).filter(
        models.Class.user_id == current_user.id
    ).order_by(models.Class.created_at.desc()).all()
    
    # Parse schedule JSON
    for cls in classes:
        if cls.schedule:
            cls.schedule = json.loads(cls.schedule)
    
    return classes


@router.post("/", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    class_data: ClassCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new class"""
    class_dict = class_data.dict(exclude_unset=True)
    if "schedule" in class_dict and class_dict["schedule"]:
        class_dict["schedule"] = json.dumps(class_dict["schedule"])
    
    db_class = models.Class(user_id=current_user.id, **class_dict)
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    
    if db_class.schedule:
        db_class.schedule = json.loads(db_class.schedule)
    
    return db_class


@router.get("/{class_id}", response_model=ClassResponse)
def get_class(
    class_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific class"""
    cls = db.query(models.Class).filter(
        models.Class.id == class_id,
        models.Class.user_id == current_user.id
    ).first()
    
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    
    if cls.schedule:
        cls.schedule = json.loads(cls.schedule)
    
    return cls


@router.put("/{class_id}", response_model=ClassResponse)
def update_class(
    class_id: int,
    class_update: ClassUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update a class"""
    cls = db.query(models.Class).filter(
        models.Class.id == class_id,
        models.Class.user_id == current_user.id
    ).first()
    
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    
    update_data = class_update.dict(exclude_unset=True)
    if "schedule" in update_data and update_data["schedule"] is not None:
        update_data["schedule"] = json.dumps(update_data["schedule"])
    
    for field, value in update_data.items():
        setattr(cls, field, value)
    
    db.commit()
    db.refresh(cls)
    
    if cls.schedule:
        cls.schedule = json.loads(cls.schedule)
    
    return cls


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(
    class_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a class"""
    cls = db.query(models.Class).filter(
        models.Class.id == class_id,
        models.Class.user_id == current_user.id
    ).first()
    
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    
    db.delete(cls)
    db.commit()
    return None

