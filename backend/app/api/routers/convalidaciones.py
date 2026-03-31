import json
import os
import re
import unicodedata
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
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

_default_upload_dir = Path("/app/data/uploads")
FORM_UPLOAD_DIR = Path(os.getenv("FORM_UPLOAD_DIR", str(_default_upload_dir))).resolve()


def _sanitize_file_stem(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    sanitized = re.sub(r"[^A-Za-z0-9._-]+", "_", ascii_only).strip("._-")
    return sanitized or "documento"


def _sanitize_dni(value: str) -> str:
    sanitized = re.sub(r"[^A-Za-z0-9]+", "", (value or "").upper())
    return sanitized or "SIN_DNI"


def _build_storage_name(dni: str, id_formulario: int, descripcion: str, original_filename: str) -> str:
    extension = Path(original_filename or "").suffix
    safe_dni = _sanitize_dni(dni)
    safe_description = _sanitize_file_stem(descripcion)
    return f"{safe_dni}_{id_formulario}_{safe_description}{extension}"


async def _persist_uploaded_files(
    *,
    id_formulario: int,
    dni: str,
    documento_dni: UploadFile | None,
    documento_dni_nombre: str | None,
    documentos_certificado: list[UploadFile],
    documentos_certificado_nombres: list[str],
    documentos_otros: list[UploadFile],
    documentos_otros_nombres: list[str],
) -> list[dict]:
    FORM_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    used_storage_names: set[str] = set()

    def build_target_path(file_name: str) -> Path:
        target = (FORM_UPLOAD_DIR / file_name).resolve()
        if not str(target).startswith(str(FORM_UPLOAD_DIR)):
            raise HTTPException(status_code=400, detail="Ruta de archivo no válida")
        return target

    saved_files: list[dict] = []

    async def save_one(
        upload: UploadFile,
        descripcion: str,
    ) -> None:
        storage_name = _build_storage_name(dni, id_formulario, descripcion, upload.filename or "")
        if storage_name in used_storage_names:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Ya existe un documento con el nombre '{descripcion}'. "
                    "Cámbialo antes de enviar el formulario."
                ),
            )
        target_path = build_target_path(storage_name)
        content = await upload.read()
        target_path.write_bytes(content)
        used_storage_names.add(storage_name)
        saved_files.append(
            {
                "nombre_archivo": storage_name,
                "descripcion": descripcion,
                "ruta_almacenamiento": str(target_path),
            }
        )

    if documento_dni is not None:
        await save_one(documento_dni, documento_dni_nombre or "dni")

    if len(documentos_certificado) != len(documentos_certificado_nombres):
        raise HTTPException(status_code=400, detail="Los nombres de certificados no coinciden con los archivos")
    for upload, descripcion in zip(documentos_certificado, documentos_certificado_nombres):
        await save_one(upload, descripcion or Path(upload.filename or "").stem or "certificado")

    if len(documentos_otros) != len(documentos_otros_nombres):
        raise HTTPException(status_code=400, detail="Los nombres de otros documentos no coinciden con los archivos")
    for upload, descripcion in zip(documentos_otros, documentos_otros_nombres):
        await save_one(upload, descripcion or Path(upload.filename or "").stem or "documento")

    return saved_files


def _parse_formulario_request(payload: str = Form(...)) -> FormularioCompletoRequest:
    try:
        return FormularioCompletoRequest.model_validate_json(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"JSON inválido en el envío: {str(e)}")

@router.get("/grados_existentes")
async def get_grados(db: sqlite3.Connection = Depends(database.get_db)):
    """List all existing degrees."""
    try:
        return database.CatalogQueries.list_grados(db)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ciclos_existentes")
async def get_ciclos(grado_id: Optional[int] = None, db: sqlite3.Connection = Depends(database.get_db)):
    """List cycles, optionally filtered by degree ID."""
    try:
        return database.CatalogQueries.list_ciclos(db, grado_id=grado_id)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/modulos_existentes")
async def get_modulos(ciclo_id: Optional[int] = None, db: sqlite3.Connection = Depends(database.get_db)):
    """List modules, optionally filtered by cycle ID."""
    try:
        return database.CatalogQueries.list_modulos(db, ciclo_id=ciclo_id)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/acreditaciones_externas")
async def get_acreditaciones_externas(db: sqlite3.Connection = Depends(database.get_db)):
    """List all external certifications."""
    try:
        return database.CatalogQueries.list_acreditaciones_externas(db)
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
        return database.ConvalidationQueries.get_convalidaciones_posibles(
            db, 
            request.modulos_aportados,
            request.acreditacion_ids,
            request.ciclos_completos,
            request.target_ciclo_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/insertar_formulario_completo")
async def insertar_formulario_completo(
    request: FormularioCompletoRequest = Depends(_parse_formulario_request),
    documento_dni: UploadFile | None = File(default=None),
    documento_dni_nombre: str | None = Form(default=None),
    documentos_certificado: list[UploadFile] = File(default=[]),
    documentos_certificado_nombres: str = Form(default="[]"),
    documentos_otros: list[UploadFile] = File(default=[]),
    documentos_otros_nombres: str = Form(default="[]"),
    db: sqlite3.Connection = Depends(database.get_db),
):
    """Inserta formulario + módulos aportados + solicitudes en una única transacción.

    Orden de ejecución:
      1. INSERT en formularios  → obtiene id_formulario
      2. INSERT en formulario_modulos_aportados  (uno por cada id en id_modulos_aportados)
      3. INSERT en formulario_solicitudes  (uno por cada item en solicitudes)

    Si cualquier paso falla se hace rollback de toda la operación.
    """
    archivos_guardados: list[dict] = []
    try:
        nombres_certificado = json.loads(documentos_certificado_nombres or "[]")
        nombres_otros = json.loads(documentos_otros_nombres or "[]")

        estado = request.estado if request.estado is not None else 0
        enviado_at = request.enviado_at if request.enviado_at is not None else datetime.now(timezone.utc).isoformat()

        id_alumno = database.UserQueries.get_or_create_usuario_by_dni(
            conn=db,
            dni=request.dni,
            nombre=request.nombre,
            apellidos=request.apellidos,
            email=request.email,
        )
        id_alumno = int(id_alumno)
        # 1. Insertar formulario
        formulario = database.FormularioQueries.insert_formulario(db,
            id_alumno=id_alumno,
            estado=estado,
            enviado_at=enviado_at,
            validado_por=None,
            anotaciones=request.anotaciones,
            validado_at=None,
        )
        id_formulario = formulario["id"]

        # 2. Insertar módulos aportados
        modulos_aportados = database.FormularioQueries.insert_modulo_aportado(
            db,
            id_formulario=id_formulario,
            id_modulos=request.id_modulos_registrados_aportados,
            id_acreditaciones = request.id_acreditaciones_registradas_aportadas,
            descripciones=request.descripcion_no_registrados,
            modulos_detalle=request.modulos_aportados_detalle,
        )
        database.FormularioQueries.insert_ciclo_aportado(
            db,
            id_formulario=id_formulario,
            ciclos_detalle=request.ciclos_aportados_detalle,
        )
        # 3. Insertar solicitudes
        solicitud = database.FormularioQueries.insert_formulario_solicitud(
            db,
            id_formulario=id_formulario,
            solicitudes_no_registradas=request.solicitudes_no_registradas,
            solicitudes_registradas=request.solicitudes_registradas,
        )

        archivos_guardados = await _persist_uploaded_files(
            id_formulario=id_formulario,
            dni=request.dni,
            documento_dni=documento_dni,
            documento_dni_nombre=documento_dni_nombre,
            documentos_certificado=documentos_certificado,
            documentos_certificado_nombres=nombres_certificado,
            documentos_otros=documentos_otros,
            documentos_otros_nombres=nombres_otros,
        )
        if archivos_guardados:
            database.FormularioQueries.insert_formulario_archivos(
                db,
                id_formulario=id_formulario,
                archivos=archivos_guardados,
            )
        db.commit()
        return {"message": "Formulario correctamente enviado"}

    except json.JSONDecodeError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"JSON inválido en metadatos: {str(e)}")
    except HTTPException:
        db.rollback()
        for archivo in archivos_guardados:
            Path(archivo["ruta_almacenamiento"]).unlink(missing_ok=True)
        raise
    except sqlite3.IntegrityError as e:
        db.rollback()
        for archivo in archivos_guardados:
            Path(archivo["ruta_almacenamiento"]).unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=str(e))
    except sqlite3.Error as e:
        db.rollback()
        for archivo in archivos_guardados:
            Path(archivo["ruta_almacenamiento"]).unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        db.rollback()
        for archivo in archivos_guardados:
            Path(archivo["ruta_almacenamiento"]).unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=str(e))
