from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class UserSettingsBase(BaseModel):
    preferred_study_times: Optional[List[str]] = None
    preferred_study_days: Optional[List[str]] = None
    focus_habits: Optional[Dict[str, Any]] = None
    study_duration_preference: Optional[int] = None
    survey_responses: Optional[Dict[str, Any]] = None


class UserSettingsCreate(UserSettingsBase):
    pass


class UserSettingsUpdate(BaseModel):
    preferred_study_times: Optional[List[str]] = None
    preferred_study_days: Optional[List[str]] = None
    focus_habits: Optional[Dict[str, Any]] = None
    study_duration_preference: Optional[int] = None
    survey_responses: Optional[Dict[str, Any]] = None


class UserSettingsResponse(UserSettingsBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClassBase(BaseModel):
    name: str
    subject: Optional[str] = None
    instructor: Optional[str] = None
    syllabus_content: Optional[str] = None
    schedule: Optional[Dict[str, Any]] = None


class ClassCreate(ClassBase):
    pass


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    instructor: Optional[str] = None
    syllabus_content: Optional[str] = None
    schedule: Optional[Dict[str, Any]] = None


class ClassResponse(ClassBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Question(BaseModel):
    question: str
    options: List[str]
    correct_answer: int
    explanation: Optional[str] = None


class QuizBase(BaseModel):
    title: str
    description: Optional[str] = None
    questions: List[Question]
    class_id: Optional[int] = None


class QuizCreate(QuizBase):
    pass


class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    questions: Optional[List[Question]] = None


class QuizResponse(BaseModel):
    id: int
    user_id: int
    class_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    questions: List[Question]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StudyScheduleBase(BaseModel):
    class_id: Optional[int] = None
    subject: str
    recommended_time: datetime
    duration_minutes: int = 60
    priority: str = "Medium"
    reasoning: Optional[str] = None


class StudyScheduleCreate(StudyScheduleBase):
    pass


class StudyScheduleResponse(StudyScheduleBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AnalyticsResponse(BaseModel):
    total_study_hours: float
    average_session_length: float
    most_productive_days: List[str]
    most_productive_times: List[str]
    subject_breakdown: Dict[str, float]
    completion_rate: float
    recommendations: List[str]

