from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, auth
from app.database import get_db
from app.schemas_advanced import UserSettingsCreate, UserSettingsUpdate, UserSettingsResponse
import json

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/", response_model=UserSettingsResponse)
def get_settings(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get user settings"""
    settings = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == current_user.id
    ).first()
    
    if not settings:
        # Create default settings if none exist
        settings = models.UserSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    # Parse JSON fields
    if settings.preferred_study_times:
        settings.preferred_study_times = json.loads(settings.preferred_study_times)
    if settings.preferred_study_days:
        settings.preferred_study_days = json.loads(settings.preferred_study_days)
    if settings.focus_habits:
        settings.focus_habits = json.loads(settings.focus_habits)
    if settings.survey_responses:
        settings.survey_responses = json.loads(settings.survey_responses)
    
    return settings


@router.post("/", response_model=UserSettingsResponse, status_code=status.HTTP_201_CREATED)
def create_settings(
    settings: UserSettingsCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update user settings"""
    db_settings = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == current_user.id
    ).first()
    
    if db_settings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Settings already exist. Use PUT to update."
        )
    
    # Convert to JSON strings for storage
    settings_dict = settings.dict(exclude_unset=True)
    if "preferred_study_times" in settings_dict and settings_dict["preferred_study_times"]:
        settings_dict["preferred_study_times"] = json.dumps(settings_dict["preferred_study_times"])
    if "preferred_study_days" in settings_dict and settings_dict["preferred_study_days"]:
        settings_dict["preferred_study_days"] = json.dumps(settings_dict["preferred_study_days"])
    if "focus_habits" in settings_dict and settings_dict["focus_habits"]:
        settings_dict["focus_habits"] = json.dumps(settings_dict["focus_habits"])
    if "survey_responses" in settings_dict and settings_dict["survey_responses"]:
        settings_dict["survey_responses"] = json.dumps(settings_dict["survey_responses"])
    
    db_settings = models.UserSettings(user_id=current_user.id, **settings_dict)
    db.add(db_settings)
    db.commit()
    db.refresh(db_settings)
    
    # Parse back for response
    if db_settings.preferred_study_times:
        db_settings.preferred_study_times = json.loads(db_settings.preferred_study_times)
    if db_settings.preferred_study_days:
        db_settings.preferred_study_days = json.loads(db_settings.preferred_study_days)
    if db_settings.focus_habits:
        db_settings.focus_habits = json.loads(db_settings.focus_habits)
    if db_settings.survey_responses:
        db_settings.survey_responses = json.loads(db_settings.survey_responses)
    
    return db_settings


@router.put("/", response_model=UserSettingsResponse)
def update_settings(
    settings: UserSettingsUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update user settings"""
    db_settings = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == current_user.id
    ).first()
    
    if not db_settings:
        # Create if doesn't exist
        db_settings = models.UserSettings(user_id=current_user.id)
        db.add(db_settings)
        db.commit()
        db.refresh(db_settings)
    
    # Convert to JSON strings for storage
    update_data = settings.dict(exclude_unset=True)
    if "preferred_study_times" in update_data and update_data["preferred_study_times"] is not None:
        update_data["preferred_study_times"] = json.dumps(update_data["preferred_study_times"])
    if "preferred_study_days" in update_data and update_data["preferred_study_days"] is not None:
        update_data["preferred_study_days"] = json.dumps(update_data["preferred_study_days"])
    if "focus_habits" in update_data and update_data["focus_habits"] is not None:
        update_data["focus_habits"] = json.dumps(update_data["focus_habits"])
    if "survey_responses" in update_data and update_data["survey_responses"] is not None:
        update_data["survey_responses"] = json.dumps(update_data["survey_responses"])
    
    for field, value in update_data.items():
        setattr(db_settings, field, value)
    
    db.commit()
    db.refresh(db_settings)
    
    # Parse back for response
    if db_settings.preferred_study_times:
        db_settings.preferred_study_times = json.loads(db_settings.preferred_study_times)
    if db_settings.preferred_study_days:
        db_settings.preferred_study_days = json.loads(db_settings.preferred_study_days)
    if db_settings.focus_habits:
        db_settings.focus_habits = json.loads(db_settings.focus_habits)
    if db_settings.survey_responses:
        db_settings.survey_responses = json.loads(db_settings.survey_responses)
    
    return db_settings

