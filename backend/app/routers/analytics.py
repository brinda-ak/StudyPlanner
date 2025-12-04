from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import models, auth
from app.database import get_db
from app.schemas_advanced import AnalyticsResponse
from datetime import datetime, timedelta
from collections import defaultdict

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/", response_model=AnalyticsResponse)
def get_analytics(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get user-specific analytics based on study data and survey responses"""
    # Get completed pomodoros
    pomodoros = db.query(models.Pomodoro).filter(
        models.Pomodoro.user_id == current_user.id,
        models.Pomodoro.completed == True
    ).all()
    
    # Get tasks
    tasks = db.query(models.Task).filter(
        models.Task.user_id == current_user.id
    ).all()
    
    # Get user settings for survey context
    settings = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == current_user.id
    ).first()
    
    # Calculate metrics
    total_focus_minutes = sum(p.duration_minutes for p in pomodoros)
    total_study_hours = total_focus_minutes / 60.0
    
    completed_tasks = [t for t in tasks if t.completed]
    completion_rate = len(completed_tasks) / len(tasks) * 100 if tasks else 0
    
    # Average session length
    avg_session_length = total_focus_minutes / len(pomodoros) if pomodoros else 0
    
    # Most productive days
    day_counts = defaultdict(int)
    for p in pomodoros:
        if p.created_at:
            day = p.created_at.strftime("%A")
            day_counts[day] += p.duration_minutes
    
    most_productive_days = sorted(day_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    most_productive_days = [day for day, _ in most_productive_days]
    
    # Most productive times
    hour_counts = defaultdict(int)
    for p in pomodoros:
        if p.created_at:
            hour = p.created_at.hour
            hour_counts[hour] += p.duration_minutes
    
    most_productive_times = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    most_productive_times = [f"{hour}:00" for hour, _ in most_productive_times]
    
    # Subject breakdown (from tasks)
    subject_breakdown = defaultdict(float)
    for task in completed_tasks:
        if task.category:
            subject_breakdown[task.category] += 1
    
    # Convert to percentages
    total_by_subject = sum(subject_breakdown.values())
    if total_by_subject > 0:
        subject_breakdown = {
            subject: (count / total_by_subject) * 100
            for subject, count in subject_breakdown.items()
        }
    
    # Generate recommendations based on survey and data
    recommendations = []
    
    if settings and settings.survey_responses:
        # Add personalized recommendations based on survey
        recommendations.append("Based on your study preferences, consider scheduling study sessions during your preferred times.")
    
    if completion_rate < 50:
        recommendations.append("Your task completion rate is below 50%. Try breaking tasks into smaller, manageable pieces.")
    
    if avg_session_length < 25:
        recommendations.append("Your average study session is short. Consider using Pomodoro technique for better focus.")
    
    if not most_productive_days:
        recommendations.append("Start tracking your study sessions to identify your most productive days.")
    
    return AnalyticsResponse(
        total_study_hours=round(total_study_hours, 2),
        average_session_length=round(avg_session_length, 2),
        most_productive_days=most_productive_days,
        most_productive_times=most_productive_times,
        subject_breakdown=dict(subject_breakdown),
        completion_rate=round(completion_rate, 2),
        recommendations=recommendations
    )

