"""SQLite access layer."""
from __future__ import annotations

import os
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Generator, Optional, Sequence
from dotenv import load_dotenv

_BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(_BASE_DIR / ".env")
DEFAULT_DB_PATH = Path(os.getenv("DB_PATH", _BASE_DIR / "scripts" / "db.sqlite"))


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
    """List all external certifications ordered by type and name."""
    rows = conn.execute(
        "SELECT id, nombre, tipo FROM acreditacion_externa ORDER BY tipo, nombre"
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
    results = []

    # 1. Matching by external certifications (1-to-1)
    if acreditacion_ids:
        placeholders = ",".join(["?"] * len(acreditacion_ids))
        query_ext = f"""
            SELECT m.id, m.nombre, c.nombre as ciclo_nombre, 'acreditacion_externa' as origen_tipo,
                   ae.nombre as source_nombre
            FROM convalidacion_externa ce
            JOIN modulos m ON ce.id_modulo_destino = m.id
            JOIN ciclos c ON m.id_ciclo = c.id
            JOIN acreditacion_externa ae ON ce.id_acreditacion = ae.id
            WHERE ce.id_acreditacion IN ({placeholders})
            AND m.id_ciclo = ?
        """
        params = list(acreditacion_ids) + [target_ciclo_id]
        results.extend([dict(row) for row in conn.execute(query_ext, params).fetchall()])
    # 2. Matching by modules (N-to-1)
    if modulo_ids:
        placeholders = ",".join(["?"] * len(modulo_ids))
        query_mod = f"""
            SELECT m.id, m.nombre, c_target.nombre as ciclo_nombre, 'modulos_fp' as origen_tipo,
                   c_source.nombre as source_nombre,
                   GROUP_CONCAT(m_source.nombre, ', ') as modulos_origen
            FROM convalidacion conv
            JOIN modulos m ON conv.id_modulo_destino = m.id
            JOIN ciclos c_target ON m.id_ciclo = c_target.id
            JOIN convalidacion_origen co ON conv.id = co.conv_id
            JOIN modulos m_source ON co.id_modulo = m_source.id
            JOIN ciclos c_source ON m_source.id_ciclo = c_source.id
            WHERE NOT EXISTS (
                SELECT 1 FROM convalidacion_origen co_check
                WHERE co_check.conv_id = conv.id
                AND co_check.id_modulo NOT IN ({placeholders})
            )
            AND m.id_ciclo = ?
            GROUP BY conv.id
        """
        params = list(modulo_ids) + [target_ciclo_id]
        results.extend([dict(row) for row in conn.execute(query_mod, params).fetchall()])

    return results


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
    descripcion: Optional[str] = None,
) -> list:
    """Execute INSERTs into formulario_modulos_aportados without committing.

    The caller is responsible for commit/rollback.
    """
    rows = []
    for id_modulo in id_modulos:
        cursor = conn.execute(
            """
            INSERT INTO formulario_modulos_aportados (id_formulario, id_modulo, descripcion)
            VALUES (?, ?, ?)
            """,
            (id_formulario, id_modulo, descripcion),
        )
        rows.append({
            "id": cursor.lastrowid,
            "id_formulario": id_formulario,
            "id_modulo": id_modulo,
            "descripcion": descripcion,
        })
    return rows


def insert_formulario_solicitud(
    conn: sqlite3.Connection,
    id_formulario: int,
    id_modulo_destino: Optional[int] = None,
    id_convalidacion: Optional[int] = None,
    descripcion: Optional[str] = None,
) -> dict:
    """INSERT into formulario_solicitudes without committing.

    The caller is responsible for commit/rollback.
    """
    cursor = conn.execute(
        """
        INSERT INTO formulario_solicitudes (id_formulario, id_modulo_destino, id_convalidacion, descripcion)
        VALUES (?, ?, ?, ?)
        """,
        (id_formulario, id_modulo_destino, id_convalidacion, descripcion),
    )
    return {
        "id_formulario": id_formulario,
        "id_modulo_destino": id_modulo_destino,
        "id_convalidacion": id_convalidacion,
        "descripcion": descripcion,
    }
