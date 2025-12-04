import pytest
from datetime import datetime, timedelta


def test_create_task(client, auth_headers):
    """Test creating a task with prefilled test user"""
    response = client.post(
        "/tasks/",
        json={
            "title": "New Task",
            "description": "Task description",
            "priority": "High",
            "category": "Work",
            "due_date": (datetime.utcnow() + timedelta(days=7)).isoformat()
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "New Task"
    assert data["priority"] == "High"
    assert data["category"] == "Work"
    assert "id" in data


def test_get_all_tasks(client, auth_headers, test_tasks):
    """Test getting all tasks for prefilled test user"""
    response = client.get("/tasks/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    assert all(task["user_id"] == test_tasks[0].user_id for task in data)


def test_get_task_by_id(client, auth_headers, test_tasks):
    """Test getting a specific task"""
    task_id = test_tasks[0].id
    response = client.get(f"/tasks/{task_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task_id
    assert data["title"] == "Complete project"


def test_update_task(client, auth_headers, test_tasks):
    """Test updating a task"""
    task_id = test_tasks[0].id
    response = client.put(
        f"/tasks/{task_id}",
        json={"completed": True, "priority": "Low"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["completed"] == True
    assert data["priority"] == "Low"


def test_delete_task(client, auth_headers, test_tasks):
    """Test deleting a task"""
    task_id = test_tasks[0].id
    response = client.delete(f"/tasks/{task_id}", headers=auth_headers)
    assert response.status_code == 204
    
    # Verify task is deleted
    get_response = client.get(f"/tasks/{task_id}", headers=auth_headers)
    assert get_response.status_code == 404


def test_reorder_tasks(client, auth_headers, test_tasks):
    """Test reordering tasks"""
    task_ids = [task.id for task in test_tasks]
    # Reverse the order
    reversed_ids = list(reversed(task_ids))
    
    response = client.post(
        "/tasks/reorder",
        json=reversed_ids,
        headers=auth_headers
    )
    assert response.status_code == 200
    
    # Verify new order
    get_response = client.get("/tasks/", headers=auth_headers)
    tasks = get_response.json()
    assert tasks[0]["id"] == reversed_ids[0]


def test_get_tasks_unauthorized(client):
    """Test getting tasks without authentication"""
    response = client.get("/tasks/")
    assert response.status_code == 401

