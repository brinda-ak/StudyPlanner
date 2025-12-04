from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import models, auth
from app.database import get_db
from app.schemas_advanced import StudyScheduleCreate, StudyScheduleResponse
from app.ai_service import generate_study_schedule
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.get("/recommendations", response_model=List[StudyScheduleResponse])
def get_schedule_recommendations(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI-generated study schedule recommendations"""
    # Get user's classes
    classes = db.query(models.Class).filter(
        models.Class.user_id == current_user.id
    ).all()
    
    if not classes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No classes found. Add classes first to get schedule recommendations."
        )
    
    # Get user settings
    settings = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == current_user.id
    ).first()
    
    # Get existing tasks and pomodoros for context
    tasks = db.query(models.Task).filter(
        models.Task.user_id == current_user.id
    ).all()
    
    pomodoros = db.query(models.Pomodoro).filter(
        models.Pomodoro.user_id == current_user.id
    ).all()
    
    # Generate recommendations
    try:
        recommendations = generate_study_schedule(classes, settings, tasks, pomodoros)
    except Exception as e:
        logger.error(f"Error generating schedule recommendations: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}"
        )
    
    if not recommendations or len(recommendations) == 0:
        logger.warning(f"No recommendations generated for user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No recommendations could be generated. Please ensure you have classes added and try again."
        )
    
    # Save recommendations to database
    saved_recommendations = []
    for rec in recommendations:
        try:
            # Parse datetime - handle different formats
            rec_time = rec.get("recommended_time")
            if not rec_time:
                logger.warning(f"Missing recommended_time in recommendation: {rec}")
                continue
                
            if isinstance(rec_time, str):
                try:
                    if rec_time.endswith("Z"):
                        rec_time = rec_time.replace("Z", "+00:00")
                    dt = datetime.fromisoformat(rec_time.replace("Z", ""))
                except ValueError:
                    try:
                        # Try parsing as timestamp
                        dt = datetime.fromtimestamp(float(rec_time))
                    except:
                        logger.warning(f"Could not parse time {rec_time}, skipping")
                        continue
            else:
                dt = rec_time
            
            schedule = models.StudySchedule(
                user_id=current_user.id,
                class_id=rec.get("class_id"),
                subject=rec.get("subject", "Study Session"),
                recommended_time=dt,
                duration_minutes=rec.get("duration_minutes", 60),
                priority=rec.get("priority", "Medium"),
                reasoning=rec.get("reasoning")
            )
            db.add(schedule)
            saved_recommendations.append(schedule)
        except Exception as e:
            logger.error(f"Error saving recommendation {rec}: {e}", exc_info=True)
            continue
    
    if not saved_recommendations:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save any recommendations. Please check your data and try again."
        )
    
    try:
        db.commit()
        
        for schedule in saved_recommendations:
            db.refresh(schedule)
    except Exception as e:
        logger.error(f"Error committing schedules: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save recommendations to database."
        )
    
    logger.info(f"Successfully saved {len(saved_recommendations)} schedule recommendations for user {current_user.id}")
    return saved_recommendations


@router.get("/", response_model=List[StudyScheduleResponse])
def get_schedules(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all study schedules for the current user"""
    schedules = db.query(models.StudySchedule).filter(
        models.StudySchedule.user_id == current_user.id
    ).order_by(models.StudySchedule.recommended_time).all()
    
    return schedules


@router.post("/", response_model=StudyScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_schedule(
    schedule: StudyScheduleCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a manual study schedule entry"""
    db_schedule = models.StudySchedule(
        user_id=current_user.id,
        **schedule.dict()
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(
    schedule_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a study schedule"""
    schedule = db.query(models.StudySchedule).filter(
        models.StudySchedule.id == schedule_id,
        models.StudySchedule.user_id == current_user.id
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    
    db.delete(schedule)
    db.commit()
    return None

