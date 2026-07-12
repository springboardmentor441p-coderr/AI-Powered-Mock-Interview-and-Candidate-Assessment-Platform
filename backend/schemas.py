from pydantic import BaseModel, EmailStr


# -------------------------
# User Registration Schema
# -------------------------
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


# -------------------------
# User Login Schema
# -------------------------
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# -------------------------
# Resume Response Schema
# -------------------------
class ResumeResponse(BaseModel):
    filename: str
    extracted_text: str