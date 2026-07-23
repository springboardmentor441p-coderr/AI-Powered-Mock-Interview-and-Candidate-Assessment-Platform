from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class RegisterRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
async def register(payload: RegisterRequest) -> dict[str, str]:
    if not payload.email or not payload.password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    return {"message": "User registered successfully", "email": payload.email}


@router.post("/login")
async def login(payload: RegisterRequest) -> dict[str, str]:
    if not payload.email or not payload.password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    return {"message": "Login successful", "email": payload.email}
