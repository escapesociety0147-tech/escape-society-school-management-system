from fastapi import FastAPI


app=FastAPI()



@app.get("/")
def index(school_name:str):
    return {
        "Message":f"{school_name} School Management System API is running..."
    }


