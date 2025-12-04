from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import models, auth
from app.database import get_db
from app.schemas_advanced import QuizCreate, QuizUpdate, QuizResponse
from app.ai_service import generate_quiz_from_syllabus
from app.schemas_advanced import Question
import json

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.get("/", response_model=List[QuizResponse])
def get_quizzes(
    class_id: int = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all quizzes for the current user"""
    query = db.query(models.Quiz).filter(models.Quiz.user_id == current_user.id)
    
    if class_id:
        query = query.filter(models.Quiz.class_id == class_id)
    
    quizzes = query.order_by(models.Quiz.created_at.desc()).all()
    
    # Parse questions JSON
    for quiz in quizzes:
        if quiz.questions:
            quiz.questions = json.loads(quiz.questions)
    
    return quizzes


@router.post("/", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def create_quiz(
    quiz: QuizCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new quiz"""
    quiz_dict = quiz.dict(exclude_unset=True)
    if "questions" in quiz_dict:
        quiz_dict["questions"] = json.dumps([q.dict() for q in quiz_dict["questions"]])
    
    db_quiz = models.Quiz(user_id=current_user.id, **quiz_dict)
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    
    if db_quiz.questions:
        db_quiz.questions = json.loads(db_quiz.questions)
    
    return db_quiz


@router.post("/generate", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def generate_quiz(
    request: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a quiz automatically from class syllabus"""
    class_id = request.get("class_id")
    num_questions = request.get("num_questions", 5)
    cls = db.query(models.Class).filter(
        models.Class.id == class_id,
        models.Class.user_id == current_user.id
    ).first()
    
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    
    # Get user settings for context
    settings = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == current_user.id
    ).first()
    
    survey_data = None
    if settings and settings.survey_responses:
        if isinstance(settings.survey_responses, str):
            survey_data = json.loads(settings.survey_responses)
        else:
            survey_data = settings.survey_responses
    
    # Generate quiz using AI
    questions = generate_quiz_from_syllabus(
        cls.syllabus_content or "",
        cls.name,
        num_questions,
        survey_data
    )
    
    quiz_dict = {
        "title": f"Quiz: {cls.name}",
        "description": f"Auto-generated quiz for {cls.name}",
        "questions": json.dumps([q.dict() for q in questions]),
        "class_id": class_id
    }
    
    db_quiz = models.Quiz(user_id=current_user.id, **quiz_dict)
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    
    db_quiz.questions = json.loads(db_quiz.questions)
    
    return db_quiz


@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(
    quiz_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific quiz"""
    quiz = db.query(models.Quiz).filter(
        models.Quiz.id == quiz_id,
        models.Quiz.user_id == current_user.id
    ).first()
    
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    
    if quiz.questions:
        quiz.questions = json.loads(quiz.questions)
    
    return quiz


@router.put("/{quiz_id}", response_model=QuizResponse)
def update_quiz(
    quiz_id: int,
    quiz_update: QuizUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update a quiz"""
    quiz = db.query(models.Quiz).filter(
        models.Quiz.id == quiz_id,
        models.Quiz.user_id == current_user.id
    ).first()
    
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    
    update_data = quiz_update.dict(exclude_unset=True)
    if "questions" in update_data and update_data["questions"] is not None:
        update_data["questions"] = json.dumps([q.dict() for q in update_data["questions"]])
    
    for field, value in update_data.items():
        setattr(quiz, field, value)
    
    db.commit()
    db.refresh(quiz)
    
    if quiz.questions:
        quiz.questions = json.loads(quiz.questions)
    
    return quiz


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(
    quiz_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a quiz"""
    quiz = db.query(models.Quiz).filter(
        models.Quiz.id == quiz_id,
        models.Quiz.user_id == current_user.id
    ).first()
    
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    
    db.delete(quiz)
    db.commit()
    return None

