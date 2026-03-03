"""SQLite access layer."""
from __future__ import annotations

import os
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Generator, Optional, Sequence

from dotenv import load_dotenv

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


class CatalogQueries:
    @staticmethod
    def list_grados(conn: sqlite3.Connection) -> Sequence[dict]:
        return [dict(row) for row in conn.execute("SELECT * FROM grados").fetchall()]

    @staticmethod
    def list_ciclos(conn: sqlite3.Connection, grado_id: Optional[int] = None) -> Sequence[dict]:
        if grado_id:
            rows = conn.execute("SELECT * FROM ciclos WHERE id_grado = ?", (grado_id,)).fetchall()
        else:
            rows = conn.execute("SELECT * FROM ciclos").fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def list_modulos(conn: sqlite3.Connection, ciclo_id: Optional[int] = None) -> Sequence[dict]:
        if ciclo_id:
            rows = conn.execute("SELECT * FROM modulos WHERE id_ciclo = ?", (ciclo_id,)).fetchall()
        else:
            rows = conn.execute("SELECT * FROM modulos").fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def list_acreditaciones_externas(conn: sqlite3.Connection) -> Sequence[dict]:
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

    @staticmethod
    def delete_ciclo(conn: sqlite3.Connection, ciclo_id: int) -> int:
        cursor = conn.execute(
            """
            DELETE FROM ciclos
            WHERE id = ?
            """,
            (ciclo_id,),
        )
        return int(cursor.rowcount)

    @staticmethod
    def delete_modulo(conn: sqlite3.Connection, modulo_id: int) -> int:
        cursor = conn.execute(
            """
            DELETE FROM modulos
            WHERE id = ?
            """,
            (modulo_id,),
        )
        return int(cursor.rowcount)

    @staticmethod
    def create_ciclo(
        conn: sqlite3.Connection,
        nombre: str,
        id_familia: int,
        id_grado: int,
    ) -> int:
        cursor = conn.execute(
            """
            INSERT INTO ciclos (nombre, id_oficial, normativa, id_familia, id_grado)
            VALUES (?, NULL, NULL, ?, ?)
            """,
            (nombre, id_familia, id_grado),
        )
        return int(cursor.lastrowid)

    @staticmethod
    def create_modulos(
        conn: sqlite3.Connection,
        id_ciclo: int,
        modulos: Sequence[dict],
    ) -> int:
        inserted = 0
        for modulo in modulos:
            nombre = (modulo.get("nombre") or "").strip()
            id_oficial = (modulo.get("id_oficial") or "").strip() or None
            if not nombre:
                continue
            conn.execute(
                """
                INSERT INTO modulos (nombre, id_oficial, id_ciclo)
                VALUES (?, ?, ?)
                """,
                (nombre, id_oficial, id_ciclo),
            )
            inserted += 1
        return inserted


class ConvalidationQueries:
    @staticmethod
    def get_convalidaciones_posibles(
        conn: sqlite3.Connection,
        modulo_ids: Sequence[int],
        acreditacion_ids: Sequence[int],
        target_ciclo_id: int,
    ) -> Sequence[dict]:
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


class UserQueries:
    @staticmethod
    def get_or_create_usuario_by_dni(
        conn: sqlite3.Connection,
        dni: str,
        nombre: str,
        apellidos: Optional[str],
        email: str,
    ) -> int:
        existing = conn.execute(
            """
            SELECT id
            FROM usuarios
            WHERE UPPER(DNI) = ?
            """,
            (dni,),
        ).fetchone()
        if existing:
            return int(existing["id"])

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
        return int(cursor.lastrowid)


class FormularioQueries:
    @staticmethod
    def insert_formulario(
        conn: sqlite3.Connection,
        id_alumno: int,
        estado: str,
        enviado_at: Optional[str] = None,
        validado_por: Optional[int] = None,
        anotaciones: Optional[str] = None,
        validado_at: Optional[str] = None,
    ) -> dict:
        cursor = conn.execute(
            """
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
            """
            SELECT id, id_alumno, enviado_at, estado, validado_por, anotaciones, validado_at
            FROM formularios
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()

        if not created:
            return {"id": cursor.lastrowid}
        return dict(created)

    @staticmethod
    def insert_modulo_aportado(
        conn: sqlite3.Connection,
        id_formulario: int,
        id_modulos: Sequence[int],
        id_acreditaciones: Sequence[int],
        descripciones: Optional[Sequence[str]] = None,
    ) -> str:
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

    @staticmethod
    def insert_formulario_solicitud(
        conn: sqlite3.Connection,
        id_formulario: int,
        solicitudes_registradas: Sequence[object],
        solicitudes_no_registradas: Sequence[str],
    ) -> str:
        for s_regis in solicitudes_registradas:
            estado_modulo = 1 if s_regis.id_convalidacion is not None else 0
            conn.execute(
                """
                INSERT INTO formulario_solicitudes (id_formulario, id_modulo_destino, id_convalidacion, estado_modulo)
                VALUES (?, ?, ?, ?)
                """,
                (id_formulario, s_regis.id_modulo_destino, s_regis.id_convalidacion, estado_modulo),
            )

        for s_no_regis in solicitudes_no_registradas:
            conn.execute(
                """
                INSERT INTO formulario_solicitudes (id_formulario, descripcion, estado_modulo)
                VALUES (?, ?, ?)
                """,
                (id_formulario, s_no_regis, 0),
            )
        return "Solicitudes insertadas correctamente"


class AdminQueries:
    @staticmethod
    def authenticate_admin(conn: sqlite3.Connection, nombre: str, password: str) -> Optional[dict]:
        row = conn.execute(
            """
            SELECT id, nombre
            FROM administradores
            WHERE nombre = ? AND password = ?
            """,
            (nombre, password),
        ).fetchone()
        return dict(row) if row else None

    @staticmethod
    def list_admin_formularios(conn: sqlite3.Connection) -> list[dict]:
        formularios = conn.execute(
            """
            SELECT
                f.id,
                f.id_alumno,
                f.enviado_at,
                f.estado AS estado_id,
                ef.nombre AS estado,
                f.anotaciones,
                f.validado_at,
                u.nombre AS alumno_nombre,
                u.DNI AS alumno_dni,
                u.email AS alumno_email
            FROM formularios f
            JOIN usuarios u ON u.id = f.id_alumno
            LEFT JOIN estados_formularios ef ON ef.id = f.estado
            ORDER BY f.id DESC
            """
        ).fetchall()

        resultado: list[dict] = []
        for row in formularios:
            solicitudes = conn.execute(
                """
                SELECT
                    fs.id,
                    fs.id_modulo_destino,
                    fs.id_convalidacion,
                    c.id AS ciclo_id,
                    c.nombre AS ciclo_nombre,
                    m.nombre AS modulo_destino,
                    m.id_oficial AS modulo_destino_codigo,
                    (
                        SELECT REPLACE(GROUP_CONCAT(DISTINCT mo.nombre), ',', ', ')
                        FROM convalidacion_origen co
                        JOIN modulos mo ON mo.id = co.id_modulo
                        WHERE co.conv_id = fs.id_convalidacion
                    ) AS convalidado_por,
                    fs.descripcion,
                    fs.estado_modulo AS estado_modulo_id,
                    emd.nombre AS estado_modulo
                FROM formulario_solicitudes fs
                LEFT JOIN modulos m ON m.id = fs.id_modulo_destino
                LEFT JOIN ciclos c ON c.id = m.id_ciclo
                LEFT JOIN estados_modulos_destino emd ON emd.id = fs.estado_modulo
                WHERE fs.id_formulario = ?
                ORDER BY fs.id
                """,
                (row["id"],),
            ).fetchall()

            modulos_aportados = conn.execute(
                """
                SELECT
                    fma.id,
                    fma.id_modulo,
                    c.id AS ciclo_id,
                    c.nombre AS ciclo_nombre,
                    m.nombre AS modulo_nombre,
                    m.id_oficial AS modulo_codigo,
                    fma.descripcion
                FROM formulario_modulos_aportados fma
                LEFT JOIN modulos m ON m.id = fma.id_modulo
                LEFT JOIN ciclos c ON c.id = m.id_ciclo
                WHERE fma.id_formulario = ?
                ORDER BY fma.id
                """,
                (row["id"],),
            ).fetchall()

            resultado.append(
                {
                    "id": row["id"],
                    "id_alumno": row["id_alumno"],
                    "enviado_at": row["enviado_at"],
                    "estado_id": row["estado_id"],
                    "estado": row["estado"],
                    "anotaciones": row["anotaciones"],
                    "validado_at": row["validado_at"],
                    "alumno": {
                        "nombre": row["alumno_nombre"],
                        "dni": row["alumno_dni"],
                        "email": row["alumno_email"],
                    },
                    "solicitudes": [dict(s) for s in solicitudes],
                    "modulos_aportados": [dict(m) for m in modulos_aportados],
                }
            )

        return resultado

    @staticmethod
    def update_formulario_estado(
        conn: sqlite3.Connection,
        id_formulario: int,
        estado_id: int,
        admin_id: Optional[int] = None,
    ) -> int:
        if admin_id is not None:
            cursor = conn.execute(
                """
                UPDATE formularios
                SET estado = ?, validado_por = ?, validado_at = ?
                WHERE id = ?
                """,
                (estado_id, admin_id, datetime.now(timezone.utc).isoformat(), id_formulario),
            )
        else:
            cursor = conn.execute(
                """
                UPDATE formularios
                SET estado = ?
                WHERE id = ?
                """,
                (estado_id, id_formulario),
            )
        return int(cursor.rowcount)

    @staticmethod
    def update_solicitud_estado(
        conn: sqlite3.Connection,
        id_solicitud: int,
        estado_modulo_id: int,
        admin_id: Optional[int] = None,
    ) -> Optional[dict]:
        formulario_row = conn.execute(
            """
            SELECT fs.id_formulario, f.estado AS formulario_estado
            FROM formulario_solicitudes fs
            JOIN formularios f ON f.id = fs.id_formulario
            WHERE fs.id = ?
            """,
            (id_solicitud,),
        ).fetchone()
        if not formulario_row:
            return None

        conn.execute(
            """
            UPDATE formulario_solicitudes
            SET estado_modulo = ?
            WHERE id = ?
            """,
            (estado_modulo_id, id_solicitud),
        )

        if admin_id is not None:
            conn.execute(
                """
                UPDATE formularios
                SET validado_por = ?, validado_at = ?
                WHERE id = ?
                """,
                (admin_id, datetime.now(timezone.utc).isoformat(), formulario_row["id_formulario"]),
            )

        return {
            "id": id_solicitud,
            "estado_modulo_id": estado_modulo_id,
            "id_formulario": formulario_row["id_formulario"],
        }

    @staticmethod
    def list_admin_ciclos_modulos(conn: sqlite3.Connection) -> list[dict]:
        ciclos = conn.execute(
            """
            SELECT
                c.id,
                c.nombre,
                c.id_oficial,
                c.normativa,
                c.id_familia,
                c.id_grado,
                f.nombre AS familia_nombre,
                g.nombre AS grado_nombre
            FROM ciclos c
            LEFT JOIN familias f ON f.id = c.id_familia
            LEFT JOIN grados g ON g.id = c.id_grado
            ORDER BY c.nombre
            """
        ).fetchall()

        modulos = conn.execute(
            """
            SELECT
                m.id,
                m.nombre,
                m.id_oficial,
                m.id_ciclo
            FROM modulos m
            ORDER BY m.id_ciclo, m.nombre
            """
        ).fetchall()

        modulos_por_ciclo: dict[int, list[dict]] = {}
        for modulo in modulos:
            id_ciclo = modulo["id_ciclo"]
            modulos_por_ciclo.setdefault(id_ciclo, []).append(
                {
                    "id": modulo["id"],
                    "nombre": modulo["nombre"],
                    "id_oficial": modulo["id_oficial"],
                }
            )

        return [
            {
                "id": ciclo["id"],
                "nombre": ciclo["nombre"],
                "id_oficial": ciclo["id_oficial"],
                "normativa": ciclo["normativa"],
                "id_familia": ciclo["id_familia"],
                "id_grado": ciclo["id_grado"],
                "familia_nombre": ciclo["familia_nombre"],
                "grado_nombre": ciclo["grado_nombre"],
                "total_modulos": len(modulos_por_ciclo.get(ciclo["id"], [])),
                "modulos": modulos_por_ciclo.get(ciclo["id"], []),
            }
            for ciclo in ciclos
        ]

    @staticmethod
    def list_admin_convalidaciones(conn: sqlite3.Connection) -> list[dict]:
        reglas = conn.execute(
            """
            SELECT
                cv.id,
                cv.source_link,
                cv.source_page,
                md.id AS id_modulo_destino,
                md.nombre AS modulo_destino_nombre,
                cd.id AS id_ciclo_destino,
                cd.nombre AS ciclo_destino_nombre
            FROM convalidacion cv
            JOIN modulos md ON md.id = cv.id_modulo_destino
            JOIN ciclos cd ON cd.id = md.id_ciclo
            ORDER BY cv.id DESC
            """
        ).fetchall()

        origenes = conn.execute(
            """
            SELECT
                co.conv_id,
                mo.id AS id_modulo_origen,
                mo.nombre AS modulo_origen_nombre,
                co2.id AS id_ciclo_origen,
                co2.nombre AS ciclo_origen_nombre
            FROM convalidacion_origen co
            JOIN modulos mo ON mo.id = co.id_modulo
            JOIN ciclos co2 ON co2.id = mo.id_ciclo
            ORDER BY co.conv_id DESC, co2.nombre, mo.nombre
            """
        ).fetchall()

        origenes_por_regla: dict[int, list[dict]] = {}
        for origen in origenes:
            conv_id = origen["conv_id"]
            origenes_por_regla.setdefault(conv_id, []).append(
                {
                    "id_modulo_origen": origen["id_modulo_origen"],
                    "modulo_origen_nombre": origen["modulo_origen_nombre"],
                    "id_ciclo_origen": origen["id_ciclo_origen"],
                    "ciclo_origen_nombre": origen["ciclo_origen_nombre"],
                }
            )

        return [
            {
                "id": regla["id"],
                "source_link": regla["source_link"],
                "source_page": regla["source_page"],
                "id_modulo_destino": regla["id_modulo_destino"],
                "modulo_destino_nombre": regla["modulo_destino_nombre"],
                "id_ciclo_destino": regla["id_ciclo_destino"],
                "ciclo_destino_nombre": regla["ciclo_destino_nombre"],
                "origenes": origenes_por_regla.get(regla["id"], []),
            }
            for regla in reglas
        ]

    @staticmethod
    def list_admin_users(conn: sqlite3.Connection) -> list[dict]:
        admins = conn.execute(
            """
            SELECT
                id,
                nombre,
                created_at
            FROM administradores
            ORDER BY nombre
            """
        ).fetchall()
        return [dict(row) for row in admins]
