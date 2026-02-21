# School Management System (FastAPI + Next.js)

A full-stack School Management System built with **FastAPI** (Python) on the backend and **Next.js** (TypeScript) on the frontend, backed by a **SQLite** database (dev) with a planned migration to **MySQL/PostgreSQL** for production.

---

## Project Status

> **Version 3.0 — Active Development**

The backend is now fully modular with JWT authentication protecting all endpoints. Role-based access control is implemented. The frontend login and school registration pages are connected to the backend database. The admin dashboard fetches live stats from the API.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| FastAPI (Python) | REST API framework |
| SQLAlchemy | ORM for database models |
| Pydantic | Request/response validation schemas |
| JWT (HMAC-SHA256) | Stateless authentication tokens |
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
├── app/                              # Backend (FastAPI)
│   ├── main.py                       # FastAPI setup + router registration (40 lines)
│   ├── security.py                   # JWT creation, verification, auth dependencies
│   ├── database.py                   # SQLAlchemy database connection and session
│   ├── models.py                     # All SQLAlchemy database models
│   ├── schemas.py                    # Pydantic validation schemas
│   ├── validation.py                 # Input validation helpers
│   ├── school.db                     # SQLite database (auto-generated)
│   └── routers/
│       ├── __init__.py
│       ├── auth.py                   # Register, login, /me endpoint
│       ├── students.py               # Student CRUD
│       ├── teachers.py               # Teacher CRUD
│       └── other.py                  # Parents, attendance, results, payments, events, stats
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
│   │   └── events/                   # Pending backend connection
│   ├── components/                   # Reusable UI components
│   ├── lib/
│   │   ├── api.ts                    # ✅ Central API client
│   │   └── ...                       # Data helpers and hooks
│   └── middleware.ts                 # Route protection & role redirects
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── Makefile
├── .env
└── README.md
```

---

## Authentication & Security

### JWT Tokens
- All tokens are signed using **HMAC-SHA256**
- Tokens expire after **24 hours**
- Token payload contains: `user_id`, `role`, `email`, `issued_at`, `expires_at`
- Implemented without third-party libraries using Python's built-in `hmac` and `hashlib`

### Role-Based Access Control
| Role | Permissions |
|---|---|
| **admin** | Full access — read, create, update, delete all resources |
| **teacher** | Read access to students, attendance, results |
| **student** | Read access to own records only |
| **parent** | Read access to linked children's records |

### Endpoint Protection
| Endpoint Type | Access |
|---|---|
| `POST /auth/register` | Public |
| `POST /auth/login` | Public |
| `GET` endpoints | Any authenticated user |
| `POST /PUT /DELETE` endpoints | Admin only |

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

### Authentication (Public)
| Method | Endpoint | Description |
|---|---|---|
| POST | /auth/register | Register a new user |
| POST | /auth/login | Login and receive JWT token |
| GET | /auth/me | Get current user profile (protected) |

### Dashboard (Protected)
| Method | Endpoint | Description |
|---|---|---|
| GET | / | API health check |
| GET | /stats | Live stats: students, teachers, attendance, revenue |

### Students (Protected)
| Method | Endpoint | Access |
|---|---|---|
| GET | /students | Any authenticated user |
| GET | /students/{id} | Any authenticated user |
| POST | /students | Admin only |
| PUT | /students/{id} | Admin only |
| DELETE | /students/{id} | Admin only |

### Teachers (Protected)
| Method | Endpoint | Access |
|---|---|---|
| GET | /teachers | Any authenticated user |
| POST | /teachers | Admin only |
| PUT | /teachers/{id} | Admin only |
| DELETE | /teachers/{id} | Admin only |

### Other Endpoints (Protected)
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | /parents | List or add parents |
| GET/POST | /attendance | List or record attendance |
| GET/POST | /results | List or add results |
| GET/POST | /payments | List or add payments |
| GET/POST/DELETE | /events | Manage school events |

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

## How to Test the API

### 1. Register an admin account
```json
POST /auth/register
{
  "name": "Your Name",
  "email": "admin@school.com",
  "password": "yourpassword",
  "role": "admin"
}
```

### 2. Login and copy the token
```json
POST /auth/login
{
  "email": "admin@school.com",
  "password": "yourpassword"
}
```

### 3. Authorize in the docs
Go to **http://127.0.0.1:8000/docs** → click **Authorize 🔒** → paste the token → click **Authorize**

### 4. Test any protected endpoint
All endpoints will now return data instead of `401 Unauthorized`

### Check database contents
```bash
cd app
python -c "from database import SessionLocal; from models import User; db = SessionLocal(); users = db.query(User).all(); [print(f'ID:{u.id} | {u.name} | {u.email} | {u.role}') for u in users]; db.close()"
```

---

## Implemented Features

### Backend
- [x] Full REST API with 25+ endpoints
- [x] JWT authentication (HMAC-SHA256, 24hr expiry)
- [x] Role-based access control (admin, teacher, student, parent)
- [x] All endpoints protected — public access blocked
- [x] Modular router structure (routers/ folder)
- [x] SQLAlchemy ORM with 9 database models
- [x] Pydantic request/response validation
- [x] Password hashing with salt
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

- [ ] Update frontend API client to send JWT token in request headers
- [ ] Connect teacher, student, parent registration pages to backend
- [ ] Connect students, teachers, attendance, fees, results pages to backend
- [ ] JWT token refresh mechanism
- [ ] OAuth (Google, Facebook) login
- [ ] Replace SQLite with MySQL/PostgreSQL for production
- [ ] Database migrations with Alembic
- [ ] Pagination for list endpoints
- [ ] Real-time messaging with WebSockets
- [ ] File upload for documents section
- [ ] Unit tests with pytest

---

## Production Considerations

1. Replace SQLite with MySQL or PostgreSQL
2. Move `SECRET_KEY` in `security.py` to environment variable
3. Remove Docker bind mounts
4. Disable auto-reload
5. Use multiple Uvicorn workers
6. Use Alembic for database migrations
7. Add rate limiting to API endpoints
8. Upgrade password hashing to bcrypt

---

## Contributing

Please create a feature branch and open a Pull Request against `main` for review before merging.

---

## License

This project is for educational and development purposes. License details to be added.