# School Management System (FastAPI + Next.js)

A full-stack School Management System built with **FastAPI** (Python) on the backend and **Next.js** (TypeScript) on the frontend, backed by a **SQLite** database (dev) with a planned migration to **MySQL/PostgreSQL** for production.

---

## Project Status

> **Version 3.3 — Active Development**

All critical and high priority security issues raised in the engineering assessment have been resolved. The backend is fully modular with JWT authentication, bcrypt password hashing, Google OAuth, Cloudinary photo upload, strict input validation, auto school ID generation, and role-based data access control across all endpoints.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| FastAPI (Python) | REST API framework |
| SQLAlchemy | ORM for database models |
| Pydantic (with email-validator) | Request/response validation schemas |
| JWT (HMAC-SHA256) | Stateless authentication tokens |
| bcrypt | Industry-standard password hashing |
| Google OAuth 2.0 | Third-party authentication |
| Cloudinary | Cloud image storage and delivery |
| httpx | Async HTTP client for Google API calls |
| python-multipart | File upload support |
| python-dotenv | Environment variable management |
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
│   ├── main.py                       # FastAPI setup + router registration
│   ├── security.py                   # JWT, bcrypt, auth dependencies
│   ├── database.py                   # SQLAlchemy connection and session
│   ├── models.py                     # All SQLAlchemy database models
│   ├── schemas.py                    # Pydantic validation schemas
│   ├── requirements.txt              # Python dependencies
│   ├── school.db                     # SQLite database (auto-generated)
│   └── routers/
│       ├── __init__.py
│       ├── auth.py                   # Email/password register, login, /me
│       ├── google_auth.py            # Google OAuth login and callback
│       ├── upload.py                 # Cloudinary photo upload endpoints
│       ├── students.py               # Student CRUD with role-based filtering
│       ├── teachers.py               # Teacher CRUD with role-based filtering
│       └── other.py                  # Parents, attendance, results, payments, events, stats
├── escape-society-school-management-system-dev/   # Frontend (Next.js)
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/page.tsx        # ✅ Email login + Sign in with Google
│   │   │   ├── callback/page.tsx     # ✅ Handles Google OAuth JWT callback
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

## Security Assessment — All Issues Resolved

| Priority | Issue | Status |
|---|---|---|
| 1 — Critical | Role-based data access control | ✅ Complete |
| 2A — High | Registration input validation | ✅ Complete |
| 2B — High | Auto school ID generation | ✅ Complete |
| 2C — High | Optional user_id in student/teacher registration | ✅ Complete |
| 3A — High | Teachers route role filtering | ✅ Complete |
| 3B — High | Events route school filtering | ✅ Complete |
| 4 — Medium | Cloudinary photo upload | ✅ Complete |
| 5 — Low | Duplicate file cleanup | ✅ Complete |
| 6 — Low | Google OAuth configuration | ✅ Complete |

---

## Authentication & Security

### Login Methods
| Method | How it works |
|---|---|
| Email / Password | Credentials verified against database, bcrypt password check, JWT returned |
| Google OAuth | Redirects to Google, exchanges code for token, auto-creates account on first login, JWT returned |

### JWT Tokens
- Signed using **HMAC-SHA256**
- Expire after **24 hours**
- Payload contains: `user_id`, `role`, `email`, `issued_at`, `expires_at`

### Password Security
- Hashed using **bcrypt** with `rounds=12`
- Unique salt generated per password
- 1000x slower to crack than SHA-256
- Rainbow table proof

### Input Validation
All registration and creation endpoints now enforce:
- `name` — minimum 2 characters, maximum 100
- `email` — validated using `EmailStr` (rejects invalid formats)
- `password` — minimum 8 characters, maximum 100
- `role` — must be one of: `admin`, `teacher`, `parent`, `student`
- `status` fields — validated against allowed values (e.g. `present/absent/late`)
- `score` — must be between 0 and 100
- `amount_due` — must be greater than 0

### Auto School ID Generation
Admin accounts automatically receive a unique school ID on registration:
```
SCH-A1B2C3D4
```
No manual input required. School ID links all data (students, teachers, events) to the correct school.

### Role-Based Data Access
| Role | Students | Teachers | Attendance | Results | Payments | Events |
|---|---|---|---|---|---|---|
| admin | All | All | All | All | All | Own school |
| teacher | Assigned only | Own record | Assigned students | Assigned students | ❌ | Own school |
| parent | Own children | ❌ | Own children | Own children | Own children | Own school |
| student | Own record | ❌ | Own record | Own record | Own record | Own school |

---

## Photo Upload

All photos are stored on **Cloudinary** and the URL is saved in the database.

| Endpoint | Who can upload | Folder |
|---|---|---|
| POST /upload/profile | Any logged in user | esm/profiles |
| POST /upload/student/{id} | Admin only | esm/students |
| POST /upload/teacher/{id} | Admin only | esm/teachers |
| POST /upload/school | Admin only | esm/schools |

---

## Database Models

| Model | Description | Key Fields |
|---|---|---|
| User | All user accounts | id, name, email, password, role, school_id, photo_url |
| Student | Student records | id, student_id, name, grade, photo_url, user_id, parent_user_id, teacher_user_id |
| Teacher | Staff records | id, emp_id, name, department, subjects, photo_url, user_id |
| Parent | Parent/guardian records | id, parent_id, name, relationship, user_id |
| Attendance | Daily attendance | id, student_id, date, status |
| Result | Academic results | id, student_id, subject, score, grade, term |
| Payment | Fee records | id, student_id, amount_due, amount_paid, status |
| Event | School events | id, title, date, location, category, school_id |
| Notification | User notifications | id, user_id, title, message, read |

---

## API Endpoints

### Authentication (Public)
| Method | Endpoint | Description |
|---|---|---|
| POST | /auth/register | Register with email and password |
| POST | /auth/login | Login and receive JWT token |
| GET | /auth/me | Get current user profile |
| GET | /auth/google/login | Redirect to Google login |
| GET | /auth/google/callback | Handle Google OAuth callback |

### Photo Upload (Protected)
| Method | Endpoint | Access |
|---|---|---|
| POST | /upload/profile | Any authenticated user |
| POST | /upload/student/{id} | Admin only |
| POST | /upload/teacher/{id} | Admin only |
| POST | /upload/school | Admin only |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | / | API health check |
| GET | /stats | Live stats filtered by role |

### Students
| Method | Endpoint | Access |
|---|---|---|
| GET | /students | Filtered by role |
| GET | /students/{id} | Filtered by role |
| POST | /students | Admin only |
| PUT | /students/{id} | Admin only |
| DELETE | /students/{id} | Admin only |

### Other Endpoints
| Method | Endpoint | Access |
|---|---|---|
| GET/POST | /teachers | Read: admin/teacher (own), Write: admin |
| GET/POST | /parents | Read: admin/parent (own), Write: admin |
| GET/POST | /attendance | Read: filtered by role, Write: admin/teacher |
| GET/POST | /results | Read: filtered by role, Write: admin/teacher |
| GET/POST | /payments | Read: filtered by role, Write: admin |
| GET/POST/DELETE | /events | Read: own school only, Write: admin |

---

## Environment Configuration

Create a `.env` file in the project root:

```env
DB_HOST=db
DB_DATABASE=school-management-db
DB_USER=your_username
DB_PASSWORD=your_secret_password
MYSQL_PORT=3306
DATABASE_URL=mysql+pymysql://your_username:your_secret_password@db:3306/school-management-db
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/auth/google/callback
FRONTEND_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
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
pip install -r requirements.txt
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
make run        # Rebuild, start, and follow FastAPI logs
```

---

## Implemented Features

### Backend
- [x] Full REST API with 25+ endpoints
- [x] JWT authentication (HMAC-SHA256, 24hr expiry)
- [x] bcrypt password hashing (rounds=12, unique salts)
- [x] Google OAuth 2.0 login
- [x] Cloudinary photo upload (student, teacher, profile, school logo)
- [x] Role-based data access control across all endpoints
- [x] Strict input validation on all registration and creation endpoints
- [x] Auto school ID generation for admin accounts
- [x] Optional user_id linking for student/teacher accounts
- [x] Teachers route filtered by role
- [x] Events route filtered by school
- [x] Duplicate file cleanup
- [x] Modular router structure (routers/ folder)
- [x] Student→Parent, Student→Teacher, Student→User account linking
- [x] photo_url field on User, Student, Teacher models
- [x] SQLAlchemy ORM with 9 database models
- [x] CORS middleware for frontend connectivity
- [x] Auto-generated unique IDs (STU-XXXX, EMP-XXXX, PAR-XXXX, SCH-XXXX)
- [x] SQLite database (auto-created on first run)
- [x] Docker + Docker Compose setup

### Frontend
- [x] Role-based dashboards (Admin, Teacher, Student, Parent)
- [x] Route protection middleware
- [x] Central API client (lib/api.ts)
- [x] Login page with email/password and Google OAuth
- [x] Google OAuth callback page
- [x] School registration page connected to backend
- [x] Admin dashboard connected to live backend stats
- [x] Cookie-based session management
- [x] Dark/light mode support
- [x] Recharts data visualizations

---

## Pending / In Progress

- [ ] Connect teacher, student, parent registration pages to backend
- [ ] Connect students, teachers, attendance, fees, results, events pages to backend
- [ ] Display photo_url images in frontend profile pages
- [ ] JWT token refresh mechanism
- [ ] Replace SQLite with MySQL/PostgreSQL for production
- [ ] Database migrations with Alembic
- [ ] Pagination for list endpoints
- [ ] Real-time messaging with WebSockets
- [ ] Unit tests with pytest

---

## Production Considerations

1. Move `SECRET_KEY` in `security.py` to `.env` file
2. Replace SQLite with MySQL or PostgreSQL
3. Use Alembic for database migrations
4. Add rate limiting to prevent brute force attacks
5. Use multiple Uvicorn workers
6. Set `GOOGLE_REDIRECT_URI` to production domain
7. Set Cloudinary to restrict uploads by signed requests

---

## Contributing

Please create a feature branch and open a Pull Request against `main` for review before merging.

---

## License

This project is for educational and development purposes. License details to be added.
