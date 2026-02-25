from fastapi import APIRouter, Depends, HTTPException
import sqlite3
from db.database import get_db

router = APIRouter(
    prefix="/validaciones",
    tags=["validaciones"],
)
