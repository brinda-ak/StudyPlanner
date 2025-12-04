import google.generativeai as genai
import os
import logging
from dotenv import load_dotenv
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app import models
from app.schemas_advanced import Question
import json

logger = logging.getLogger(__name__)

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Simple in-memory cache (in production, use Redis or similar)
ai_cache: Dict[str, Dict] = {}


def get_user_study_data(db: Session, user_id: int) -> Dict:
    """Aggregate user's study data for AI insights"""
    tasks = db.query(models.Task).filter(models.Task.user_id == user_id).all()
    pomodoros = db.query(models.Pomodoro).filter(
        models.Pomodoro.user_id == user_id,
        models.Pomodoro.completed == True
    ).all()
    notes = db.query(models.Note).filter(models.Note.user_id == user_id).all()

    completed_tasks = [t for t in tasks if t.completed]
    active_tasks = [t for t in tasks if not t.completed]
    
    recent_pomodoros = [p for p in pomodoros if p.created_at and 
                       (datetime.utcnow() - p.created_at.replace(tzinfo=None)).days <= 7]
    
    total_focus_minutes = sum(p.duration_minutes for p in recent_pomodoros)
    
    return {
        "total_tasks": len(tasks),
        "completed_tasks": len(completed_tasks),
        "active_tasks": len(active_tasks),
        "total_pomodoros": len(pomodoros),
        "recent_pomodoros": len(recent_pomodoros),
        "total_focus_minutes": total_focus_minutes,
        "notes_count": len(notes),
        "high_priority_tasks": len([t for t in active_tasks if t.priority == "High"]),
    }


def generate_ai_insights(db: Session, user_id: int) -> Dict[str, str]:
    """Generate AI insights using Gemini"""
    cache_key = f"{user_id}_{datetime.utcnow().date()}"
    
    # Check cache
    if cache_key in ai_cache:
        cached = ai_cache[cache_key]
        if (datetime.utcnow() - cached["timestamp"]).total_seconds() < 86400:  # 24 hours
            return cached["data"]
    
    study_data = get_user_study_data(db, user_id)
    
    if not GEMINI_API_KEY:
        # Fallback response if API key not configured
        return {
            "summary": "Keep up the great work! Your study journey is progressing well.",
            "focus_area": "Consistency",
            "daily_tip": "Try to maintain a regular study schedule for better results."
        }
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""Based on the following study data, provide personalized insights:
        
        Total Tasks: {study_data['total_tasks']}
        Completed Tasks: {study_data['completed_tasks']}
        Active Tasks: {study_data['active_tasks']}
        High Priority Tasks: {study_data['high_priority_tasks']}
        Total Pomodoro Sessions: {study_data['total_pomodoros']}
        Recent Pomodoros (last 7 days): {study_data['recent_pomodoros']}
        Total Focus Minutes (last 7 days): {study_data['total_focus_minutes']}
        Notes Count: {study_data['notes_count']}
        
        Provide a JSON response with:
        1. "summary": A concise motivational summary (1-2 sentences)
        2. "focus_area": One of: "Consistency", "Time Management", "Balance", or "Motivation"
        3. "daily_tip": Practical advice for effective studying (1 sentence)
        
        Be encouraging and specific. If the user has few tasks, encourage them to add more.
        Format your response as valid JSON only, no markdown."""
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean up response if it has markdown code blocks
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        import json
        insights = json.loads(text)
        
        # Validate and set defaults
        result = {
            "summary": insights.get("summary", "Keep up the great work!"),
            "focus_area": insights.get("focus_area", "Consistency"),
            "daily_tip": insights.get("daily_tip", "Maintain a regular study schedule.")
        }
        
        # Cache the result
        ai_cache[cache_key] = {
            "data": result,
            "timestamp": datetime.utcnow()
        }
        
        return result
        
    except Exception as e:
        # Fallback response on error
        return {
            "summary": "Keep up the great work! Your study journey is progressing well.",
            "focus_area": "Consistency",
            "daily_tip": "Try to maintain a regular study schedule for better results."
        }


def generate_quiz_from_syllabus(
    syllabus_content: str,
    class_name: str,
    num_questions: int = 5,
    survey_responses: Optional[Dict] = None
) -> List[Question]:
    """Generate quiz questions from syllabus content"""
    if not GEMINI_API_KEY:
        # Return sample questions if API key not configured
        return [
            Question(
                question=f"Sample question about {class_name}?",
                options=["Option A", "Option B", "Option C", "Option D"],
                correct_answer=0,
                explanation="This is a sample question."
            )
        ] * num_questions
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        survey_context = ""
        if survey_responses:
            survey_context = f"\n\nUser study preferences: {json.dumps(survey_responses)}"
        
        prompt = f"""Based on the following class syllabus, generate {num_questions} multiple-choice quiz questions.

Class: {class_name}
Syllabus Content:
{syllabus_content}
{survey_context}

For each question, provide:
1. A clear, specific question
2. 4 answer options (A, B, C, D)
3. The correct answer (0-3, where 0=A, 1=B, 2=C, 3=D)
4. A brief explanation

Format your response as valid JSON array:
[
  {{
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Brief explanation"
  }}
]

Generate exactly {num_questions} questions covering key concepts from the syllabus."""
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean up response if it has markdown code blocks
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        questions_data = json.loads(text)
        questions = [Question(**q) for q in questions_data]
        
        return questions[:num_questions]
        
    except Exception as e:
        # Fallback questions
        return [
            Question(
                question=f"Key concept question about {class_name}?",
                options=["Option A", "Option B", "Option C", "Option D"],
                correct_answer=0,
                explanation="Generated question based on syllabus."
            )
        ] * num_questions


def generate_study_schedule(
    classes: List[models.Class],
    user_settings: Optional[models.UserSettings],
    existing_tasks: List[models.Task],
    existing_pomodoros: List[models.Pomodoro]
) -> List[Dict]:
    """Generate optimal study schedule recommendations"""
    
    # Generate fallback recommendations if AI is not available
    def generate_fallback_recommendations():
        recommendations = []
        now = datetime.utcnow()
        
        # Get preferred times from settings if available
        preferred_times = ["09:00", "14:00", "19:00"]  # Default
        if user_settings and user_settings.preferred_study_times:
            try:
                preferred_times = json.loads(user_settings.preferred_study_times)
            except:
                pass
        
        # Get preferred days
        preferred_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        if user_settings and user_settings.preferred_study_days:
            try:
                preferred_days = json.loads(user_settings.preferred_study_days)
            except:
                pass
        
        # Generate recommendations for each class
        for cls in classes:
            class_name = cls.name or cls.subject or "Study Session"
            
            # Create 2-3 recommendations per class
            for i, time_str in enumerate(preferred_times[:2]):  # 2 recommendations per class
                try:
                    hour, minute = map(int, time_str.split(":"))
                    # Schedule for tomorrow + i days
                    recommended_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                    recommended_time = recommended_time + timedelta(days=i+1)
                    
                    recommendations.append({
                        "subject": class_name,
                        "recommended_time": recommended_time.isoformat(),
                        "duration_minutes": 60,
                        "priority": "High" if i == 0 else "Medium",
                        "reasoning": f"Recommended study time based on your preferences. Optimal time for {class_name}."
                    })
                except Exception as e:
                    logger.warning(f"Error creating fallback recommendation: {e}")
                    continue
        
        return recommendations
    
    if not GEMINI_API_KEY:
        logger.info("GEMINI_API_KEY not set, using fallback recommendations")
        return generate_fallback_recommendations()
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        classes_info = []
        for cls in classes:
            schedule_data = None
            if cls.schedule:
                try:
                    schedule_data = json.loads(cls.schedule)
                except:
                    pass
            
            classes_info.append({
                "name": cls.name or "Unnamed Class",
                "subject": cls.subject or cls.name or "General",
                "syllabus_preview": cls.syllabus_content[:200] if cls.syllabus_content else None,
                "schedule": schedule_data
            })
        
        settings_info = {}
        if user_settings:
            if user_settings.preferred_study_times:
                try:
                    settings_info["preferred_times"] = json.loads(user_settings.preferred_study_times)
                except:
                    pass
            if user_settings.preferred_study_days:
                try:
                    settings_info["preferred_days"] = json.loads(user_settings.preferred_study_days)
                except:
                    pass
            if user_settings.focus_habits:
                try:
                    settings_info["focus_habits"] = json.loads(user_settings.focus_habits)
                except:
                    pass
        
        prompt = f"""Analyze the following information and recommend optimal study times for each class.

Classes:
{json.dumps(classes_info, indent=2)}

User Preferences:
{json.dumps(settings_info, indent=2)}

Existing Tasks: {len(existing_tasks)}
Existing Pomodoro Sessions: {len(existing_pomodoros)}

For each class, recommend 2-3 optimal study times. Consider:
1. User's preferred study times and days
2. Class difficulty and workload
3. Spacing between study sessions

Format as JSON array:
[
  {{
    "subject": "Class Name",
    "recommended_time": "2024-01-15T10:00:00",
    "duration_minutes": 60,
    "priority": "High",
    "reasoning": "Explanation"
  }}
]

Important: 
- Use ISO format for recommended_time (YYYY-MM-DDTHH:MM:SS)
- Provide 2-3 recommendations per class
- Return ONLY valid JSON, no markdown or extra text"""
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean up markdown code blocks
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        # Try to extract JSON if there's extra text
        start_idx = text.find('[')
        end_idx = text.rfind(']') + 1
        if start_idx >= 0 and end_idx > start_idx:
            text = text[start_idx:end_idx]
        
        recommendations = json.loads(text)
        
        # Validate recommendations have required fields
        validated = []
        for rec in recommendations:
            if isinstance(rec, dict) and "subject" in rec and "recommended_time" in rec:
                validated.append(rec)
        
        logger.info(f"Generated {len(validated)} schedule recommendations")
        return validated
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response as JSON: {e}")
        logger.debug(f"Response text: {text[:500] if 'text' in locals() else 'N/A'}")
        return generate_fallback_recommendations()
    except Exception as e:
        logger.error(f"Error generating study schedule: {e}", exc_info=True)
        return generate_fallback_recommendations()

