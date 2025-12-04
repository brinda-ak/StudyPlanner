import pytest


def test_create_note(client, auth_headers):
    """Test creating a note with prefilled test user"""
    response = client.post(
        "/notes/",
        json={
            "title": "New Note",
            "content": "This is a test note content"
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "New Note"
    assert data["content"] == "This is a test note content"
    assert "id" in data


def test_get_all_notes(client, auth_headers, test_notes):
    """Test getting all notes for prefilled test user"""
    response = client.get("/notes/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert all(note["user_id"] == test_notes[0].user_id for note in data)


def test_get_note_by_id(client, auth_headers, test_notes):
    """Test getting a specific note"""
    note_id = test_notes[0].id
    response = client.get(f"/notes/{note_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == note_id
    assert data["title"] == "Math Notes"
    assert "Quadratic formula" in data["content"]


def test_update_note(client, auth_headers, test_notes):
    """Test updating a note"""
    note_id = test_notes[0].id
    response = client.put(
        f"/notes/{note_id}",
        json={"title": "Updated Math Notes", "content": "Updated content"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Math Notes"
    assert data["content"] == "Updated content"


def test_delete_note(client, auth_headers, test_notes):
    """Test deleting a note"""
    note_id = test_notes[0].id
    response = client.delete(f"/notes/{note_id}", headers=auth_headers)
    assert response.status_code == 204
    
    # Verify note is deleted
    get_response = client.get(f"/notes/{note_id}", headers=auth_headers)
    assert get_response.status_code == 404

