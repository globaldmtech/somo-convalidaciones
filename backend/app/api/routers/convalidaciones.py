from fastapi import APIRouter, Depends, HTTPException
import sqlite3
from typing import Optional, List
from db import database
from model.validaciones import ConvalidationRequest, ConvalidationResult

router = APIRouter(
    prefix="/convalidaciones",
    tags=["convalidaciones"],
)

@router.get("/grados_existentes")
async def get_grados(db: sqlite3.Connection = Depends(database.get_db)):
    """List all existing degrees."""
    try:
        return database.list_grados(db)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ciclos_existentes")
async def get_ciclos(grado_id: Optional[int] = None, db: sqlite3.Connection = Depends(database.get_db)):
    """List cycles, optionally filtered by degree ID."""
    try:
        return database.list_ciclos(db, grado_id=grado_id)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/modulos_existentes")
async def get_modulos(ciclo_id: Optional[int] = None, db: sqlite3.Connection = Depends(database.get_db)):
    """List modules, optionally filtered by cycle ID."""
    try:
        return database.list_modulos(db, ciclo_id=ciclo_id)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/acreditaciones_externas")
async def get_acreditaciones_externas(db: sqlite3.Connection = Depends(database.get_db)):
    """List all external certifications."""
    try:
        return database.list_acreditaciones_externas(db)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@router.post("/calcular", response_model=List[ConvalidationResult])
async def calcular_convalidaciones(
    request: ConvalidationRequest,
    db: sqlite3.Connection = Depends(database.get_db)
):
    """
    Calculate possible convalidations based on the provided studies and certifications.
    """
    try:
        return database.get_convalidaciones_posibles(
            db, 
            request.modulo_ids, 
            request.acreditacion_ids,
            request.target_ciclo_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
