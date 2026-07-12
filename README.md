# Escape Society School Management System

A multi-role, multi-tenant school management system. The frontend (Next.js App Router) is fully built with mock/local data; the backend (FastAPI) is being built out to replace that mock layer with a real, persistent, multi-tenant API.

## Project Status

**Frontend:** Fully built UI for admin, teacher, parent, and student portals. Currently backed by browser `localStorage`, not a real API.

**Backend:** Phase 0 (foundation) complete. Phase 1 (core models) in progress:
- Application configuration with fail-fast production validation (`app/core/config.py`)
- SQLAlchemy engine, session, and declarative base (`app/db/`)
- Working Docker Compose stack (FastAPI + MySQL), verified end-to-end from a clean volume
- Alembic initialized and wired to app settings
- `School` model - migrated and tested (4 tests)
- `User` model - migrated and tested (10 tests), with `school_id` FK, email uniqueness, role enum, and soft delete
- Single index endpoint (`GET /`) proving the app runs

Not yet implemented: authentication, sessions, RBAC, and all domain business logic (attendance, fees, etc.). See `PRD.md` for the full specification.

## Tech Stack

**Frontend:** Next.js (App Router), TypeScript, Tailwind CSS

**Backend:**
- FastAPI (Python 3.11+)
- SQLAlchemy 2.x (ORM)
- Alembic (migrations - not yet initialized)
- MySQL 8.4
- Pydantic v2 / pydantic-settings (configuration)
- PyJWT + server-side session table (planned auth architecture - see PRD)
- pwdlib (Argon2 password hashing)
- Docker & Docker Compose

## Branch Strategy

- `main` - stable, always-working state. Reflects completed, verified milestones.
- `dev` - active development branch. All feature work happens on short-lived branches off `dev`, merged back via PR, then periodically merged into `main`.

Feature branches follow `feature/<short-description>` and are deleted after merging.

## Project Structure
.
|-- app/                     # Shared root: Next.js routes AND FastAPI backend
|   |-- main.py                # FastAPI entry point
|   |-- validation.py
|   |-- core/
|   |   -- config.py            # Settings (env-driven, validated) |   |-- db/ |   |   |-- base.py              # SQLAlchemy DeclarativeBase |   |   -- session.py           # Engine, session factory, get_db()
|   |-- api/v1/                  # (empty - routers land here in Phase 1+)
|   |-- models/                   # (empty - SQLAlchemy models land here)
|   |-- schemas/                   # (empty - Pydantic schemas land here)
|   |-- services/, repositories/, dependencies/, middleware/, utils/
|   -- <role>/page.tsx           # Next.js frontend routes (admin/teacher/parent/student) |-- components/               # Next.js React components |-- lib/                      # Frontend data/state (currently localStorage-backed) |-- types/                    # Shared TypeScript types |-- Dockerfile                 # Backend image |-- docker-compose.yml          # web (FastAPI) + database (MySQL) services |-- .dockerignore |-- requirements.txt            # Backend Python dependencies |-- package.json                 # Frontend dependencies |-- Makefile                     # Docker Compose shortcuts (see below) |-- PRD.md                      # Full product/backend specification -- README.md

> Note: `app/` intentionally serves double duty as both the Next.js App Router root and the FastAPI backend package root. This was a deliberate decision to avoid disruptive repo restructuring while the backend is being built.

## Environment Configuration

Copy `.env.example` to `.env` and fill in real values. Key variables:
APP_NAME=Escape Society School Management System
APP_VERSION=1.0.0
APP_ENV=development
DEBUG=true
API_V1_PREFIX=/api/v1
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_urlsafe(64))">
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SESSION_COOKIE_NAME=esm_session
SESSION_COOKIE_SAMESITE=lax
SESSION_COOKIE_PATH=/
SESSION_LIFETIME_MINUTES=10080
DB_HOST=localhost
DB_PORT=3306
DB_NAME=school_management_db
DB_USER=esm_dev
DB_PASSWORD=<your local password>
BACKEND_CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=INFO

`APP_ENV=production` triggers fail-fast validation: the app refuses to start with a missing/placeholder `SECRET_KEY`, `DB_PASSWORD`, or `DEBUG=true`.

## Running Locally with Docker
docker compose up -d

This starts both services: `database` (MySQL, with a healthcheck) and `web` (FastAPI, waits for `database` to be healthy before starting). The `web` service reaches `database` via Docker's internal DNS (`DB_HOST=database`, overridden automatically in `docker-compose.yml` - your local `.env`'s `DB_HOST=localhost` is for running the app directly on your machine, not inside Docker).

Check status:
docker compose ps

View logs:
docker compose logs web --tail 50
docker compose logs database --tail 50

Stop:
docker compose down          # keeps data
docker compose down -v       # also wipes the database volume

## Makefile Shortcuts
make up         # start containers (detached)
make up-build   # rebuild images, then start containers
make down       # stop containers (keeps data)
make down-v     # stop containers and remove the database volume
make logs       # follow logs for all services
make logs-web   # follow FastAPI logs only
make logs-db    # follow MySQL logs only
make run        # rebuild, start, and follow FastAPI logs in one step

> **Note:** These targets currently call `sudo docker-compose ...` (the legacy standalone CLI). This works on Linux with `docker-compose` installed, but will not run as-is on Windows PowerShell (no `sudo`) or on machines that only have the modern `docker compose` plugin (bundled with Docker Desktop) rather than the legacy binary. Until the Makefile is updated, running the equivalent `docker compose ...` commands directly (as shown above) is the more portable option.

## Running the Backend Locally (without Docker)
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\Activate.ps1
pip install -r requirements.txt

Requires a MySQL instance reachable at whatever `DB_HOST`/`DB_PORT` your `.env` specifies (a local install, or a Docker container with its port published to the host).

## Available Endpoints
GET /?school_name=<name>
Returns a running-status message. This is a placeholder from Phase 0; real API routes will live under `/api/v1` once Phase 1 begins.

## Roadmap

- **Phase 1 (in progress):** `schools` model (done), `users` model (done), `user_passwords` table (next), `user_sessions` table, authentication (session-backed JWT in HttpOnly cookies), tenant-isolation dependency pattern, school onboarding endpoint.
- **Phase 2:** Academic core - classes, assignments, gradebook, attendance, results.
- **Phase 3:** Operations core - fees/payments, events, documents, messaging, notifications.
- **Phase 4:** Admin ops - reports, scheduling, support tickets, audit logs.

Full detail in `PRD.md`.

## Contributing

This project follows a strict workflow: one concept per commit, design decisions discussed before implementation, feature branches off `dev`, PR review before merge. See commit history on `dev` for examples of the expected commit granularity.

## License

Educational and development purposes. License details to be added.