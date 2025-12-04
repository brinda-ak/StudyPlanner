import pytest


def test_get_ai_insights(client, auth_headers, test_user, test_tasks, test_pomodoros, test_notes):
    """Test getting AI insights with prefilled test user and data"""
    response = client.get("/ai/insights", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "focus_area" in data
    assert "daily_tip" in data
    assert isinstance(data["summary"], str)
    assert isinstance(data["focus_area"], str)
    assert isinstance(data["daily_tip"], str)
    # Check that focus_area is one of the expected values
    assert data["focus_area"] in ["Consistency", "Time Management", "Balance", "Motivation"]


def test_get_ai_insights_unauthorized(client):
    """Test getting AI insights without authentication"""
    response = client.get("/ai/insights")
    assert response.status_code == 401

