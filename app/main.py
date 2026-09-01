from fastapi import FastAPI

from app.api.v1 import router as api_v1_router
from app.validation import input_check

app = FastAPI()

app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/")
def index(school_name: str):
    input_check(school_name)
    return {
        "Message": f"{school_name} School Management System API is running..."
    }
