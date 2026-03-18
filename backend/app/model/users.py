from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    nombre: str
    email: EmailStr
    rol: str
    created_at: Optional[str] = None

class User(UserCreate):
    id: int