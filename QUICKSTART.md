# Quick Start Guide

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn

## Backend Setup (5 minutes)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```
   ⚠️ **Important:** Make sure you're in the `backend` directory before running the next commands!

2. **Create virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```
   You should see `(venv)` in your terminal prompt after activation.

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   Note: If `pip` doesn't work, try `pip3` instead. Make sure you're in the `backend` directory where `requirements.txt` is located!

4. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your API keys (at minimum, you can start with SQLite and add keys later)

5. **Run the server:**
   ```bash
   uvicorn app.main:app --reload
   ```

Backend will run on `http://localhost:8000`

## Frontend Setup (5 minutes)

1. **Open a new terminal and navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env.local` file:**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and set:
   - `NEXT_PUBLIC_API_URL=http://localhost:8000`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id` (optional for now)

4. **Run the development server:**
   ```bash
   npm run dev
   ```

Frontend will run on `http://localhost:3000`

## First Steps

1. Open `http://localhost:3000` in your browser
2. Register a new account or use Google sign-in
3. Start creating tasks, notes, and Pomodoro sessions
4. View your dashboard for AI insights and statistics

## Optional: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:3000` to authorized redirect URIs
6. Copy Client ID to both `.env` files

## Optional: Configure Gemini AI

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add to backend `.env` as `GEMINI_API_KEY`

The app works without these, but AI insights will use fallback responses.

## Troubleshooting

- **`python: command not found`:** Use `python3` instead of `python` on macOS/Linux
- **Backend won't start:** Check Python version (3.11+), ensure virtual environment is activated
- **Frontend won't start:** Check Node.js version (18+), try deleting `node_modules` and reinstalling
- **CORS errors:** Ensure backend is running on port 8000 and frontend on 3000
- **Database errors:** SQLite database will be created automatically on first run

