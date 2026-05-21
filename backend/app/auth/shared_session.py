import os
import time
from typing import Any

import jwt


AUTH_SESSION_COOKIE_NAME = os.getenv("AUTH_SESSION_COOKIE_NAME", "somo_auth_session").strip() or "somo_auth_session"
AUTH_SESSION_SECRET = (
    os.getenv("AUTH_SESSION_SECRET")
    or os.getenv("ADMIN_AUTH_SECRET")
    or "somo-auth-secret"
).strip()
AUTH_SESSION_ISSUER = os.getenv("AUTH_SESSION_ISSUER", "somo-auth").strip() or "somo-auth"
AUTH_SESSION_TTL_SECONDS = int(os.getenv("AUTH_SESSION_TTL_SECONDS", "43200"))
AUTH_STATE_TTL_SECONDS = int(os.getenv("AUTH_STATE_TTL_SECONDS", "600"))


def create_session_token(*, subject: str, oid: str, name: str, username: str, roles: list[str]) -> str:
    now = int(time.time())
    payload = {
        "iss": AUTH_SESSION_ISSUER,
        "sub": subject,
        "oid": oid,
        "name": name,
        "preferred_username": username,
        "roles": roles,
        "iat": now,
        "exp": now + AUTH_SESSION_TTL_SECONDS,
    }
    return jwt.encode(payload, AUTH_SESSION_SECRET, algorithm="HS256")


def decode_session_token(token: str, *, required_role: str | None = None) -> dict[str, Any]:
    payload = jwt.decode(
        token,
        AUTH_SESSION_SECRET,
        algorithms=["HS256"],
        issuer=AUTH_SESSION_ISSUER,
        options={"require": ["exp", "iat", "iss", "sub"]},
    )

    roles = payload.get("roles") or []
    if not isinstance(roles, list):
        raise jwt.InvalidTokenError("Token sin roles válidos")
    if required_role and required_role not in roles:
        raise jwt.InvalidTokenError("La sesión no tiene el rol requerido")
    return payload


def create_state_token(return_to: str) -> str:
    now = int(time.time())
    payload = {
        "iss": AUTH_SESSION_ISSUER,
        "typ": "auth_state",
        "return_to": return_to,
        "iat": now,
        "exp": now + AUTH_STATE_TTL_SECONDS,
    }
    return jwt.encode(payload, AUTH_SESSION_SECRET, algorithm="HS256")


def decode_state_token(token: str) -> dict[str, Any]:
    payload = jwt.decode(
        token,
        AUTH_SESSION_SECRET,
        algorithms=["HS256"],
        issuer=AUTH_SESSION_ISSUER,
        options={"require": ["exp", "iat", "iss", "typ", "return_to"]},
    )
    if payload.get("typ") != "auth_state":
        raise jwt.InvalidTokenError("State inválido")
    return payload
