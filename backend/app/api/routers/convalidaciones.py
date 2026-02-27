from fastapi import APIRouter, Depends, HTTPException
import sqlite3
from datetime import datetime, timezone
from typing import Optional, List
from db import database
from model.convalidaciones import (
    ConvalidationRequest,
    ConvalidationResult,
    FormularioCompletoRequest,
)

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


@router.post("/insertar_formulario_completo")
async def insertar_formulario_completo(
    request: FormularioCompletoRequest,
    db: sqlite3.Connection = Depends(database.get_db),
):
    """Inserta formulario + módulos aportados + solicitudes en una única transacción.

    Orden de ejecución:
      1. INSERT en formularios  → obtiene id_formulario
      2. INSERT en formulario_modulos_aportados  (uno por cada id en id_modulos_aportados)
      3. INSERT en formulario_solicitudes  (uno por cada item en solicitudes)

    Si cualquier paso falla se hace rollback de toda la operación.
    """
    try:
        estado = request.estado if request.estado is not None else 1
        enviado_at = request.enviado_at if request.enviado_at is not None else datetime.now(timezone.utc).isoformat()

        id_alumno = database.get_or_create_usuario_by_dni(
            conn=db,
            dni=request.dni,
            nombre=request.nombre,
            apellidos=request.apellidos,
            email=request.email,
        )
        id_alumno = int(id_alumno)
        # 1. Insertar formulario
        formulario = database.insert_formulario(db,
            id_alumno=id_alumno,
            estado=estado,
            enviado_at=enviado_at,
            validado_por=None,
            anotaciones=request.anotaciones,
            validado_at=None,
        )
        id_formulario = formulario["id"]

        # 2. Insertar módulos aportados
        modulos_aportados = database.insert_modulo_aportado(
            db,
            id_formulario=id_formulario,
            id_modulos=request.id_modulos_registrados_aportados,
            id_acreditaciones = request.id_acreditaciones_registradas_aportadas,
            descripciones=request.descripcion_no_registrados
        )
        # 3. Insertar solicitudes
        solicitud = database.insert_formulario_solicitud(
            db,
            id_formulario=id_formulario,
            solicitudes_no_registradas=request.solicitudes_no_registradas,
            solicitudes_registradas=request.solicitudes_registradas,
        )
        db.commit()
        return {"message": "Formulario correctamente enviado"}

    except sqlite3.IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except sqlite3.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
