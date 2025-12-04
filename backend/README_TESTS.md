# Test Suite Documentation

## Overview

This test suite includes comprehensive tests for all API endpoints with a **prefilled test user** and sample data.

## Test User Credentials

The test suite automatically creates a prefilled test user with the following credentials:

- **Email**: `testuser@example.com`
- **Password**: `testpassword123`
- **Name**: `Test User`

## Prefilled Test Data

The test fixtures automatically create:

### Tasks (3 tasks)
- "Complete project" (High priority, Work category, Incomplete)
- "Review notes" (Medium priority, Study category, Incomplete)
- "Exercise" (Low priority, Health category, Completed)

### Pomodoro Sessions (3 sessions)
- 2 completed sessions (25 min and 30 min)
- 1 incomplete session (25 min)

### Notes (2 notes)
- "Math Notes" with quadratic formula content
- "Project Ideas" with list of project ideas

## Running Tests

### Install test dependencies

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Run all tests

```bash
pytest
```

### Run specific test file

```bash
pytest tests/test_users.py
pytest tests/test_tasks.py
pytest tests/test_pomodoro.py
pytest tests/test_notes.py
pytest tests/test_ai.py
```

### Run with verbose output

```bash
pytest -v
```

### Run with coverage

```bash
pytest --cov=app --cov-report=html
```

## Test Structure

### Fixtures (conftest.py)

- `db`: Creates a fresh in-memory SQLite database for each test
- `client`: FastAPI test client with database override
- `test_user`: Prefilled test user (testuser@example.com)
- `auth_headers`: Authentication headers for the test user
- `test_tasks`: 3 prefilled tasks
- `test_pomodoros`: 3 prefilled Pomodoro sessions
- `test_notes`: 2 prefilled notes

### Test Files

1. **test_users.py**: User registration, login, authentication
2. **test_tasks.py**: Task CRUD operations, reordering
3. **test_pomodoro.py**: Pomodoro session CRUD operations
4. **test_notes.py**: Note CRUD operations
5. **test_ai.py**: AI insights endpoint

## Example Test Usage

All tests use the prefilled test user automatically. For example:

```python
def test_get_all_tasks(client, auth_headers, test_tasks):
    """Test getting all tasks for prefilled test user"""
    response = client.get("/tasks/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3  # All 3 prefilled tasks
```

The `auth_headers` fixture automatically logs in the test user and provides authentication headers.

## Notes

- Each test runs with a fresh database (isolated)
- Test database is in-memory SQLite (fast, no cleanup needed)
- All tests use the same prefilled test user credentials
- Authentication is handled automatically via fixtures

