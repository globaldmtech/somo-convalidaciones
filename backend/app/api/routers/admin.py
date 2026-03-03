from fastapi import APIRouter, Depends, HTTPException
import sqlite3
from pydantic import BaseModel
from db import database

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)

class CambiarEstadoFormularioRequest(BaseModel):
    estado_id: int
    admin_id: int | None = None

class CambiarEstadoSolicitudRequest(BaseModel):
    estado_modulo_id: int
    admin_id: int | None = None

class AdminLoginRequest(BaseModel):
    nombre: str
    password: str

class CrearCicloRequest(BaseModel):
    nombre: str
    id_familia: int
    id_grado: int

class CrearModuloItemRequest(BaseModel):
    id_oficial: str | None = None
    nombre: str

class CrearModulosRequest(BaseModel):
    modulos: list[CrearModuloItemRequest]


@router.post("/login")
async def login_admin(
    request: AdminLoginRequest,
    db: sqlite3.Connection = Depends(database.get_db),
):
    """Valida credenciales de administrador."""
    try:
        admin = database.AdminQueries.authenticate_admin(db, request.nombre, request.password)
        if not admin:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        return {"ok": True, "id": admin["id"], "nombre": admin["nombre"]}
    except HTTPException:
        raise
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/formularios")
async def listar_formularios(db: sqlite3.Connection = Depends(database.get_db)):
    """Lista todos los formularios con datos básicos del alumno y solicitudes."""
    try:
        return database.AdminQueries.list_admin_formularios(db)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/formularios/{id_formulario}/estado")
async def cambiar_estado_formulario(
    id_formulario: int,
    request: CambiarEstadoFormularioRequest,
    db: sqlite3.Connection = Depends(database.get_db),
):
    """Cambia el estado de un formulario a revision/validado/rechazado."""
    try:
        updated = database.AdminQueries.update_formulario_estado(
            db,
            id_formulario=id_formulario,
            estado_id=request.estado_id,
            admin_id=request.admin_id,
        )
        if updated == 0:
            raise HTTPException(status_code=404, detail="Formulario no encontrado")

        db.commit()
        return {"id": id_formulario, "estado_id": request.estado_id}
    except HTTPException:
        raise
    except sqlite3.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/solicitudes/{id_solicitud}/estado")
async def cambiar_estado_solicitud(
    id_solicitud: int,
    request: CambiarEstadoSolicitudRequest,
    db: sqlite3.Connection = Depends(database.get_db),
):
    """Cambia el estado de una solicitud concreta a revision/validado/rechazado."""
    try:
        updated = database.AdminQueries.update_solicitud_estado(
            db,
            id_solicitud=id_solicitud,
            estado_modulo_id=request.estado_modulo_id,
            admin_id=request.admin_id,
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Solicitud no encontrada")

        db.commit()
        return updated
    except HTTPException:
        raise
    except sqlite3.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ciclos-modulos")
async def listar_ciclos_modulos(db: sqlite3.Connection = Depends(database.get_db)):
    """Lista todos los ciclos y sus módulos."""
    try:
        return database.AdminQueries.list_admin_ciclos_modulos(db)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ciclos")
async def crear_ciclo(
    request: CrearCicloRequest,
    db: sqlite3.Connection = Depends(database.get_db),
):
    """Crea un ciclo nuevo en catálogo."""
    try:
        nombre = (request.nombre or "").strip()
        if not nombre:
            raise HTTPException(status_code=400, detail="El nombre del ciclo es obligatorio")
        if request.id_familia <= 0 or request.id_grado <= 0:
            raise HTTPException(status_code=400, detail="Familia y grado son obligatorios")

        database.CatalogQueries.create_ciclo(
            db,
            nombre=nombre,
            id_familia=request.id_familia,
            id_grado=request.id_grado,
        )
        db.commit()
        return {"ok": True}
    except HTTPException:
        raise
    except sqlite3.IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except sqlite3.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/convalidaciones")
async def listar_convalidaciones(db: sqlite3.Connection = Depends(database.get_db)):
    """Lista todas las reglas de convalidación con módulo destino y origen."""
    try:
        return database.AdminQueries.list_admin_convalidaciones(db)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/administradores")
async def listar_administradores(db: sqlite3.Connection = Depends(database.get_db)):
    """Lista administradores registrados (sin exponer contraseña)."""
    try:
        return database.AdminQueries.list_admin_users(db)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/ciclos/{id_ciclo}")
async def eliminar_ciclo(
    id_ciclo: int,
    db: sqlite3.Connection = Depends(database.get_db),
):
    """Elimina un ciclo y sus datos relacionados (con borrado en cascada)."""
    try:
        deleted = database.CatalogQueries.delete_ciclo(db, id_ciclo)
        if deleted == 0:
            raise HTTPException(status_code=404, detail="Ciclo no encontrado")
        db.commit()
        return {"ok": True, "id": id_ciclo}
    except HTTPException:
        raise
    except sqlite3.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/modulos/{id_modulo}")
async def eliminar_modulo(
    id_modulo: int,
    db: sqlite3.Connection = Depends(database.get_db),
):
    """Elimina un módulo y sus datos relacionados (con borrado en cascada)."""
    try:
        deleted = database.CatalogQueries.delete_modulo(db, id_modulo)
        if deleted == 0:
            raise HTTPException(status_code=404, detail="Módulo no encontrado")
        db.commit()
        return {"ok": True, "id": id_modulo}
    except HTTPException:
        raise
    except sqlite3.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ciclos/{id_ciclo}/modulos")
async def crear_modulos(
    id_ciclo: int,
    request: CrearModulosRequest,
    db: sqlite3.Connection = Depends(database.get_db),
):
    """Crea uno o varios módulos en un ciclo existente."""
    try:
        ciclo = db.execute("SELECT id FROM ciclos WHERE id = ?", (id_ciclo,)).fetchone()
        if not ciclo:
            raise HTTPException(status_code=404, detail="Ciclo no encontrado")

        payload = [
            {
                "id_oficial": item.id_oficial,
                "nombre": item.nombre,
            }
            for item in request.modulos
            if (item.nombre or "").strip()
        ]
        if not payload:
            raise HTTPException(status_code=400, detail="Debes enviar al menos un módulo con nombre")

        inserted = database.CatalogQueries.create_modulos(db, id_ciclo=id_ciclo, modulos=payload)
        if inserted == 0:
            raise HTTPException(status_code=400, detail="No se pudo crear ningún módulo")

        db.commit()
        return {"ok": True, "inserted": inserted}
    except HTTPException:
        raise
    except sqlite3.IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except sqlite3.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
