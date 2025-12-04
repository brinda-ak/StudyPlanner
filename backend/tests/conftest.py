import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app import models, auth

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create a test client with database override"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(client, db):
    """Create a prefilled test user via API to avoid bcrypt initialization issues"""
    # Register user via API endpoint (this handles password hashing properly)
    response = client.post(
        "/users/register",
        json={
            "email": "testuser@example.com",
            "password": "testpass123",
            "name": "Test User"
        }
    )
    # Get the user from database
    user = db.query(models.User).filter(models.User.email == "testuser@example.com").first()
    return user


@pytest.fixture(scope="function")
def auth_headers(client, test_user):
    """Get authentication headers for test user"""
    # First register/login to get a proper token
    # For testing, we'll create user via register endpoint
    try:
        response = client.post(
            "/users/login",
            json={"email": "testuser@example.com", "password": "testpass123"}
        )
        if response.status_code == 200:
            token = response.json()["access_token"]
            return {"Authorization": f"Bearer {token}"}
    except:
        pass
    
    # Fallback: register the user first
    client.post(
        "/users/register",
        json={"email": "testuser@example.com", "password": "testpass123", "name": "Test User"}
    )
    response = client.post(
        "/users/login",
        json={"email": "testuser@example.com", "password": "testpass123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def test_tasks(db, test_user):
    """Create prefilled test tasks for the test user"""
    tasks = [
        models.Task(
            title="Complete project",
            description="Finish the study planner project",
            priority="High",
            category="Work",
            completed=False,
            user_id=test_user.id,
            order_index=0
        ),
        models.Task(
            title="Review notes",
            description="Go through lecture notes",
            priority="Medium",
            category="Study",
            completed=False,
            user_id=test_user.id,
            order_index=1
        ),
        models.Task(
            title="Exercise",
            description="Go for a run",
            priority="Low",
            category="Health",
            completed=True,
            user_id=test_user.id,
            order_index=2
        ),
    ]
    for task in tasks:
        db.add(task)
    db.commit()
    return tasks


@pytest.fixture(scope="function")
def test_pomodoros(db, test_user):
    """Create prefilled test Pomodoro sessions"""
    from datetime import datetime, timedelta
    pomodoros = [
        models.Pomodoro(
            completed=True,
            duration_minutes=25,
            user_id=test_user.id,
            created_at=datetime.utcnow() - timedelta(days=1)
        ),
        models.Pomodoro(
            completed=True,
            duration_minutes=30,
            user_id=test_user.id,
            created_at=datetime.utcnow() - timedelta(hours=2)
        ),
        models.Pomodoro(
            completed=False,
            duration_minutes=25,
            user_id=test_user.id,
            created_at=datetime.utcnow()
        ),
    ]
    for pomodoro in pomodoros:
        db.add(pomodoro)
    db.commit()
    return pomodoros


@pytest.fixture(scope="function")
def test_notes(db, test_user):
    """Create prefilled test notes"""
    notes = [
        models.Note(
            title="Math Notes",
            content="Quadratic formula: x = (-b ± √(b²-4ac)) / 2a",
            user_id=test_user.id
        ),
        models.Note(
            title="Project Ideas",
            content="1. Study Planner App\n2. Task Manager\n3. Note Taking App",
            user_id=test_user.id
        ),
    ]
    for note in notes:
        db.add(note)
    db.commit()
    return notes

