import os
from functools import lru_cache
from pathlib import Path

import jwt
import requests
from dotenv import load_dotenv


_BACKEND_DIR = Path(__file__).resolve().parents[2]
_WORKSPACE_DIR = _BACKEND_DIR.parent
load_dotenv(_WORKSPACE_DIR / ".env")
load_dotenv(_BACKEND_DIR / ".env")


TENANT_ID = (os.getenv("TENANT_ID") or "").strip()
CLIENT_ID = (os.getenv("CLIENT_ID") or "").strip()
OBJECT_ID = (os.getenv("OBJECT_ID") or "").strip()


def is_enabled() -> bool:
    return bool(TENANT_ID and CLIENT_ID and OBJECT_ID)


def public_config() -> dict:
    return {
        "enabled": is_enabled(),
        "tenant_id": TENANT_ID,
        "client_id": CLIENT_ID,
    }


@lru_cache(maxsize=1)
def _openid_configuration() -> dict:
    if not TENANT_ID:
        raise RuntimeError("Falta TENANT_ID para autenticar con Microsoft")

    response = requests.get(
        f"https://login.microsoftonline.com/{TENANT_ID}/v2.0/.well-known/openid-configuration",
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


@lru_cache(maxsize=1)
def _jwks_client() -> jwt.PyJWKClient:
    jwks_uri = _openid_configuration().get("jwks_uri")
    if not jwks_uri:
        raise RuntimeError("No se ha podido resolver el JWKS de Microsoft Entra ID")
    return jwt.PyJWKClient(jwks_uri)


def validate_id_token(token: str) -> dict:
    if not is_enabled():
        raise RuntimeError("Autenticación Microsoft no configurada")
    if not token:
        raise ValueError("Token de Microsoft vacío")

    signing_key = _jwks_client().get_signing_key_from_jwt(token)
    payload = jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        audience=CLIENT_ID,
        issuer=_openid_configuration().get("issuer"),
        options={"require": ["exp", "iat", "iss", "aud"]},
    )

    oid = str(payload.get("oid") or "").strip()
    if not oid:
        raise ValueError("El token de Microsoft no incluye oid")
    if oid != OBJECT_ID:
        raise ValueError("La cuenta autenticada no está autorizada")

    return {
        "oid": oid,
        "display_name": (payload.get("name") or payload.get("preferred_username") or "").strip(),
        "username": (payload.get("preferred_username") or payload.get("upn") or "").strip(),
    }
