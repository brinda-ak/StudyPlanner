from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)
    google_id = Column(String, unique=True, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tasks = relationship("Task", back_populates="owner", cascade="all, delete-orphan")
    pomodoros = relationship("Pomodoro", back_populates="owner", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="owner", cascade="all, delete-orphan")
    user_settings = relationship("UserSettings", back_populates="owner", uselist=False, cascade="all, delete-orphan")
    classes = relationship("Class", back_populates="owner", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="owner", cascade="all, delete-orphan")
    study_schedules = relationship("StudySchedule", back_populates="owner", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    priority = Column(String, default="Medium")
    category = Column(String, nullable=True)
    completed = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    order_index = Column(Integer, default=0)

    owner = relationship("User", back_populates="tasks")


class Pomodoro(Base):
    __tablename__ = "pomodoros"

    id = Column(Integer, primary_key=True, index=True)
    completed = Column(Boolean, default=False)
    duration_minutes = Column(Integer, default=25)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="pomodoros")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="notes")


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Study preferences
    preferred_study_times = Column(Text, nullable=True)  # JSON array of times
    preferred_study_days = Column(Text, nullable=True)  # JSON array of days
    focus_habits = Column(Text, nullable=True)  # JSON object with habits
    study_duration_preference = Column(Integer, nullable=True)  # Preferred session length in minutes
    
    # Survey responses
    survey_responses = Column(Text, nullable=True)  # JSON object with survey data
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="user_settings")


class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    subject = Column(String, nullable=True)
    instructor = Column(String, nullable=True)
    syllabus_content = Column(Text, nullable=True)
    schedule = Column(Text, nullable=True)  # JSON object with schedule info
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="classes")
    quizzes = relationship("Quiz", back_populates="class_rel", cascade="all, delete-orphan")
    study_schedules = relationship("StudySchedule", back_populates="class_rel", cascade="all, delete-orphan")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    questions = Column(Text, nullable=False)  # JSON array of questions
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User")
    class_rel = relationship("Class")


class StudySchedule(Base):
    __tablename__ = "study_schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)
    subject = Column(String, nullable=False)
    recommended_time = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, default=60)
    priority = Column(String, default="Medium")
    reasoning = Column(Text, nullable=True)  # AI explanation for recommendation
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User")
    class_rel = relationship("Class")

