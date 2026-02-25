from fastapi import APIRouter, Depends, HTTPException
import sqlite3
from db import database
from model.users import UserCreate, User
from datetime import datetime

router = APIRouter(
    prefix="/alumnos",
    tags=["alumnos"],
)

