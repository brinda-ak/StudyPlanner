from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import users, tasks, pomodoro, notes, ai, settings, classes, quizzes, schedule, analytics

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Study Planner API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(pomodoro.router)
app.include_router(notes.router)
app.include_router(ai.router)
app.include_router(settings.router)
app.include_router(classes.router)
app.include_router(quizzes.router)
app.include_router(schedule.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {"message": "Study Planner API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}

