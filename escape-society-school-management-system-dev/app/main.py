from fastapi import FastAPI
from validation import input_check


app=FastAPI()


@app.get("/")
def index(school_name:str):
    input_check(school_name)
    return {
        "Message":f"{school_name} School Management System API is running..."
    }


