# 🏫 Escape Society School Management System

A full-stack school management platform built with **Next.js** (frontend) and **FastAPI** (backend).

---

## 🚀 Current Version: v3.4

---

## ✅ What's Been Built

### 🔐 Authentication & Security
- JWT access tokens (24hr) with automatic refresh tokens (30 days)
- bcrypt password hashing with unique salts
- Google OAuth login — auto-creates account on first login
- Role-based access control: Admin, Teacher, Parent, Student
- Input validation on all registration fields (Pydantic)
- Auto-generated School IDs for admin registrations (`SCH-XXXXXXXX`)

### 📄 Pages Connected to Backend API
| Page | Status |
|------|--------|
| School Registration | ✅ Connected |
| Admin Login | ✅ Connected |
| Google OAuth Callback | ✅ Connected |
| Teacher Registration | ✅ Connected |
| Student Registration | ✅ Connected |
| Parent Registration | ✅ Connected |
| Students Management | ✅ Connected |
| Teachers Management | ✅ Connected |
| Attendance | ✅ Connected |
| Fee Management | ✅ Connected |
| Exam Results | ✅ Connected |
| Events | ✅ Connected |

### 🖼️ Photo Uploads
- Cloudinary integration for profile photos
- Reusable `Avatar` component with initials fallback and colour coding
- Inline camera button to upload/change photo
- Upload endpoints for students, teachers, profiles and school logo

### 🛠️ Shared Utilities
- `lib/auth.ts` — centralised API fetch with auto JWT refresh, cookie management, logout helper
- `components/ui/Avatar.tsx` — reusable photo component used across StudentTable and TeacherCard

---

## 🗂️ Project Structure

```
escape-society-school-management-system/
├── app/                          # FastAPI backend
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── security.py               # JWT + bcrypt + refresh tokens
│   ├── database.py
│   └── routers/
│       ├── auth.py               # register, login, refresh, /me
│       ├── google_auth.py        # Google OAuth
│       ├── upload.py             # Cloudinary photo upload
│       ├── students.py
│       ├── teachers.py
│       └── other.py              # attendance, results, payments, events, parents
│
└── escape-society-school-management-system-dev/   # Next.js frontend
    ├── app/
    │   ├── auth/login/
    │   ├── auth/register/school|teacher|student|parent/
    │   ├── auth/callback/        # Google OAuth
    │   ├── students/
    │   ├── teachers/
    │   ├── attendance/
    │   ├── fees/
    │   ├── results/
    │   └── events/
    ├── components/
    │   ├── ui/Avatar.tsx         # Reusable photo component
    │   ├── students/StudentTable.tsx
    │   └── teachers/TeacherCard.tsx
    └── lib/
        └── auth.ts               # Shared API fetch + JWT refresh
```

---

## ⚙️ Environment Variables

### Backend (`app/.env`)
```
SECRET_KEY=your-secret-key
REFRESH_SECRET=your-refresh-secret
DATABASE_URL=sqlite:///./school.db

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/auth/google/callback
FRONTEND_URL=http://localhost:3000

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend (`escape-society-school-management-system-dev/.env.local`)
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## 🏃 Running Locally

### Backend
```bash
cd app
pip install -r requirements.txt
uvicorn main:app --reload
```
API docs: `http://127.0.0.1:8000/docs`

### Frontend
```bash
cd escape-society-school-management-system-dev
npm install
npm run dev
```
App: `http://localhost:3000`

---

## 🔑 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login — returns access + refresh token |
| POST | `/auth/refresh` | Exchange refresh token for new access token |
| GET | `/auth/me` | Get current user |
| GET | `/auth/google/login` | Start Google OAuth |
| GET | `/auth/google/callback` | Google OAuth callback |

### Core Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/students` | List / create students |
| GET/PUT/DELETE | `/students/{id}` | Get / update / delete student |
| GET/POST | `/teachers` | List / create teachers |
| GET/PUT/DELETE | `/teachers/{id}` | Get / update / delete teacher |
| GET/POST | `/attendance` | List / mark attendance |
| GET/POST | `/payments` | List / create fee payments |
| PUT/DELETE | `/payments/{id}` | Update / delete payment |
| GET/POST | `/results` | List / create exam results |
| PUT/DELETE | `/results/{id}` | Update / delete result |
| GET/POST | `/events` | List / create events |
| PUT/DELETE | `/events/{id}` | Update / delete event |

### Uploads
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload/profile` | Upload own profile photo |
| POST | `/upload/student/{id}` | Upload student photo (admin) |
| POST | `/upload/teacher/{id}` | Upload teacher photo (admin) |
| POST | `/upload/school` | Upload school logo (admin) |

---

## 🔒 Role-Based Access

| Role | Access |
|------|--------|
| Admin | Full access to everything |
| Teacher | Own profile + assigned students only |
| Parent | Own children's data only |
| Student | Own record only |

---

## 📦 Key Dependencies

### Backend
- FastAPI, Uvicorn, SQLAlchemy
- bcrypt, Cloudinary, python-multipart
- httpx, pydantic[email]

### Frontend
- Next.js 14, React, TypeScript, Tailwind CSS, lucide-react

---

## 🗺️ Roadmap
- [ ] Switch SQLite → PostgreSQL for production
- [ ] JWT token blacklist on logout
- [ ] Email notifications for overdue fees
- [ ] PDF report generation for results and attendance
- [ ] Mobile app (React Native)
