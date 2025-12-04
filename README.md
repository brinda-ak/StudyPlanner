# Study Planner

A comprehensive, AI-powered study planning and productivity web application designed to help students and learners maximize their study efficiency and achieve their academic goals.

## What is Study Planner?

Study Planner is your all-in-one companion for academic success. Whether you're managing multiple classes, preparing for exams, or trying to build better study habits, Study Planner combines task management, focus tracking, and AI-powered insights to create a personalized study experience tailored to your needs.

With Study Planner, you can:
- **Organize your academic life** - Manage tasks, deadlines, and priorities in one place
- **Stay focused** - Use the Pomodoro timer to maintain concentration and track your productivity
- **Take smart notes** - Keep all your study materials organized and easily accessible
- **Get AI-powered insights** - Receive personalized study recommendations based on your habits and preferences
- **Optimize your schedule** - Let AI analyze your classes and preferences to suggest the best study times
- **Track your progress** - Visualize your productivity with detailed analytics and charts

## Key Features

### Core Features

**Dashboard**
- Real-time overview of your study progress
- Statistics: active/completed tasks, Pomodoro sessions, focus minutes, study streaks
- Recent tasks and notes preview
- AI-generated study insights and motivational tips
- Personalized analytics with actionable recommendations

**Tasks Management**
- Create and organize tasks with priorities (High/Medium/Low)
- Set due dates and categorize by subject
- Drag-and-drop reordering for easy organization
- Mark tasks as complete and track your progress

**Pomodoro Timer**
- Customizable focus sessions (1-60 minutes)
- Automatic break timer with configurable duration
- Long breaks every 4 sessions for optimal productivity
- Background timer that continues even when you switch tabs
- Beautiful circular progress ring visualization
- Complete session history and statistics

**Notes**
- Rich text note-taking
- Organize and search your study materials
- Split-view interface for easy navigation
- Sort by most recently updated

**AI Study Insights**
- Personalized recommendations powered by Google Gemini AI
- Focus area suggestions based on your study patterns
- Daily tips and motivational summaries
- Smart analysis of your productivity data

### Advanced Features

**Settings & Quick Survey**
- Store your study preferences (preferred times, days, focus habits)
- Quick survey to personalize your experience
- User-specific analytics based on your responses

**Classes Management**
- Add and organize all your classes
- Import syllabus content for AI analysis
- Track class schedules and assignments
- Link classes to quizzes and study schedules

**Quiz Maker**
- Automatically generate quizzes from your syllabus using AI
- Customize questions or use AI-generated ones
- Take quizzes to test your knowledge
- Track quiz performance

**Schedule Optimization**
- AI analyzes your classes and study preferences
- Get personalized recommendations for optimal study times
- View your study schedule organized by date
- Create tasks directly from schedule recommendations

**Analytics**
- User-specific insights based on your study data
- Track your productivity trends
- Visual charts showing your progress over time
- Personalized recommendations for improvement

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn

### Quick Setup

**Backend Setup:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file with:
# DATABASE_URL=sqlite:///./studyplanner.db
# SECRET_KEY=your-secret-key
# GEMINI_API_KEY=your-gemini-api-key (optional)
# GOOGLE_CLIENT_ID=your-client-id (optional)
# GOOGLE_CLIENT_SECRET=your-client-secret (optional)

uvicorn app.main:app --reload
```

**Frontend Setup:**
```bash
cd frontend
npm install

# Create .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id (optional)

npm run dev
```

Visit `http://localhost:3000` to start using Study Planner!

## Technology Stack

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL/SQLite, JWT Authentication
- **Frontend**: Next.js 14, React 18, TypeScript, Zustand
- **AI**: Google Gemini AI for personalized insights
- **Styling**: Tailwind CSS with custom color palette
- **Charts**: Recharts for data visualization

## Design

Study Planner features a clean, modern interface with a carefully chosen color palette:
- Background: `#FFFFFF` (White)
- Accent: `#FFF9C4` (Soft Yellow)
- Text: `#333333` (Dark Gray)
- Secondary Text: `#666666` (Medium Gray)

## Authentication

Study Planner supports multiple authentication methods:
- Email and password registration/login
- Google OAuth sign-in (optional)
- Secure JWT token-based authentication

## Need Help?

- Check the API documentation at `http://localhost:8000/docs` when the backend is running
- Review the Features Summary in `FEATURES_SUMMARY.md`
- See Advanced Features documentation in `ADVANCED_FEATURES.md`

## License

MIT
