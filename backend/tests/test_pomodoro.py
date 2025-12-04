import pytest


def test_create_pomodoro(client, auth_headers):
    """Test creating a Pomodoro session with prefilled test user"""
    response = client.post(
        "/pomodoro/",
        json={
            "duration_minutes": 25,
            "completed": False
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["duration_minutes"] == 25
    assert data["completed"] == False
    assert "id" in data


def test_get_all_pomodoros(client, auth_headers, test_pomodoros):
    """Test getting all Pomodoro sessions for prefilled test user"""
    response = client.get("/pomodoro/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    # Check that completed sessions are included
    completed = [p for p in data if p["completed"]]
    assert len(completed) == 2


def test_update_pomodoro(client, auth_headers, test_pomodoros):
    """Test updating a Pomodoro session"""
    pomodoro_id = test_pomodoros[0].id
    response = client.put(
        f"/pomodoro/{pomodoro_id}",
        json={"completed": True},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["completed"] == True


def test_delete_pomodoro(client, auth_headers, test_pomodoros):
    """Test deleting a Pomodoro session"""
    pomodoro_id = test_pomodoros[0].id
    response = client.delete(f"/pomodoro/{pomodoro_id}", headers=auth_headers)
    assert response.status_code == 204
    
    # Verify pomodoro is deleted
    get_response = client.get(f"/pomodoro/{pomodoro_id}", headers=auth_headers)
    assert get_response.status_code == 404

