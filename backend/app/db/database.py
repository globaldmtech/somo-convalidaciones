"""SQLite access layer."""
from __future__ import annotations

import os
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Generator, Optional, Sequence

# Robust database path: always looks for backend/scripts/db.sqlite
_BASE_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_PATH = _BASE_DIR / "scripts" / "db.sqlite"

if os.getenv("DB_PATH"):
    DEFAULT_DB_PATH = Path(os.getenv("DB_PATH"))


@dataclass
class DBConfig:
    path: Path = DEFAULT_DB_PATH


def connect(config: Optional[DBConfig] = None) -> sqlite3.Connection:
    if config is None:
        config = DBConfig()
    config.path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(config.path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def get_db() -> Generator[sqlite3.Connection, None, None]:
    """FastAPI dependency to provide a database connection."""
    conn = connect()
    try:
        yield conn
    finally:
        conn.close()


# === Catalog ===

def list_grados(conn: sqlite3.Connection) -> Sequence[sqlite3.Row]:
    """List grados."""
    return conn.execute("SELECT * FROM grados").fetchall()


def list_ciclos(conn: sqlite3.Connection, grado_id: Optional[int] = None) -> Sequence[sqlite3.Row]:
    """List ciclos, optionally filtered by grado_id."""
    if grado_id:
        return conn.execute("SELECT * FROM ciclos WHERE id_grado = ?", (grado_id,)).fetchall()
    return conn.execute("SELECT * FROM ciclos").fetchall()


def list_modulos(conn: sqlite3.Connection, ciclo_id: Optional[int] = None) -> Sequence[sqlite3.Row]:
    """List modulos, optionally filtered by ciclo_id."""
    if ciclo_id:
        return conn.execute("SELECT * FROM modulos WHERE id_ciclo = ?", (ciclo_id,)).fetchall()
    return conn.execute("SELECT * FROM modulos").fetchall()


def list_acreditaciones_externas(conn: sqlite3.Connection) -> Sequence[sqlite3.Row]:
    """List all external certifications ordered by type and name."""
    return conn.execute(
        "SELECT id, nombre, tipo FROM acreditacion_externa ORDER BY tipo, nombre"
    ).fetchall()
