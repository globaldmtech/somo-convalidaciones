import os
import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse

from .api.routers import admin, convalidaciones

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


def _normalize_app_base_path(raw_value: str | None) -> str:
    value = (raw_value or "").strip()
    if not value or value == "/":
        return ""
    return f"/{value.strip('/')}"


APP_BASE_PATH = _normalize_app_base_path(os.getenv("APP_BASE_PATH"))
INDEX_BASE_HREF = f"{APP_BASE_PATH}/" if APP_BASE_PATH else "/"


app = FastAPI(
    title="Somo-Convalidaciones API",
    description="Backend for Somorrostro Convalidaciones system.",
    version="0.1.0",
    root_path=APP_BASE_PATH,
)

_default_frontend_dist = Path(__file__).resolve().parents[2] / "frontend" / "dist" / "frontend" / "browser"
FRONTEND_DIST_DIR = Path(os.getenv("FRONTEND_DIST_DIR", str(_default_frontend_dist))).resolve()

cors_origins_env = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:4200")
cors_allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception for {request.method} {request.url.path}: {exc}", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)[:200]}"},
    )

# Include Routers
app.include_router(convalidaciones.router)
app.include_router(admin.router)

def _dist_file_or_none(relative_path: str) -> Path | None:
    if not FRONTEND_DIST_DIR.exists():
        return None

    requested_file = (FRONTEND_DIST_DIR / relative_path).resolve()
    if not str(requested_file).startswith(str(FRONTEND_DIST_DIR)):
        return None
    if requested_file.is_file():
        return requested_file
    return None


def _index_file() -> Path:
    index_file = FRONTEND_DIST_DIR / "index.html"
    if not index_file.is_file():
        raise HTTPException(
            status_code=503,
            detail=f"No se encontró frontend compilado en: {FRONTEND_DIST_DIR}",
        )
    return index_file


def _frontend_index_response() -> HTMLResponse:
    index_html = _index_file().read_text(encoding="utf-8")
    if INDEX_BASE_HREF != "/":
        index_html = index_html.replace('<base href="/">', f'<base href="{INDEX_BASE_HREF}">', 1)
    return HTMLResponse(content=index_html)


def _should_return_index_for(path: str) -> bool:
    normalized_path = path.rstrip("/")

    if normalized_path == "admin":
        return True

    restricted_prefixes = ("convalidaciones", "admin/", "alumnos", "docs", "redoc", "openapi.json")
    if path.startswith(restricted_prefixes):
        return False
    return True


@app.get("/", include_in_schema=False)
async def frontend_index():
    return _frontend_index_response()


@app.get("/{path:path}", include_in_schema=False)
async def frontend_or_static(path: str):
    static_file = _dist_file_or_none(path)
    if static_file:
        return FileResponse(static_file)

    # Do not mask API/docs paths with SPA fallback.
    if not _should_return_index_for(path):
        raise HTTPException(status_code=404, detail="Not Found")

    # If it looks like an asset path and it does not exist, return 404.
    if "." in Path(path).name:
        raise HTTPException(status_code=404, detail="Asset not found")

    return _frontend_index_response()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
