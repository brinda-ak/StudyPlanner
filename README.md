# Study Planner

A comprehensive study planning and productivity web application with AI-powered insights, task management, Pomodoro timer, and note-taking capabilities.

## Features

### Core Features
- **Dashboard**: Overview with stats, AI insights, analytics, and charts
- **Tasks**: Full CRUD with priority levels, categories, due dates, and drag-and-drop reordering
- **Pomodoro Timer**: Focus sessions with tracking and analytics
- **Notes**: Rich note-taking with search and organization
- **AI Insights**: Gemini AI-powered personalized study recommendations
- **Authentication**: Email/password and Google OAuth sign-in

### Advanced Features
- **Settings & Survey**: Store study preferences, preferred times/days, focus habits
- **Classes Management**: Import classes with syllabus for AI analysis
- **Quiz Maker**: Auto-generate quizzes from syllabus using AI
- **Schedule Optimization**: AI-recommended optimal study times per subject
- **Analytics**: User-specific insights based on study data and survey responses

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy (PostgreSQL or SQLite)
- Pydantic for validation
- JWT authentication
- Google Generative AI (Gemini)

### Frontend
- Next.js 14
- React 18
- TypeScript
- Zustand for state management
- Recharts for data visualization
- Tailwind CSS for styling
- react-beautiful-dnd for drag-and-drop

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory (copy from `.env.example`):
```bash
DATABASE_URL=sqlite:///./studyplanner.db
SECRET_KEY=your-secret-key-here-change-in-production
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GEMINI_API_KEY=your-gemini-api-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

5. Run the backend server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file (copy from `.env.local.example`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /users/register` - Register a new user
- `POST /users/login` - Login with email/password
- `POST /users/google-signin` - Sign in with Google OAuth
- `GET /users/me` - Get current user info

### Tasks
- `GET /tasks/` - Get all tasks
- `POST /tasks/` - Create a task
- `GET /tasks/{id}` - Get a specific task
- `PUT /tasks/{id}` - Update a task
- `DELETE /tasks/{id}` - Delete a task
- `POST /tasks/reorder` - Reorder tasks

### Pomodoro
- `GET /pomodoro/` - Get all Pomodoro sessions
- `POST /pomodoro/` - Create a Pomodoro session
- `GET /pomodoro/{id}` - Get a specific session
- `PUT /pomodoro/{id}` - Update a session
- `DELETE /pomodoro/{id}` - Delete a session

### Notes
- `GET /notes/` - Get all notes
- `POST /notes/` - Create a note
- `GET /notes/{id}` - Get a specific note
- `PUT /notes/{id}` - Update a note
- `DELETE /notes/{id}` - Delete a note

### AI Insights
- `GET /ai/insights` - Get AI-generated study insights

### Settings
- `GET /settings/` - Get user settings
- `POST /settings/` - Create settings
- `PUT /settings/` - Update settings

### Classes
- `GET /classes/` - Get all classes
- `POST /classes/` - Create class
- `GET /classes/{id}` - Get specific class
- `PUT /classes/{id}` - Update class
- `DELETE /classes/{id}` - Delete class

### Quizzes
- `GET /quizzes/` - Get all quizzes
- `POST /quizzes/` - Create quiz
- `POST /quizzes/generate` - Generate quiz from syllabus
- `GET /quizzes/{id}` - Get specific quiz
- `PUT /quizzes/{id}` - Update quiz
- `DELETE /quizzes/{id}` - Delete quiz

### Schedule
- `GET /schedule/recommendations` - Get AI-generated schedule recommendations
- `GET /schedule/` - Get all schedules
- `POST /schedule/` - Create schedule
- `DELETE /schedule/{id}` - Delete schedule

### Analytics
- `GET /analytics/` - Get user-specific analytics

## Color Palette

- Background: `#FFFFFF`
- Accent: `#FFF9C4`
- Text: `#333333`
- Secondary Text: `#666666`

## Database

The application uses SQLite by default (for development). For production, update the `DATABASE_URL` in `.env` to use PostgreSQL:

```
DATABASE_URL=postgresql://user:password@localhost/studyplanner
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Copy the Client ID and Client Secret to your `.env` files

## Gemini AI Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add it to your backend `.env` file as `GEMINI_API_KEY`

## Development

### Backend
- API documentation available at `http://localhost:8000/docs`
- Database migrations are handled automatically on startup

### Frontend
- Hot reload enabled in development mode
- TypeScript for type safety
- Tailwind CSS for styling

## Production Deployment

1. Set up a PostgreSQL database
2. Update environment variables for production
3. Build the frontend: `npm run build`
4. Use a production ASGI server like Gunicorn for the backend
5. Configure CORS for your production domain
6. Set up SSL certificates

## License

MIT

