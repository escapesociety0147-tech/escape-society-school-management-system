## School Management System (FastAPI + Docker)

A backend School Management System built with FastAPI and MySQL, fully containerized using Docker and managed via Docker Compose and Makefile for simplified development and deployment workflows.

### Project Status:
This project is currently in early development.
Only the base application and index endpoint are active.
Core school management features are planned and listed below.

### Tech Stack

1. Backend: FastAPI (Python)

2. Database: MySQL 8.4

3. ORM: SQLAlchemy (planned)

4. Containerization: Docker & Docker Compose

5. Process Management: Uvicorn

6. Automation: Makefile

7. Environment Config: .env file

#### Project Features (Current)

##### Implemented

1. Dockerized FastAPI application

2. MySQL database container with persistent volume

3. Health checks for database readiness

3. Environment-based configuration

4. Makefile commands for container lifecycle

5. Index (/) endpoint for service availability check

### Planned Features (In Progress / Roadmap)

The following features are not yet implemented, but planned for upcoming releases:

#### Student Management

1. Student registration

2. Student profile management

3. Class and grade assignment

#### Teacher Management

1. Teacher profiles

2. Subject assignments

3. Class allocations

#### Attendance Management

1. Student attendance tracking

2. Daily and term-based attendance records

3. Attendance reports

#### Examination & Results

1. Exam creation

2. Student exam results

3. Performance summaries

#### Fees Management

1. Fees structure configuration

2. Payment records

3. Outstanding balance tracking

#### Authentication & Authorization Features 
1. Auth Middleware to protect API endpoints
2. JWT Tokens for stateless authentication
3. OAuth (Google, Facebook, Instagram) for easy third-party registration/login

### Container Architecture

The application runs using two Docker services:

#### Web Service (FastAPI)

1. Runs the FastAPI application

2. Exposed on port 8000

3. Uses bind mount for live code updates (development)

4. Depends on database health check before startup

#### Database Service (MySQL)

1. MySQL 8.4 official image

2. Persistent storage using Docker volumes

3. Health check ensures readiness before app starts


### Project Structure

```bash
.
├── app/
│   ├── main.py
│   └── ...
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── Makefile
├── .env
└── README.md

```
### Environment Configuration
```.env
DB_HOST=db 
DB_DATABASE=school-management-db
DB_USER=your_username
DB_PASSWORD=your_secret_password
MYSQL_PORT=3306
DB_CONNECTION=mysql
DB_DRIVER=pymysql

DATABASE_URL=mysql+pymysql://your_username:your_secret_password@db:3306/school-management-db


```

### Available Endpoints
```
Health / Index Endpoint
GET /

Response:

{
  "message": "School Management System API is running"
}

```

### How to Run (Tester Instructions)
1. **Install Docker (if not already installed):**
   a. Docker Desktop: https://www.docker.com/products/docker-desktop/ (Windows/Mac)
   b. sudo apt install docker.io docker-compose (Linux)
2. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd <repo-folder>
   ```
3. Create a .env file with the details in the Environment configuration above and update DB_USER and DB_PASSWORD    if needed.
4. **Makefile Commands**

  The project includes a Makefile to simplify container management.

  ```Makefile
  make up         # starts containers
  make up-build   # starts containers with rebuild
  make down       # stops containers
  make down-v     # stops containers and removes persisted data
  make logs       # shows the output (stdout and stderr) of a running or stopped container
  make logs-db    # show the output of MYSQL logs
  make logs-db    # show the output of FastAPI logs
  make run        # Quick start and watch logs: rebuild, start, and follow FastAPI logs
  ```
5. Access the API:
   Open your browser or use Postman to test:
   
   http://localhost:8000/

### Development Notes

1. Code changes are reflected instantly using Docker bind mounts

2. Database readiness is handled via Docker health checks

3. The project follows production-ready container patterns, even at early stages

4. Future features will be added incrementally with proper migrations

### Production Considerations

For production deployment:

1. Remove bind mounts

2. Disable auto-reload

3. Use multiple Uvicorn workers

4. Secure environment variables

5. Use migrations (Alembic)

### Project Goals

This project aims to:

1. Demonstrate clean backend architecture

2. Follow real world containerization best practices

3. Provide a scalable foundation for a full school management system

### Contributing

Contributions, suggestions, and improvements are welcome.
This project is under active development.

### License

This project is for educational and development purposes.
License details to be added.

