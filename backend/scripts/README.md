# Prefill User Script

This script allows you to prefill a user account with sample data for testing or demo purposes.

## Usage

### Basic Usage (Default Demo User)

```bash
cd backend
source venv/bin/activate
python scripts/prefill_user.py
```

This will create or use the default demo user (`demo@example.com`) with password `demo123` and prefill it with sample data.

### Custom User

```bash
python scripts/prefill_user.py --email user@example.com --name "Your Name" --password yourpassword
```

### Clear Existing Data

If you want to clear existing data before prefilling:

```bash
python scripts/prefill_user.py --email user@example.com --clear
```

## Sample Data Created

The script creates the following sample data:

- **5 Tasks**: Various study tasks with different priorities and due dates
- **3 Notes**: Math notes, CS notes, and project ideas
- **5 Pomodoro Sessions**: Mix of completed and incomplete sessions
- **3 Classes**: CS 101, MATH 201, and HIST 150 with full syllabus content
- **2 Quizzes**: CS and Math quizzes with multiple choice questions
- **3 Study Schedules**: AI-recommended study times for each class
- **User Settings**: Study preferences, preferred times/days, focus habits, and survey responses

## Command Line Options

- `--email`: User email (default: `demo@example.com`)
- `--name`: User name (default: `Demo User`)
- `--password`: User password (default: `demo123`)
- `--clear`: Clear existing data before prefilling

## Example

```bash
# Create demo user with sample data
python scripts/prefill_user.py

# Create custom user
python scripts/prefill_user.py --email john@example.com --name "John Doe" --password mypass123

# Reset and refill existing user
python scripts/prefill_user.py --email john@example.com --clear
```

