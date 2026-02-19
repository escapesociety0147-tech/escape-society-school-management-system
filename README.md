# School Management System (FastAPI + Next.js)

A full-stack School Management System built with **FastAPI** (Python) on the backend and **Next.js** (TypeScript) on the frontend, backed by a **SQLite** database (dev) with a planned migration to **MySQL** for production. The backend is fully containerized using Docker and managed via Docker Compose and Makefile.

---

## Project Status

> **Version 2.1 — Active Development**

The backend REST API is fully implemented with 25+ endpoints. The frontend login and school registration pages are now connected to the backend database. The admin dashboard fetches live stats from the backend. Remaining pages are being migrated from localStorage to real database calls.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| FastAPI (Python) | REST API framework |
| SQLAlchemy | ORM for database models |
| Pydantic | Request/response validation schemas |
| SQLite | Development database (auto-created) |
| MySQL 8.4 | Production database (via Docker) |
| Uvicorn | ASGI server |
| Docker & Docker Compose | Containerization |
| Makefile | Dev workflow automation |

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 16 (TypeScript) | React-based frontend framework |
| Tailwind CSS | Utility-first styling |
| Recharts | Data visualization / charts |
| Lucide React | Icon library |

---

## Project Structure

```bash
.
├── app/                          # Backend (FastAPI)
│   ├── main.py                   # All API routes and app setup
│   ├── models.py                 # SQLAlchemy database models
│   ├── schemas.py                # Pydantic validation schemas
│   ├── database.py               # Database connection and session
│   ├── validation.py             # Input validation helpers
│   └── school.db                 # SQLite database (auto-generated)
├── escape-society-school-management-system-dev/   # Frontend (Next.js)
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/page.tsx        # ✅ Connected to backend API
│   │   │   └── register/
│   │   │       ├── page.tsx          # Role selection page
│   │   │       ├── school/page.tsx   # ✅ Connected to backend API
│   │   │       ├── teacher/page.tsx  # Pending backend connection
│   │   │       ├── student/page.tsx  # Pending backend connection
│   │   │       └── parent/page.tsx   # Pending backend connection
│   │   ├── dashboard/page.tsx        # ✅ Connected to backend API
│   │   ├── students/                 # Pending backend connection
│   │   ├── teachers/                 # Pending backend connection
│   │   ├── attendance/               # Pending backend connection
│   │   ├── results/                  # Pending backend connection
│   │   ├── fees/                     # Pending backend connection
│   │   ├── events/                   # Pending backend connection
│   │   ├── teacher/                  # Teacher portal pages
│   │   ├── student/                  # Student portal pages
│   │   └── parent/                   # Parent portal pages
│   ├── components/               # Reusable UI components
│   ├── lib/
│   │   ├── api.ts                # ✅ Central API client
│   │   └── ...                   # Data helpers and hooks
│   └── middleware.ts             # Route protection & role redirects
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── Makefile
├── .env
└── README.md
```

---

## Database Models

| Model | Description | Key Fields |
|---|---|---|
| User | All user accounts | id, name, email, password, role, school_id |
| Student | Student records | id, student_id, name, email, grade, section, roll_number |
| Teacher | Staff records | id, emp_id, name, email, department, subjects |
| Parent | Parent/guardian records | id, parent_id, name, email, relationship |
| Attendance | Daily attendance | id, student_id, date, status (present/absent/late) |
| Result | Academic results | id, student_id, subject, score, grade, term |
| Payment | Fee records | id, student_id, amount_due, amount_paid, status |
| Event | School events | id, title, date, location, category |
| Notification | User notifications | id, user_id, title, message, read |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /auth/register | Register a new user (any role) |
| POST | /auth/login | Authenticate and receive session token |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | / | API health check |
| GET | /stats | Live stats: students, teachers, attendance rate, revenue |

### Students
| Method | Endpoint | Description |
|---|---|---|
| GET | /students | List all students |
| GET | /students/{id} | Get a single student |
| POST | /students | Register a new student |
| PUT | /students/{id} | Update student info |
| DELETE | /students/{id} | Remove a student |

### Teachers
| Method | Endpoint | Description |
|---|---|---|
| GET | /teachers | List all teachers |
| POST | /teachers | Add a new teacher |
| PUT | /teachers/{id} | Update teacher info |
| DELETE | /teachers/{id} | Remove a teacher |

### Other Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | /parents | List or add parents |
| GET/POST | /attendance | List or record attendance |
| GET/POST | /results | List or add results |
| GET/POST | /payments | List or add payments |
| GET/POST/DELETE | /events | Manage school events |

---

## Role-Based Access

| Role | Dashboard Route | Access |
|---|---|---|
| admin | /dashboard | Full admin access |
| teacher | /teacher/dashboard | Teacher portal only |
| student | /student/dashboard | Student portal only |
| parent | /parent/dashboard | Parent portal only |

---

## Environment Configuration

Create a `.env` file in the project root:

```env
DB_HOST=db
DB_DATABASE=school-management-db
DB_USER=your_username
DB_PASSWORD=your_secret_password
MYSQL_PORT=3306
DB_CONNECTION=mysql
DB_DRIVER=pymysql
DATABASE_URL=mysql+pymysql://your_username:your_secret_password@db:3306/school-management-db
```

Create a `.env.local` file in the frontend folder:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## How to Run (Local Development)

### Backend
```bash
cd app
pip install fastapi uvicorn sqlalchemy pymysql
uvicorn main:app --reload
```
- Backend: **http://127.0.0.1:8000**
- API docs: **http://127.0.0.1:8000/docs**

### Frontend
```bash
cd escape-society-school-management-system-dev
npm install
npm run dev
```
- Frontend: **http://localhost:3000**

---

## How to Run (Docker)

```bash
make up         # Start all containers
make up-build   # Start with rebuild
make down       # Stop containers
make down-v     # Stop and remove persisted data
make logs       # View all logs
make logs-db    # View MySQL logs
make run        # Rebuild, start, and follow FastAPI logs
```

---

## Implemented Features

### Backend
- [x] Full REST API with 25+ endpoints
- [x] SQLAlchemy ORM with 9 database models
- [x] Pydantic request/response validation
- [x] Password hashing (SHA-256)
- [x] CORS middleware for frontend connectivity
- [x] Auto-generated unique IDs (STU-XXXX, EMP-XXXX, PAR-XXXX)
- [x] SQLite database (auto-created on first run)
- [x] Docker + Docker Compose setup
- [x] Makefile workflow automation

### Frontend
- [x] Role-based dashboards (Admin, Teacher, Student, Parent)
- [x] Route protection middleware
- [x] Central API client (lib/api.ts)
- [x] Login page connected to backend database
- [x] School registration page connected to backend database
- [x] Admin dashboard connected to live backend stats
- [x] Cookie-based session management
- [x] Dark/light mode support
- [x] Recharts data visualizations
- [x] Toast notification system

---

## Pending / In Progress

- [ ] Connect teacher, student, parent registration pages to backend
- [ ] Connect students, teachers, attendance, fees, results pages to backend
- [ ] JWT token authentication middleware
- [ ] OAuth (Google, Facebook) login
- [ ] Replace SQLite with MySQL for production
- [ ] Database migrations with Alembic
- [ ] Pagination for list endpoints
- [ ] Real-time messaging with WebSockets
- [ ] File upload for documents section
- [ ] Upgrade password hashing to bcrypt
- [ ] Unit tests with pytest

---

## Checking the Database

### Via API docs
Visit **http://127.0.0.1:8000/docs** and use Try it out on any endpoint.

### Via terminal
```bash
cd app
python -c "from database import SessionLocal; from models import User; db = SessionLocal(); users = db.query(User).all(); [print(f'ID:{u.id} | {u.name} | {u.email} | {u.role}') for u in users]; db.close()"
```

---

## Production Considerations

1. Replace SQLite with MySQL using docker-compose.yml
2. Remove Docker bind mounts
3. Disable auto-reload
4. Use multiple Uvicorn workers
5. Secure all environment variables
6. Use Alembic for database migrations
7. Add rate limiting to API endpoints
8. Upgrade password hashing to bcrypt

---

## Contributing

Please create a feature branch and open a Pull Request against `main` for review before merging.

---

## License

This project is for educational and development purposes. License details to be added.
