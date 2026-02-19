from fastapi import HTTPException,status

def input_check(user_input):
    if not user_input or not user_input.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,detail="Input field cannot be empty or contain empty spaces")