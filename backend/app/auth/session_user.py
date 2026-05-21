from __future__ import annotations

import sqlite3
from typing import Any

import jwt
from fastapi import HTTPException, Request

from ..db import database
from .shared_session import AUTH_SESSION_COOKIE_NAME, decode_session_token


def get_session_payload(request: Request) -> dict[str, Any] | None:
    token = (request.cookies.get(AUTH_SESSION_COOKIE_NAME) or "").strip()
    if not token:
        return None

    try:
        return decode_session_token(token)
    except jwt.InvalidTokenError:
        return None


def get_or_create_authenticated_user(request: Request, db: sqlite3.Connection) -> dict[str, Any]:
    payload = get_session_payload(request)
    if not payload:
        raise HTTPException(status_code=401, detail="Sesión no válida o caducada")

    oid = str(payload.get("oid") or "").strip()
    if not oid:
        raise HTTPException(status_code=401, detail="La sesión no contiene un oid válido")

    display_name = str(payload.get("name") or payload.get("preferred_username") or "").strip()
    email = str(payload.get("preferred_username") or "").strip()

    user_id = database.UserQueries.get_or_create_usuario_by_oid(
        conn=db,
        oid=oid,
        nombre=display_name,
        email=email,
    )
    usuario = database.UserQueries.get_user_by_id(db, user_id)
    if not usuario:
        raise HTTPException(status_code=500, detail="No se pudo resolver el usuario autenticado")

    return {
        "id": int(usuario["id"]),
        "oid": str(usuario.get("oid") or oid),
        "nombre": str(usuario.get("nombre") or display_name),
        "email": str(usuario.get("email") or email),
        "dni": str(usuario.get("dni") or "") or None,
        "rol": str(usuario.get("rol") or "alumno"),
        "display_name": display_name or str(usuario.get("nombre") or ""),
        "username": email,
        "roles": [str(usuario.get("rol") or "alumno")],
    }


def require_authenticated_user(request: Request, db: sqlite3.Connection) -> dict[str, Any]:
    return get_or_create_authenticated_user(request, db)


def require_admin_user(request: Request, db: sqlite3.Connection) -> dict[str, Any]:
    usuario = get_or_create_authenticated_user(request, db)
    if (usuario.get("rol") or "").strip().lower() != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para acceder al panel admin")
    return usuario
