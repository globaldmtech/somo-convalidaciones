import base64
import hashlib
import hmac
import json
import os
import time
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.routing import APIRoute
import sqlite3
from pydantic import BaseModel
from db import database

ADMIN_TOKEN_TTL_SECONDS = int(os.getenv("ADMIN_TOKEN_TTL_SECONDS", "43200"))
ADMIN_AUTH_SECRET = os.getenv("ADMIN_AUTH_SECRET", "somo-admin-secret")

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

class CrearConvalidacionRequest(BaseModel):
    id_modulo_destino: int
    id_modulos_origen: list[int]
    source_link: str | None = None
    source_page: int | None = None


def _create_admin_token(admin_id: int, nombre: str) -> str:
    payload = {
        "id": int(admin_id),
        "nombre": nombre,
        "exp": int(time.time()) + ADMIN_TOKEN_TTL_SECONDS,
    }
    payload_json = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload_json).decode("ascii").rstrip("=")
    signature = hmac.new(
        ADMIN_AUTH_SECRET.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{payload_b64}.{signature}"


def _decode_admin_token(token: str) -> dict | None:
    try:
        payload_b64, signature = token.split(".", 1)
    except ValueError:
        return None

    expected = hmac.new(
        ADMIN_AUTH_SECRET.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return None

    padding = "=" * ((4 - len(payload_b64) % 4) % 4)
    try:
        payload_json = base64.urlsafe_b64decode((payload_b64 + padding).encode("ascii"))
        payload = json.loads(payload_json.decode("utf-8"))
    except Exception:
        return None

    exp = int(payload.get("exp", 0))
    if exp <= int(time.time()):
        return None
    if not payload.get("id") or not payload.get("nombre"):
        return None
    return payload


def validate_admin_token(token: str, db: sqlite3.Connection) -> dict | None:
    if not token:
        return None
    payload = _decode_admin_token(token)
    if not payload:
        return None

    admin = db.execute(
        """
        SELECT id, nombre
        FROM administradores
        WHERE id = ? AND nombre = ?
        """,
        (int(payload["id"]), str(payload["nombre"])),
    ).fetchone()
    if not admin:
        return None
    return {"id": int(admin["id"]), "nombre": str(admin["nombre"])}


class AdminAuthRoute(APIRoute):
    def get_route_handler(self):
        original_route_handler = super().get_route_handler()

        async def custom_route_handler(request: Request):
            if request.url.path.rstrip("/") != "/admin/login":
                authorization = request.headers.get("Authorization") or ""
                scheme, _, token = authorization.partition(" ")
                if scheme.lower() != "bearer" or not token:
                    raise HTTPException(status_code=401, detail="Falta cabecera Authorization válida")

                conn = database.connect()
                try:
                    admin_user = validate_admin_token(token, conn)
                finally:
                    conn.close()

                if not admin_user:
                    raise HTTPException(status_code=401, detail="Token de administrador inválido o caducado")
                request.state.admin = admin_user

            return await original_route_handler(request)

        return custom_route_handler


router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    route_class=AdminAuthRoute,
)


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
        token = _create_admin_token(admin["id"], admin["nombre"])
        return {"ok": True, "id": admin["id"], "nombre": admin["nombre"], "token": token}
    except HTTPException:
        raise
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/formularios")
async def listar_formularios(
    db: sqlite3.Connection = Depends(database.get_db),
):
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
async def listar_ciclos_modulos(
    db: sqlite3.Connection = Depends(database.get_db),
):
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
async def listar_convalidaciones(
    grado_id: int | None = None,
    ciclo_id: int | None = None,
    db: sqlite3.Connection = Depends(database.get_db),
):
    """Lista todas las reglas de convalidación con módulo destino y origen."""
    try:
        return database.AdminQueries.list_admin_convalidaciones(
            db,
            grado_id=grado_id,
            ciclo_id=ciclo_id,
        )
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/administradores")
async def listar_administradores(
    db: sqlite3.Connection = Depends(database.get_db),
):
    """Lista administradores registrados (sin exponer contraseña)."""
    try:
        return database.AdminQueries.list_admin_users(db)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/crear_convalidaciones")
async def crear_convalidacion(
    request: CrearConvalidacionRequest,
    db: sqlite3.Connection = Depends(database.get_db),
):
    """Crea una regla de convalidación y sus módulos de origen."""
    try:
        id_modulo_destino = int(request.id_modulo_destino)
        origenes = request.id_modulos_origen

        source_link = (request.source_link or "").strip() or None
        source_page = int(request.source_page) if request.source_page is not None else None

        cursor = db.execute(
            """
            INSERT INTO convalidacion (source_link, source_page, id_modulo_destino)
            VALUES (?, ?, ?)
            """,
            (source_link, source_page, id_modulo_destino),
        )
        id_convalidacion = int(cursor.lastrowid)

        db.executemany(
            """
            INSERT INTO convalidacion_origen (conv_id, id_modulo)
            VALUES (?, ?)
            """,
            [(id_convalidacion, id_modulo_origen) for id_modulo_origen in origenes],
        )

        db.commit()
        return {
            "ok": True,
            "id": id_convalidacion,
            "id_modulo_destino": id_modulo_destino,
            "id_modulos_origen": origenes,
        }
    except HTTPException:
        raise
    except ValueError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Formato inválido en los IDs enviados")
    except sqlite3.IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except sqlite3.Error as e:
        db.rollback()
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


@router.delete("/convalidaciones/{id_convalidacion}")
async def eliminar_convalidacion(
    id_convalidacion: int,
    db: sqlite3.Connection = Depends(database.get_db),
):
    """Elimina una regla de convalidación por ID (y sus orígenes en cascada)."""
    try:
        deleted = database.AdminQueries.delete_convalidacion_rule(db, id_convalidacion)
        if deleted == 0:
            raise HTTPException(status_code=404, detail="Regla de convalidación no encontrada")
        db.commit()
        return {"ok": True, "id": id_convalidacion}
    except HTTPException:
        raise
    except sqlite3.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/convalidaciones/{id_convalidacion}/origenes/{id_modulo_origen}")
async def eliminar_convalidacion_origen(
    id_convalidacion: int,
    id_modulo_origen: int,
    db: sqlite3.Connection = Depends(database.get_db),
):
    """Elimina un módulo origen concreto de una regla de convalidación."""
    try:
        deleted = database.AdminQueries.delete_convalidacion_origen(
            db,
            convalidacion_id=id_convalidacion,
            modulo_origen_id=id_modulo_origen,
        )
        if deleted == 0:
            raise HTTPException(status_code=404, detail="Origen de convalidación no encontrado")
        db.commit()
        return {"ok": True, "id_convalidacion": id_convalidacion, "id_modulo_origen": id_modulo_origen}
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
