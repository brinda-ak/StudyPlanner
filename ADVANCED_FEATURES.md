# Advanced Features Documentation

## Overview

The Study Planner now includes advanced AI-powered features for personalized study management.

## Features

### 1. Settings & Quick Survey

**Location:** `/settings`

Store and manage your study preferences:

- **Preferred Study Times**: Select multiple time slots when you prefer to study
- **Preferred Study Days**: Choose days of the week for studying
- **Study Duration**: Set your preferred session length (15-120 minutes)
- **Quick Survey**: Answer questions about:
  - Primary study goal
  - Daily study hours
  - Main distractions
  - Preferred study technique
- **Focus Habits**: Describe your study environment and strategies

**API Endpoints:**
- `GET /settings/` - Get user settings
- `PUT /settings/` - Update settings

### 2. Classes Management

**Location:** `/classes`

Import and manage your classes:

- Add classes with name, subject, instructor
- Paste syllabus content for AI analysis
- Store class schedule (JSON format)
- Generate tasks and quizzes from class content

**API Endpoints:**
- `GET /classes/` - Get all classes
- `POST /classes/` - Create class
- `PUT /classes/{id}` - Update class
- `DELETE /classes/{id}` - Delete class

### 3. Quiz Maker

**Location:** `/quizzes`

AI-powered quiz generation:

- **Auto-generate quizzes** from class syllabus
- **Custom quizzes** - Create manual quizzes
- **Take quizzes** with multiple-choice questions
- **View results** with explanations
- Filter quizzes by class

**API Endpoints:**
- `GET /quizzes/` - Get all quizzes (optionally filtered by class)
- `POST /quizzes/generate` - Generate quiz from syllabus
- `POST /quizzes/` - Create manual quiz
- `GET /quizzes/{id}` - Get specific quiz
- `DELETE /quizzes/{id}` - Delete quiz

### 4. Schedule Optimization

**Location:** `/schedule`

AI-analyzed study schedule recommendations:

- Analyzes your classes, study preferences, and existing tasks
- Recommends optimal study times per subject
- Provides reasoning for each recommendation
- Creates schedule based on:
  - Your preferred study times/days
  - Class schedules
  - Existing commitments
  - Study habits from survey

**API Endpoints:**
- `GET /schedule/recommendations` - Generate AI recommendations
- `GET /schedule/` - Get all schedules
- `DELETE /schedule/{id}` - Delete schedule

### 5. Analytics

**Location:** Dashboard (integrated)

User-specific analytics based on study data:

- Total study hours
- Average session length
- Most productive days and times
- Subject breakdown
- Task completion rate
- Personalized recommendations

**API Endpoint:**
- `GET /analytics/` - Get analytics data

## Usage Flow

### Getting Started with Advanced Features

1. **Complete Survey** (`/settings`)
   - Fill out study preferences and survey
   - This helps AI provide better recommendations

2. **Add Classes** (`/classes`)
   - Import your classes
   - Paste syllabus content
   - Add class schedules

3. **Generate Quizzes** (`/quizzes`)
   - Select a class
   - Click "Generate Quiz"
   - AI creates questions from syllabus

4. **Get Schedule Recommendations** (`/schedule`)
   - Click "Generate Recommendations"
   - AI analyzes your data and suggests optimal study times

5. **View Analytics** (Dashboard)
   - See your study statistics
   - Get personalized recommendations

## AI Features

### Quiz Generation

The AI analyzes:
- Class syllabus content
- Your study preferences (from survey)
- Generates relevant multiple-choice questions
- Provides explanations for each answer

### Schedule Optimization

The AI considers:
- Your preferred study times and days
- Class schedules
- Existing tasks and commitments
- Study habits from survey
- Historical study patterns

### Analytics Recommendations

Based on:
- Study session data
- Task completion rates
- Survey responses
- Time patterns

## Database Schema

New tables added:
- `user_settings` - User preferences and survey responses
- `classes` - Class information and syllabus
- `quizzes` - Generated quizzes with questions
- `study_schedules` - AI-recommended study times

## API Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

