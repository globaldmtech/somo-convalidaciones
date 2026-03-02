"""SQLite access layer."""
from __future__ import annotations

import os
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Generator, Optional, Sequence
from dotenv import load_dotenv
from datetime import datetime, timezone

_BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(_BASE_DIR / ".env")
_db_path_env = os.getenv("DB_PATH", "scripts/db.sqlite")
DEFAULT_DB_PATH = Path(_db_path_env)
if not DEFAULT_DB_PATH.is_absolute():
    DEFAULT_DB_PATH = _BASE_DIR / DEFAULT_DB_PATH

CICLO_ACREDITACIONES_EXTERNAS = "Acreditaciones externas"


@dataclass
class DBConfig:
    path: Path = DEFAULT_DB_PATH



def connect(config: Optional[DBConfig] = None) -> sqlite3.Connection:
    if config is None:
        config = DBConfig()
    config.path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(config.path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = OFF;")
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

def list_grados(conn: sqlite3.Connection) -> Sequence[dict]:
    """List grados."""
    return [dict(row) for row in conn.execute("SELECT * FROM grados").fetchall()]


def list_ciclos(conn: sqlite3.Connection, grado_id: Optional[int] = None) -> Sequence[dict]:
    """List ciclos, optionally filtered by grado_id."""
    if grado_id:
        rows = conn.execute("SELECT * FROM ciclos WHERE id_grado = ?", (grado_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM ciclos").fetchall()
    return [dict(row) for row in rows]


def list_modulos(conn: sqlite3.Connection, ciclo_id: Optional[int] = None) -> Sequence[dict]:
    """List modulos, optionally filtered by ciclo_id."""
    if ciclo_id:
        rows = conn.execute("SELECT * FROM modulos WHERE id_ciclo = ?", (ciclo_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM modulos").fetchall()
    return [dict(row) for row in rows]


def list_acreditaciones_externas(conn: sqlite3.Connection) -> Sequence[dict]:
    """List external certifications represented as modules in dedicated cycle."""
    rows = conn.execute(
        """
        SELECT
            m.id,
            m.nombre,
            COALESCE(m.id_oficial, 'otros') AS tipo
        FROM modulos m
        JOIN ciclos c ON c.id = m.id_ciclo
        WHERE c.nombre = ?
        ORDER BY tipo, m.nombre
        """,
        (CICLO_ACREDITACIONES_EXTERNAS,),
    ).fetchall()
    return [dict(row) for row in rows]


# === Matching Logic ===

def get_convalidaciones_posibles(
    conn: sqlite3.Connection,
    modulo_ids: Sequence[int],
    acreditacion_ids: Sequence[int],
    target_ciclo_id: int
) -> Sequence[dict]:
    """
    Find modules that can be convalidated within a specific target cycle.
    """
    origen_ids = list(dict.fromkeys([*modulo_ids, *acreditacion_ids]))
    if not origen_ids:
        return []

    placeholders = ",".join(["?"] * len(origen_ids))
    query = f"""
        SELECT
            conv.id AS id_convalidacion,
            m.id,
            m.nombre,
            c_target.nombre AS ciclo_nombre,
            CASE
                WHEN SUM(CASE WHEN c_source.nombre = ? THEN 1 ELSE 0 END) = COUNT(*) THEN 'acreditacion_externa'
                ELSE 'modulos_fp'
            END AS origen_tipo,
            CASE
                WHEN SUM(CASE WHEN c_source.nombre = ? THEN 1 ELSE 0 END) = COUNT(*) THEN REPLACE(GROUP_CONCAT(DISTINCT m_source.nombre), ',', ', ')
                WHEN COUNT(DISTINCT c_source.id) = 1 THEN MIN(c_source.nombre)
                ELSE 'Origen mixto'
            END AS source_nombre,
            REPLACE(GROUP_CONCAT(DISTINCT m_source.nombre), ',', ', ') AS modulos_origen
        FROM convalidacion conv
        JOIN modulos m ON conv.id_modulo_destino = m.id
        JOIN ciclos c_target ON m.id_ciclo = c_target.id
        JOIN convalidacion_origen co ON conv.id = co.conv_id
        JOIN modulos m_source ON co.id_modulo = m_source.id
        JOIN ciclos c_source ON m_source.id_ciclo = c_source.id
        WHERE co.id_modulo IN ({placeholders})
          AND m.id_ciclo = ?
        GROUP BY conv.id, m.id, m.nombre, c_target.nombre
        HAVING COUNT(DISTINCT co.id_modulo) = (
            SELECT COUNT(*)
            FROM convalidacion_origen co_all
            WHERE co_all.conv_id = conv.id
        )
    """
    params = [
        CICLO_ACREDITACIONES_EXTERNAS,
        CICLO_ACREDITACIONES_EXTERNAS,
        *origen_ids,
        target_ciclo_id,
    ]
    return [dict(row) for row in conn.execute(query, params).fetchall()]


def insert_formulario(
    conn: sqlite3.Connection,
    id_alumno: int,
    estado: str,
    enviado_at: Optional[str] = None,
    validado_por: Optional[int] = None,
    anotaciones: Optional[str] = None,
    validado_at: Optional[str] = None,
) -> dict:
    """Insert a new form and return the created row."""

    cursor = conn.execute(
        f"""
        INSERT INTO formularios (
            id_alumno,
            enviado_at,
            estado,
            validado_por,
            anotaciones,
            validado_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        """,
        (id_alumno, enviado_at, estado, validado_por, anotaciones, validado_at),
    )

    created = conn.execute(
        f"""
        SELECT id, id_alumno, enviado_at, estado, validado_por, anotaciones, validado_at
        FROM formularios
        WHERE id = ?
        """,
        (cursor.lastrowid,),
    ).fetchone()

    if not created:
        return {"id": cursor.lastrowid}

    return dict(created)


def insert_modulo_aportado(
    conn: sqlite3.Connection,
    id_formulario: int,
    id_modulos: Sequence[int],
    id_acreditaciones: Sequence[int],
    descripciones: Optional[Sequence[str]] = None,
) -> list:
    """Execute INSERTs into formulario_modulos_aportados without committing.

    The caller is responsible for commit/rollback.
    """
    for id_modulo in list(id_modulos) + list(id_acreditaciones):
        conn.execute(
            """
            INSERT INTO formulario_modulos_aportados (id_formulario, id_modulo)
            VALUES (?, ?)
            """,
            (id_formulario, id_modulo),
        )

    if descripciones:
        for descripcion in descripciones:
            conn.execute(
                """
                INSERT INTO formulario_modulos_aportados (id_formulario, descripcion)
                VALUES (?, ?)
                """,
                (id_formulario, descripcion),
            )
    return "Modulos aportados insertados correctamente"


def insert_formulario_solicitud(
    conn: sqlite3.Connection,
    id_formulario: int,
    solicitudes_registradas: Sequence[object],
    solicitudes_no_registradas: Sequence[str]
) -> dict:
    """INSERT into formulario_solicitudes without committing.

    The caller is responsible for commit/rollback.
    """
    
    for s_regis in solicitudes_registradas:
        cursor = conn.execute(
            """
            INSERT INTO formulario_solicitudes (id_formulario, id_modulo_destino, id_convalidacion)
            VALUES (?, ?, ?)
            """,
            (id_formulario, s_regis.id_modulo_destino, s_regis.id_convalidacion),
        )
    for s_no_regis in solicitudes_no_registradas:
        cursor = conn.execute(
            """
            INSERT INTO formulario_solicitudes (id_formulario, descripcion)
            VALUES (?, ?)
            """,
            (id_formulario, s_no_regis),
        )
    return "Solicitudes insertadas correctamente"

def get_or_create_usuario_by_dni(
    conn: sqlite3.Connection,
    dni: str,
    nombre: str,
    apellidos: Optional[str],
    email: str,
) -> dict:
    """Busca usuario por DNI y, si no existe, lo crea. No hace commit."""

    existing = conn.execute(
        """
        SELECT id
        FROM usuarios
        WHERE UPPER(DNI) = ?
        """,
        (dni,),
    ).fetchone()
    if existing:
        return existing['id']

    nombre_full = " ".join(
        part.strip() for part in [(nombre or ""), (apellidos or "")] if part and part.strip()
    ).strip()

    created_at = datetime.now(timezone.utc).isoformat()
    cursor = conn.execute(
        """
        INSERT INTO usuarios (DNI, nombre, email, rol, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (dni, nombre_full, (email or "").strip(), "alumno", created_at),
    )
    return cursor.lastrowid
