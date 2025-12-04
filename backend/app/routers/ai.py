from fastapi import APIRouter, Depends
from app import models, schemas, auth
from app.database import get_db
from app.ai_service import generate_ai_insights
from sqlalchemy.orm import Session

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/insights", response_model=schemas.AIInsightResponse)
def get_ai_insights(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI-generated study insights for the current user"""
    insights = generate_ai_insights(db, current_user.id)
    return insights

