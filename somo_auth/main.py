import os
from urllib.parse import urlencode, urlsplit, urlunsplit, parse_qsl

import jwt
import requests
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import RedirectResponse

from backend.app.auth import microsoft
from backend.app.auth.shared_session import (
    AUTH_SESSION_COOKIE_NAME,
    AUTH_SESSION_TTL_SECONDS,
    create_session_token,
    create_state_token,
    decode_session_token,
    decode_state_token,
)


AUTH_ROOT_PATH = "/auth"

app = FastAPI(title="Somo Auth", version="0.1.0", root_path=AUTH_ROOT_PATH)


def _public_origin(request: Request) -> str:
    forwarded_proto = (request.headers.get("x-forwarded-proto") or request.url.scheme).split(",", 1)[0].strip()
    forwarded_host = (request.headers.get("x-forwarded-host") or request.headers.get("host") or request.url.netloc).split(",", 1)[0].strip()
    return f"{forwarded_proto}://{forwarded_host}"


def _redirect_uri(request: Request) -> str:
    return f"{_public_origin(request)}{AUTH_ROOT_PATH}/callback"


def _normalize_return_to(value: str | None) -> str:
    candidate = (value or "").strip()
    if not candidate:
        return "/"
    if not candidate.startswith("/") or candidate.startswith("//"):
        return "/"
    return candidate


def _with_auth_error(return_to: str, message: str) -> str:
    split = urlsplit(return_to)
    query = parse_qsl(split.query, keep_blank_values=True)
    query = [(key, value) for key, value in query if key != "auth_error"]
    query.append(("auth_error", message))
    return urlunsplit((split.scheme, split.netloc, split.path, urlencode(query), split.fragment))


def _session_response(destination: str, token: str) -> RedirectResponse:
    response = RedirectResponse(destination, status_code=302)
    response.set_cookie(
        key=AUTH_SESSION_COOKIE_NAME,
        value=token,
        max_age=AUTH_SESSION_TTL_SECONDS,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
    )
    return response


def _clear_session_response(destination: str) -> RedirectResponse:
    response = RedirectResponse(destination, status_code=302)
    response.delete_cookie(
        key=AUTH_SESSION_COOKIE_NAME,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
    )
    return response


def _token_endpoint_payload(request: Request, code: str) -> dict[str, str]:
    client_secret = (os.getenv("CLIENT_SECRET") or "").strip()
    if not client_secret:
        raise RuntimeError("Falta CLIENT_SECRET para el auth server")

    return {
        "grant_type": "authorization_code",
        "client_id": microsoft.CLIENT_ID,
        "client_secret": client_secret,
        "redirect_uri": _redirect_uri(request),
        "code": code,
    }


@app.get("/login")
async def login(request: Request, returnTo: str = Query(default="/")):
    if not microsoft.TENANT_ID or not microsoft.CLIENT_ID:
        raise HTTPException(status_code=500, detail="Autenticación Microsoft no configurada")

    normalized_return_to = _normalize_return_to(returnTo)
    state = create_state_token(normalized_return_to)
    params = {
        "client_id": microsoft.CLIENT_ID,
        "response_type": "code",
        "redirect_uri": _redirect_uri(request),
        "response_mode": "query",
        "scope": "openid profile email",
        "state": state,
        "prompt": "select_account",
    }
    return RedirectResponse(f"{microsoft.authorization_endpoint()}?{urlencode(params)}", status_code=302)


@app.get("/callback")
async def callback(
    request: Request,
    state: str = Query(default=""),
    code: str = Query(default=""),
    error: str = Query(default=""),
    error_description: str = Query(default=""),
):
    try:
        state_payload = decode_state_token(state)
        return_to = _normalize_return_to(str(state_payload.get("return_to") or "/"))
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="State inválido o caducado")

    if error:
        detail = error_description.strip() or error.strip() or "No se ha podido completar el acceso con Microsoft."
        return RedirectResponse(_with_auth_error(return_to, detail), status_code=302)

    if not code:
        return RedirectResponse(_with_auth_error(return_to, "Microsoft no ha devuelto un código de acceso."), status_code=302)

    try:
        token_response = requests.post(
            microsoft.token_endpoint(),
            data=_token_endpoint_payload(request, code),
            timeout=15,
        )
        token_response.raise_for_status()
        token_payload = token_response.json()
        id_token = str(token_payload.get("id_token") or "").strip()
        microsoft_user = microsoft.validate_id_token(id_token)
        token = create_session_token(
            subject=microsoft_user["oid"],
            oid=microsoft_user["oid"],
            name=microsoft_user["display_name"] or microsoft_user["username"],
            username=microsoft_user["username"],
            roles=["admin"],
        )
        return _session_response(return_to, token)
    except ValueError as exc:
        return RedirectResponse(_with_auth_error(return_to, str(exc)), status_code=302)
    except requests.RequestException:
        return RedirectResponse(_with_auth_error(return_to, "No se ha podido completar la validación con Microsoft."), status_code=302)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/me")
async def me(request: Request):
    token = request.cookies.get(AUTH_SESSION_COOKIE_NAME) or ""
    if not token:
        raise HTTPException(status_code=401, detail="No hay sesión autenticada")

    try:
        payload = decode_session_token(token)
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Sesión inválida o caducada")

    return {
        "authenticated": True,
        "oid": payload.get("oid"),
        "name": payload.get("name"),
        "username": payload.get("preferred_username"),
        "roles": payload.get("roles") or [],
    }


@app.get("/logout")
async def logout(returnTo: str = Query(default="/")):
    return _clear_session_response(_normalize_return_to(returnTo))
