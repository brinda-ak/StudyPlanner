"""
Script to prefill a user account with sample data for testing/demo purposes.

Usage:
    python scripts/prefill_user.py
    python scripts/prefill_user.py --email user@example.com
    python scripts/prefill_user.py --email user@example.com --clear
"""

import sys
import os
from datetime import datetime, timedelta
import json
import argparse

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal, engine
from app import models
from app.auth import get_password_hash
from sqlalchemy.orm import Session


def create_prefilled_user(db: Session, email: str = "demo@example.com", name: str = "Demo User", password: str = "demo123"):
    """Create or get a user and prefill with sample data"""
    
    # Check if user exists
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        # Create new user
        hashed_password = get_password_hash(password)
        user = models.User(
            email=email,
            name=name,
            hashed_password=hashed_password
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"✓ Created user: {email}")
    else:
        print(f"✓ Using existing user: {email}")
    
    return user


def clear_user_data(db: Session, user: models.User):
    """Clear all existing data for a user"""
    print(f"\n🗑️  Clearing existing data for user: {user.email}")
    
    # Delete in order to respect foreign key constraints
    db.query(models.StudySchedule).filter(models.StudySchedule.user_id == user.id).delete()
    db.query(models.Quiz).filter(models.Quiz.user_id == user.id).delete()
    db.query(models.Class).filter(models.Class.user_id == user.id).delete()
    db.query(models.Note).filter(models.Note.user_id == user.id).delete()
    db.query(models.Pomodoro).filter(models.Pomodoro.user_id == user.id).delete()
    db.query(models.Task).filter(models.Task.user_id == user.id).delete()
    db.query(models.UserSettings).filter(models.UserSettings.user_id == user.id).delete()
    
    db.commit()
    print("✓ Cleared existing data")


def create_sample_tasks(db: Session, user: models.User):
    """Create sample tasks"""
    now = datetime.utcnow()
    tasks = [
        models.Task(
            title="Complete CS 101 Project",
            description="Finish the final project for Introduction to Computer Science. Include documentation and tests.",
            priority="High",
            category="Study",
            completed=False,
            due_date=now + timedelta(days=7),
            user_id=user.id,
            order_index=0
        ),
        models.Task(
            title="Review Math Notes",
            description="Go through calculus lecture notes and solve practice problems",
            priority="Medium",
            category="Study",
            completed=False,
            due_date=now + timedelta(days=3),
            user_id=user.id,
            order_index=1
        ),
        models.Task(
            title="Prepare for History Quiz",
            description="Study chapters 5-7 for the upcoming quiz on Friday",
            priority="Medium",
            category="Study",
            completed=False,
            due_date=now + timedelta(days=2),
            user_id=user.id,
            order_index=2
        ),
        models.Task(
            title="Exercise",
            description="Go for a 30-minute run in the morning",
            priority="Low",
            category="Health",
            completed=True,
            user_id=user.id,
            order_index=3
        ),
        models.Task(
            title="Read Research Paper",
            description="Read and summarize the assigned research paper for Literature class",
            priority="High",
            category="Study",
            completed=False,
            due_date=now + timedelta(days=5),
            user_id=user.id,
            order_index=4
        ),
    ]
    
    for task in tasks:
        db.add(task)
    db.commit()
    print(f"✓ Created {len(tasks)} tasks")


def create_sample_notes(db: Session, user: models.User):
    """Create sample notes"""
    notes = [
        models.Note(
            title="Math Notes - Calculus",
            content="""Key Concepts:

Derivative Rules:
- d/dx(x^n) = nx^(n-1)
- d/dx(sin x) = cos x
- d/dx(cos x) = -sin x
- Product Rule: (fg)' = f'g + fg'
- Quotient Rule: (f/g)' = (f'g - fg')/g²

Integration:
∫ x^n dx = x^(n+1)/(n+1) + C (n ≠ -1)
∫ e^x dx = e^x + C
∫ sin x dx = -cos x + C
""",
            user_id=user.id
        ),
        models.Note(
            title="CS 101 - Data Structures",
            content="""Data Structures Overview:

Arrays: O(1) access, O(n) insert/delete
Linked Lists: O(n) access, O(1) insert/delete
Stacks: LIFO (Last In First Out)
- push(), pop(), peek()
Queues: FIFO (First In First Out)
- enqueue(), dequeue()

Binary Trees:
- In-order: left, root, right
- Pre-order: root, left, right
- Post-order: left, right, root
""",
            user_id=user.id
        ),
        models.Note(
            title="Project Ideas",
            content="""Future Project Ideas:

1. Study Planner App - DONE! ✓
2. Task Manager with AI
3. Note Taking App with Search
4. Flashcard Generator
5. Study Group Scheduler
""",
            user_id=user.id
        ),
    ]
    
    for note in notes:
        db.add(note)
    db.commit()
    print(f"✓ Created {len(notes)} notes")


def create_sample_pomodoros(db: Session, user: models.User):
    """Create sample Pomodoro sessions"""
    now = datetime.utcnow()
    pomodoros = [
        models.Pomodoro(
            completed=True,
            duration_minutes=25,
            user_id=user.id,
            created_at=now - timedelta(days=2, hours=3)
        ),
        models.Pomodoro(
            completed=True,
            duration_minutes=25,
            user_id=user.id,
            created_at=now - timedelta(days=2, hours=2)
        ),
        models.Pomodoro(
            completed=True,
            duration_minutes=30,
            user_id=user.id,
            created_at=now - timedelta(days=1, hours=4)
        ),
        models.Pomodoro(
            completed=True,
            duration_minutes=25,
            user_id=user.id,
            created_at=now - timedelta(days=1, hours=2)
        ),
        models.Pomodoro(
            completed=False,
            duration_minutes=15,
            user_id=user.id,
            created_at=now - timedelta(hours=1)
        ),
    ]
    
    for pomodoro in pomodoros:
        db.add(pomodoro)
    db.commit()
    print(f"✓ Created {len(pomodoros)} Pomodoro sessions")


def create_sample_classes(db: Session, user: models.User):
    """Create sample classes with syllabus content"""
    classes = [
        models.Class(
            name="CS 101 - Introduction to Computer Science",
            syllabus_content="""Course Overview:
Introduction to fundamental computer science concepts including:
- Programming fundamentals (Python)
- Data structures (arrays, lists, stacks, queues)
- Algorithms and complexity analysis
- Object-oriented programming

Assignments:
- Weekly programming assignments
- Midterm project (due week 8)
- Final project (due week 15)

Grading:
- Assignments: 40%
- Midterm: 20%
- Final Project: 30%
- Participation: 10%
""",
            user_id=user.id
        ),
        models.Class(
            name="MATH 201 - Calculus II",
            syllabus_content="""Course Overview:
Continuation of Calculus I, covering:
- Integration techniques
- Applications of integration
- Sequences and series
- Differential equations

Textbook: Stewart's Calculus, 8th Edition

Exams:
- Midterm 1: Week 6
- Midterm 2: Week 11
- Final: Week 16

Grading:
- Homework: 20%
- Midterms: 50% (25% each)
- Final: 30%
""",
            user_id=user.id
        ),
        models.Class(
            name="HIST 150 - World History",
            syllabus_content="""Course Overview:
Survey of world history from ancient civilizations to modern times.

Topics:
- Ancient civilizations
- Medieval period
- Renaissance and Enlightenment
- World Wars
- Modern global developments

Requirements:
- Weekly reading assignments
- 3 quizzes throughout semester
- Research paper (due week 14)
- Final exam

Grading:
- Quizzes: 30%
- Research Paper: 40%
- Final Exam: 30%
""",
            user_id=user.id
        ),
    ]
    
    for class_obj in classes:
        db.add(class_obj)
    db.commit()
    db.refresh(classes[0])  # Refresh to get IDs
    db.refresh(classes[1])
    db.refresh(classes[2])
    print(f"✓ Created {len(classes)} classes")
    
    return classes


def create_sample_settings(db: Session, user: models.User):
    """Create or update sample user settings"""
    # Check if settings already exist
    settings = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == user.id
    ).first()
    
    if settings:
        # Update existing settings
        settings.preferred_study_times = json.dumps(["09:00", "14:00", "19:00"])
        settings.preferred_study_days = json.dumps(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
        settings.focus_habits = json.dumps({
            "pomodoro_length": 25,
            "break_length": 5,
            "preferred_focus_time": "morning",
            "distraction_level": "low"
        })
        settings.study_duration_preference = 90
        settings.survey_responses = json.dumps({
            "study_hours_per_week": 20,
            "preferred_subjects": ["Computer Science", "Mathematics"],
            "study_style": "active_learner",
            "goal": "improve_grades"
        })
        db.commit()
        print("✓ Updated user settings")
    else:
        # Create new settings
        settings = models.UserSettings(
            user_id=user.id,
            preferred_study_times=json.dumps(["09:00", "14:00", "19:00"]),
            preferred_study_days=json.dumps(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
            focus_habits=json.dumps({
                "pomodoro_length": 25,
                "break_length": 5,
                "preferred_focus_time": "morning",
                "distraction_level": "low"
            }),
            study_duration_preference=90,
            survey_responses=json.dumps({
                "study_hours_per_week": 20,
                "preferred_subjects": ["Computer Science", "Mathematics"],
                "study_style": "active_learner",
                "goal": "improve_grades"
            })
        )
        db.add(settings)
        db.commit()
        print("✓ Created user settings")


def create_sample_quizzes(db: Session, user: models.User, classes: list):
    """Create sample quizzes"""
    quizzes = [
        models.Quiz(
            user_id=user.id,
            class_id=classes[0].id if classes else None,
            title="CS 101 - Data Structures Quiz",
            questions=json.dumps([
                {
                    "question": "What is the time complexity of accessing an element in an array?",
                    "options": ["O(1)", "O(n)", "O(log n)", "O(n²)"],
                    "correct_answer": 0
                },
                {
                    "question": "What is the main advantage of a linked list over an array?",
                    "options": ["Faster access", "Dynamic size", "Less memory", "Better sorting"],
                    "correct_answer": 1
                },
                {
                    "question": "What does LIFO stand for in the context of stacks?",
                    "options": ["Last In First Out", "Large Input First Out", "Linear Input First Out", "Last Input Fast Out"],
                    "correct_answer": 0
                }
            ])
        ),
        models.Quiz(
            user_id=user.id,
            class_id=classes[1].id if len(classes) > 1 else None,
            title="Calculus - Integration Quiz",
            questions=json.dumps([
                {
                    "question": "What is ∫ x² dx?",
                    "options": ["x³/3 + C", "x³ + C", "2x + C", "x²/2 + C"],
                    "correct_answer": 0
                },
                {
                    "question": "What is ∫ e^x dx?",
                    "options": ["e^x + C", "x·e^x + C", "e^(x+1)/(x+1) + C", "ln(e^x) + C"],
                    "correct_answer": 0
                }
            ])
        ),
    ]
    
    for quiz in quizzes:
        db.add(quiz)
    db.commit()
    print(f"✓ Created {len(quizzes)} quizzes")


def create_sample_schedules(db: Session, user: models.User, classes: list):
    """Create sample study schedules"""
    now = datetime.utcnow()
    schedules = [
        models.StudySchedule(
            user_id=user.id,
            class_id=classes[0].id if classes else None,
            subject="CS 101 - Introduction to Computer Science",
            recommended_time=now + timedelta(days=1, hours=9),  # Tomorrow at 9 AM
            duration_minutes=90,
            priority="High",
            reasoning="Optimal time based on your morning focus preference. Fresh start to tackle complex programming concepts."
        ),
        models.StudySchedule(
            user_id=user.id,
            class_id=classes[1].id if len(classes) > 1 else None,
            subject="MATH 201 - Calculus II",
            recommended_time=now + timedelta(days=1, hours=14),  # Tomorrow at 2 PM
            duration_minutes=60,
            priority="Medium",
            reasoning="Afternoon slot aligns with your preferred study times. Good for practice problems."
        ),
        models.StudySchedule(
            user_id=user.id,
            class_id=classes[2].id if len(classes) > 2 else None,
            subject="HIST 150 - World History",
            recommended_time=now + timedelta(days=2, hours=19),  # Day after tomorrow at 7 PM
            duration_minutes=45,
            priority="Low",
            reasoning="Evening reading session. Lighter cognitive load, suitable for review."
        ),
    ]
    
    for schedule in schedules:
        db.add(schedule)
    db.commit()
    print(f"✓ Created {len(schedules)} study schedules")


def has_existing_data(db: Session, user: models.User) -> bool:
    """Check if user already has any data"""
    has_tasks = db.query(models.Task).filter(models.Task.user_id == user.id).first() is not None
    has_notes = db.query(models.Note).filter(models.Note.user_id == user.id).first() is not None
    has_classes = db.query(models.Class).filter(models.Class.user_id == user.id).first() is not None
    return has_tasks or has_notes or has_classes


def main():
    parser = argparse.ArgumentParser(description="Prefill a user account with sample data")
    parser.add_argument("--email", default="demo@example.com", help="User email (default: demo@example.com)")
    parser.add_argument("--name", default="Demo User", help="User name (default: Demo User)")
    parser.add_argument("--password", default="demo123", help="User password (default: demo123)")
    parser.add_argument("--clear", action="store_true", help="Clear existing data before prefilling")
    parser.add_argument("--force", action="store_true", help="Skip confirmation prompt when data exists")
    
    args = parser.parse_args()
    
    print(f"\n🚀 Prefilling user account: {args.email}\n")
    
    db = SessionLocal()
    try:
        # Create or get user
        user = create_prefilled_user(db, args.email, args.name, args.password)
        
        # Check for existing data
        if has_existing_data(db, user) and not args.clear and not args.force:
            print("⚠️  User already has existing data.")
            print("   Use --clear to remove existing data and start fresh")
            print("   Use --force to add sample data anyway (may create duplicates)")
            print("\n   Example: python scripts/prefill_user.py --clear")
            db.close()
            return
        
        # Clear existing data if requested
        if args.clear:
            clear_user_data(db, user)
        
        # Create sample data
        create_sample_tasks(db, user)
        create_sample_notes(db, user)
        create_sample_pomodoros(db, user)
        classes = create_sample_classes(db, user)
        create_sample_settings(db, user)
        create_sample_quizzes(db, user, classes)
        create_sample_schedules(db, user, classes)
        
        print(f"\n✅ Successfully prefilled user: {args.email}")
        print(f"\n📊 Summary:")
        print(f"   - Tasks: 5")
        print(f"   - Notes: 3")
        print(f"   - Pomodoro Sessions: 5")
        print(f"   - Classes: 3")
        print(f"   - Quizzes: 2")
        print(f"   - Study Schedules: 3")
        print(f"   - Settings: ✓")
        print(f"\n💡 Login credentials:")
        print(f"   Email: {args.email}")
        print(f"   Password: {args.password}\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()

