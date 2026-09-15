# Student Management System

A full-stack CRUD web application for managing student records, built as an academic project.

---

## Project Overview

The Student Management System allows users to create, read, update, and delete student records through a clean dashboard interface backed by a Django REST API.

---

## Features

- Add a new student with validation
- View all students in a sortable table
- Search/filter students by name or department
- Edit existing student details
- Delete a student with confirmation dialog
- Success and error toast notifications
- Fully responsive design

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Backend | Python 3.13, Django 5.x, Django REST Framework |
| Database | SQLite (development) |
| API Testing | Postman |
| Version Control | Git + GitHub |

---

## Project Structure

`
student-management-system/
+-- backend/
¦   +-- config/          # Django project settings
¦   +-- students/        # Student app (model, serializer, views, urls)
¦   +-- manage.py
¦   +-- requirements.txt
+-- frontend/
¦   +-- index.html       # Main dashboard
¦   +-- css/style.css
¦   +-- js/app.js
+-- .gitignore
+-- README.md
`

---

## Installation

### Prerequisites
- Python 3.10+
- pip
- Git

### 1. Clone the repository
`ash
git clone https://github.com/your-username/student-management-system.git
cd student-management-system
`

### 2. Set up the backend
`ash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
`

### 3. Configure environment variables
`ash
# Copy the example env file and fill in values
copy .env.example .env   # Windows
cp .env.example .env     # macOS/Linux
`

### 4. Run database migrations
`ash
python manage.py migrate
`

### 5. (Optional) Create a superuser for Django Admin
`ash
python manage.py createsuperuser
`

---

## How to Run the Backend

`ash
cd backend
venv\Scripts\activate    # or: source venv/bin/activate
python manage.py runserver
`
The API will be available at: http://127.0.0.1:8000/

---

## How to Run the Frontend

Open rontend/index.html directly in your browser, **or** use the VS Code Live Server extension for hot reload.

> Make sure the backend is running before opening the frontend.

---

## API Endpoints

Base URL: http://127.0.0.1:8000/api/

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/students/ | Get all students |
| POST | /api/students/ | Create a new student |
| GET | /api/students/{id}/ | Get a single student |
| PUT | /api/students/{id}/ | Full update a student |
| PATCH | /api/students/{id}/ | Partial update a student |
| DELETE | /api/students/{id}/ | Delete a student |

### Sample Request Body (POST / PUT)
`json
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "age": 20,
  "department": "Computer Science"
}
`

### Sample Response
`json
{
  "id": 1,
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "age": 20,
  "department": "Computer Science",
  "created_at": "2026-09-15T10:00:00Z",
  "updated_at": "2026-09-15T10:00:00Z"
}
`

---

## CRUD Explanation

| Operation | HTTP Method | Endpoint |
|-----------|------------|---------|
| **Create** | POST | /api/students/ |
| **Read All** | GET | /api/students/ |
| **Read One** | GET | /api/students/{id}/ |
| **Update** | PUT/PATCH | /api/students/{id}/ |
| **Delete** | DELETE | /api/students/{id}/ |

---

## Testing Instructions

### Using the DRF Browsable API
Visit http://127.0.0.1:8000/api/students/ in a browser while the server is running.

### Using Postman
1. Import the endpoints listed above.
2. Set the request body to aw > JSON.
3. Test each CRUD operation.

### Using the Frontend
Open rontend/index.html and use the dashboard UI to perform all CRUD operations visually.

---

## Security Notes

- SECRET_KEY is loaded from a .env file — never committed to Git.
- db.sqlite3 is excluded from version control via .gitignore.
- Virtual environments and cache files are not tracked.

---

## Author

Built for academic purposes as part of a college web development project.
