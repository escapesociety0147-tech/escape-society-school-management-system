from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers.auth import router as auth_router
from routers.students import router as students_router
from routers.teachers import router as teachers_router
from routers.google_auth import router as google_router
from routers.upload import router as upload_router
from routers.other import (
    parents_router,
    attendance_router,
    results_router,
    payments_router,
    events_router,
    stats_router,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Escape Society School Management API",
    version="3.2.0",
    description="Secure, modular REST API with JWT, Google OAuth and Cloudinary photo upload.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(google_router)
app.include_router(upload_router)
app.include_router(students_router)
app.include_router(teachers_router)
app.include_router(parents_router)
app.include_router(attendance_router)
app.include_router(results_router)
app.include_router(payments_router)
app.include_router(events_router)
app.include_router(stats_router)

@app.get("/", tags=["Health"])
def index():
    return {
        "message": "Escape Society School Management API v3.2 is running",
        "docs": "/docs",
        "status": "healthy"
    }
