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
    conn = sqlite3.connect(config.path, check_same_thread=False, timeout=30.0)
    conn.row_factory = sqlite3.Row
    _ensure_runtime_schema(conn)
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def _table_exists(conn: sqlite3.Connection, table_name: str) -> bool:
    row = conn.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
        (table_name,),
    ).fetchone()
    return row is not None


def _ensure_runtime_schema(conn: sqlite3.Connection) -> None:
    if not _table_exists(conn, "usuarios"):
        return

    conn.execute("PRAGMA foreign_keys = OFF;")
    try:
        _migrate_usuarios_table(conn)
        _migrate_formularios_table(conn)
        conn.execute("DROP TABLE IF EXISTS administradores")
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.execute("PRAGMA foreign_keys = ON;")


def _migrate_usuarios_table(conn: sqlite3.Connection) -> None:
    columns = {
        str(row["name"]): row
        for row in conn.execute("PRAGMA table_info(usuarios)").fetchall()
    }
    has_oid = "oid" in columns
    dni_not_null = bool(columns["DNI"]["notnull"]) if "DNI" in columns else False
    if has_oid and not dni_not_null:
        return

    select_oid = "oid" if has_oid else "NULL"
    conn.execute(
        """
        CREATE TABLE usuarios__new (
          id INTEGER PRIMARY KEY,
          oid TEXT UNIQUE,
          DNI TEXT UNIQUE,
          nombre TEXT NOT NULL,
          email TEXT NOT NULL,
          rol TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
        """
    )
    conn.execute(
        f"""
        INSERT INTO usuarios__new (id, oid, DNI, nombre, email, rol, created_at)
        SELECT id, {select_oid}, DNI, nombre, email, COALESCE(NULLIF(TRIM(rol), ''), 'alumno'), created_at
        FROM usuarios
        """
    )
    conn.execute("DROP TABLE usuarios")
    conn.execute("ALTER TABLE usuarios__new RENAME TO usuarios")


def _migrate_formularios_table(conn: sqlite3.Connection) -> None:
    if not _table_exists(conn, "formularios"):
        return

    fks = conn.execute("PRAGMA foreign_key_list(formularios)").fetchall()
    uses_admin_fk = any(
        str(row["from"]) == "validado_por" and str(row["table"]) == "administradores"
        for row in fks
    )
    if not uses_admin_fk:
        return

    conn.execute(
        """
        CREATE TABLE formularios__new (
          id INTEGER PRIMARY KEY,
          id_alumno INTEGER NOT NULL,
          enviado_at TEXT,
          estado INTEGER NOT NULL,
          validado_por INTEGER,
          anotaciones TEXT,
          validado_at TEXT,
          FOREIGN KEY (id_alumno) REFERENCES usuarios(id),
          FOREIGN KEY (validado_por) REFERENCES usuarios(id),
          FOREIGN KEY (estado) REFERENCES estados_formularios(id)
        )
        """
    )
    conn.execute(
        """
        INSERT INTO formularios__new (id, id_alumno, enviado_at, estado, validado_por, anotaciones, validado_at)
        SELECT id, id_alumno, enviado_at, estado, NULL, anotaciones, validado_at
        FROM formularios
        """
    )
    conn.execute("DROP TABLE formularios")
    conn.execute("ALTER TABLE formularios__new RENAME TO formularios")


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
        return [
            dict(row)
            for row in conn.execute(
                """
                SELECT *
                FROM grados
                ORDER BY CASE LOWER(nombre)
                    WHEN 'básica' THEN 1
                    WHEN 'basica' THEN 1
                    WHEN 'grado medio' THEN 2
                    WHEN 'grado superior' THEN 3
                    WHEN 'especialización' THEN 4
                    WHEN 'especializacion' THEN 4
                    ELSE 99
                END,
                nombre
                """
            ).fetchall()
        ]

    @staticmethod
    def list_ciclos(conn: sqlite3.Connection, grado_id: Optional[int] = None) -> Sequence[dict]:
        if grado_id:
            rows = conn.execute(
                "SELECT * FROM ciclos WHERE id_grado = ? ORDER BY nombre",
                (grado_id,),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM ciclos ORDER BY nombre").fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def list_modulos(conn: sqlite3.Connection, ciclo_id: Optional[int] = None) -> Sequence[dict]:
        if ciclo_id:
            rows = conn.execute(
                "SELECT * FROM modulos WHERE id_ciclo = ? ORDER BY nombre",
                (ciclo_id,),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM modulos ORDER BY nombre").fetchall()
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
            numerico = 0 if int(modulo.get("numerico", 1)) == 0 else 1
            if not nombre:
                continue
            conn.execute(
                """
                INSERT INTO modulos (nombre, id_oficial, id_ciclo, numerico)
                VALUES (?, ?, ?, ?)
                """,
                (nombre, id_oficial, id_ciclo, numerico),
            )
            inserted += 1
        return inserted

    @staticmethod
    def exists_ciclo(conn: sqlite3.Connection, ciclo_id: int) -> bool:
        row = conn.execute(
            """
            SELECT id
            FROM ciclos
            WHERE id = ?
            """,
            (ciclo_id,),
        ).fetchone()
        return row is not None


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
                REPLACE(GROUP_CONCAT(DISTINCT m_source.nombre), ',', ', ') AS modulos_origen,
                GROUP_CONCAT(DISTINCT co.id_modulo) AS modulos_origen_ids
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
    def get_user_by_id(conn: sqlite3.Connection, user_id: int) -> Optional[dict]:
        row = conn.execute(
            """
            SELECT id, oid, DNI, nombre, email, rol, created_at
            FROM usuarios
            WHERE id = ?
            """,
            (user_id,),
        ).fetchone()
        if not row:
            return None
        return {
            "id": int(row["id"]),
            "oid": row["oid"],
            "dni": row["DNI"],
            "nombre": row["nombre"],
            "email": row["email"],
            "rol": row["rol"],
            "created_at": row["created_at"],
        }

    @staticmethod
    def get_user_by_oid(conn: sqlite3.Connection, oid: str) -> Optional[dict]:
        row = conn.execute(
            """
            SELECT id, oid, DNI, nombre, email, rol, created_at
            FROM usuarios
            WHERE oid = ?
            """,
            (oid,),
        ).fetchone()
        if not row:
            return None
        return {
            "id": int(row["id"]),
            "oid": row["oid"],
            "dni": row["DNI"],
            "nombre": row["nombre"],
            "email": row["email"],
            "rol": row["rol"],
            "created_at": row["created_at"],
        }

    @staticmethod
    def get_or_create_usuario_by_oid(
        conn: sqlite3.Connection,
        oid: str,
        nombre: str,
        email: str,
    ) -> int:
        normalized_oid = (oid or "").strip()
        normalized_nombre = (nombre or "").strip() or (email or "").strip() or normalized_oid
        normalized_email = (email or "").strip() or normalized_oid

        existing = UserQueries.get_user_by_oid(conn, normalized_oid)
        if existing:
            conn.execute(
                """
                UPDATE usuarios
                SET nombre = ?, email = ?
                WHERE id = ?
                """,
                (normalized_nombre, normalized_email, existing["id"]),
            )
            return int(existing["id"])

        existing_by_email = conn.execute(
            """
            SELECT id
            FROM usuarios
            WHERE LOWER(email) = LOWER(?)
              AND (oid IS NULL OR TRIM(oid) = '')
            ORDER BY id ASC
            LIMIT 1
            """,
            (normalized_email,),
        ).fetchone()
        if existing_by_email:
            user_id = int(existing_by_email["id"])
            conn.execute(
                """
                UPDATE usuarios
                SET oid = ?, nombre = ?, email = ?
                WHERE id = ?
                """,
                (normalized_oid, normalized_nombre, normalized_email, user_id),
            )
            return user_id

        created_at = datetime.now(timezone.utc).isoformat()
        cursor = conn.execute(
            """
            INSERT INTO usuarios (oid, DNI, nombre, email, rol, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (normalized_oid, None, normalized_nombre, normalized_email, "alumno", created_at),
        )
        return int(cursor.lastrowid)

    @staticmethod
    def update_user_profile(
        conn: sqlite3.Connection,
        user_id: int,
        *,
        nombre: str,
        email: str,
        dni: Optional[str],
    ) -> int:
        cursor = conn.execute(
            """
            UPDATE usuarios
            SET nombre = ?, email = ?, DNI = ?
            WHERE id = ?
            """,
            (nombre, email, dni, user_id),
        )
        return int(cursor.rowcount)

    @staticmethod
    def list_users(conn: sqlite3.Connection) -> list[dict]:
        rows = conn.execute(
            """
            SELECT id, oid, DNI, nombre, email, rol, created_at
            FROM usuarios
            ORDER BY LOWER(nombre), id
            """
        ).fetchall()
        return [
            {
                "id": int(row["id"]),
                "oid": row["oid"],
                "dni": row["DNI"],
                "nombre": row["nombre"],
                "email": row["email"],
                "rol": row["rol"],
                "created_at": row["created_at"],
            }
            for row in rows
        ]

    @staticmethod
    def update_user_role(conn: sqlite3.Connection, user_id: int, rol: str) -> int:
        cursor = conn.execute(
            """
            UPDATE usuarios
            SET rol = ?
            WHERE id = ?
            """,
            (rol, user_id),
        )
        return int(cursor.rowcount)


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
        modulos_detalle: Optional[Sequence[object]] = None,
    ) -> str:
        notas_por_modulo: dict[int, Optional[float]] = {}
        if modulos_detalle:
            for item in modulos_detalle:
                try:
                    if isinstance(item, dict):
                        id_modulo = int(item.get("id_modulo"))
                        nota_raw = item.get("nota")
                    else:
                        id_modulo = int(getattr(item, "id_modulo"))
                        nota_raw = getattr(item, "nota", None)
                except Exception:
                    continue

                nota = float(nota_raw) if nota_raw is not None else None
                notas_por_modulo[id_modulo] = nota

        for id_modulo in id_modulos:
            conn.execute(
                """
                INSERT INTO formulario_modulos_aportados (id_formulario, id_modulo, nota)
                VALUES (?, ?, ?)
                """,
                (id_formulario, id_modulo, notas_por_modulo.get(int(id_modulo))),
            )

        for id_modulo in id_acreditaciones:
            conn.execute(
                """
                INSERT INTO formulario_modulos_aportados (id_formulario, id_modulo, nota)
                VALUES (?, ?, NULL)
                """,
                (id_formulario, id_modulo),
            )

        if descripciones:
            for descripcion in descripciones:
                conn.execute(
                    """
                    INSERT INTO formulario_modulos_aportados (id_formulario, descripcion, nota)
                    VALUES (?, ?, NULL)
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

    @staticmethod
    def insert_formulario_archivos(
        conn: sqlite3.Connection,
        id_formulario: int,
        archivos: Sequence[dict],
    ) -> str:
        for archivo in archivos:
            conn.execute(
                """
                INSERT INTO formulario_archivos (id_formulario, nombre_archivo, descripcion, ruta_almacenamiento)
                VALUES (?, ?, ?, ?)
                """,
                (
                    id_formulario,
                    archivo["nombre_archivo"],
                    archivo.get("descripcion"),
                    archivo["ruta_almacenamiento"],
                ),
            )
        return "Archivos insertados correctamente"


class AdminQueries:
    @staticmethod
    def list_admin_formularios(
        conn: sqlite3.Connection,
        estado_id: int | None = None,
    ) -> list[dict]:
        query = """
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
        """
        params: list[int] = []
        if estado_id is not None:
            query += " WHERE f.estado = ?"
            params.append(estado_id)
        query += " ORDER BY f.id DESC"

        formularios = conn.execute(query, params).fetchall()

        resultado: list[dict] = []
        for row in formularios:
            solicitudes = conn.execute(
                """
                SELECT
                    fs.id,
                    fs.id_modulo_destino,
                    fs.id_convalidacion,
                    fs.nota_manual,
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
                    (
                        SELECT GROUP_CONCAT(DISTINCT co.id_modulo)
                        FROM convalidacion_origen co
                        WHERE co.conv_id = fs.id_convalidacion
                    ) AS convalidado_por_ids,
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
                    fma.nota,
                    c.id AS ciclo_id,
                    c.nombre AS ciclo_nombre,
                    m.nombre AS modulo_nombre,
                    m.id_oficial AS modulo_codigo,
                    m.numerico AS modulo_numerico,
                    fma.descripcion
                FROM formulario_modulos_aportados fma
                LEFT JOIN modulos m ON m.id = fma.id_modulo
                LEFT JOIN ciclos c ON c.id = m.id_ciclo
                WHERE fma.id_formulario = ?
                ORDER BY fma.id
                """,
                (row["id"],),
            ).fetchall()

            documentos_aportados = conn.execute(
                """
                SELECT
                    fa.id,
                    fa.nombre_archivo,
                    fa.descripcion,
                    fa.ruta_almacenamiento
                FROM formulario_archivos fa
                WHERE fa.id_formulario = ?
                ORDER BY fa.id
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
                    "documentos_aportados": [dict(d) for d in documentos_aportados],
                }
            )

        return resultado

    @staticmethod
    def list_export_convalidaciones_rows(conn: sqlite3.Connection) -> list[dict]:
        rows = conn.execute(
            """
            SELECT
                u.nombre AS alumno_nombre,
                u.DNI AS alumno_dni,
                u.email AS alumno_email,
                COALESCE(cd.nombre, 'Otros no registrados') AS ciclo_matriculado,
                COALESCE(md.nombre, fs.descripcion, 'Módulo sin detalle') AS modulo_a_convalidar,
                COALESCE(emd.nombre, '') AS resolucion,
                COALESCE(REPLACE(GROUP_CONCAT(DISTINCT co2.nombre), ',', CHAR(10)), '') AS ciclo_cursado,
                CASE
                    WHEN COUNT(DISTINCT mo.id) > 2 THEN 'Ciclo completo'
                    ELSE COALESCE(REPLACE(GROUP_CONCAT(DISTINCT mo.nombre), ',', CHAR(10)), '')
                END AS modulo_cursado,
                COALESCE(AVG(CASE WHEN mo.numerico = 1 THEN fma.nota END), fs.nota_manual) AS nota_modulo,
                COALESCE(f.anotaciones, '') AS observaciones
            FROM formularios f
            JOIN usuarios u ON u.id = f.id_alumno
            JOIN formulario_solicitudes fs ON fs.id_formulario = f.id
            LEFT JOIN modulos md ON md.id = fs.id_modulo_destino
            LEFT JOIN ciclos cd ON cd.id = md.id_ciclo
            LEFT JOIN estados_modulos_destino emd ON emd.id = fs.estado_modulo
            LEFT JOIN convalidacion_origen co ON co.conv_id = fs.id_convalidacion
            LEFT JOIN modulos mo ON mo.id = co.id_modulo
            LEFT JOIN ciclos co2 ON co2.id = mo.id_ciclo
            LEFT JOIN formulario_modulos_aportados fma
                ON fma.id_formulario = f.id
               AND fma.id_modulo = co.id_modulo
            WHERE f.estado = 1
            GROUP BY
                f.id,
                fs.id,
                u.nombre,
                u.DNI,
                u.email,
                cd.nombre,
                md.nombre,
                fs.descripcion,
                emd.nombre,
                f.anotaciones
            ORDER BY u.nombre, f.id, fs.id
            """
        ).fetchall()
        return [dict(row) for row in rows]

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
        nota_manual: Optional[float] = None,
    ) -> Optional[dict]:
        formulario_row = conn.execute(
            """
            SELECT fs.id_formulario, f.estado AS formulario_estado, fs.id_convalidacion
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
            SET estado_modulo = ?,
                nota_manual = CASE
                    WHEN id_convalidacion IS NULL AND ? = 1 THEN ?
                    ELSE nota_manual
                END
            WHERE id = ?
            """,
            (estado_modulo_id, estado_modulo_id, nota_manual, id_solicitud),
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
            "nota_manual": nota_manual if formulario_row["id_convalidacion"] is None else None,
        }

    @staticmethod
    def delete_formulario(conn: sqlite3.Connection, formulario_id: int) -> int:
        cursor = conn.execute(
            """
            DELETE FROM formularios
            WHERE id = ?
            """,
            (formulario_id,),
        )
        return int(cursor.rowcount)

    @staticmethod
    def list_formulario_archivos(conn: sqlite3.Connection, formulario_id: int) -> list[dict]:
        rows = conn.execute(
            """
            SELECT id, ruta_almacenamiento
            FROM formulario_archivos
            WHERE id_formulario = ?
            ORDER BY id
            """,
            (formulario_id,),
        ).fetchall()
        return [dict(row) for row in rows]

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
                m.id_ciclo,
                m.numerico
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
                    "numerico": modulo["numerico"],
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
    def list_admin_convalidaciones(
        conn: sqlite3.Connection,
        grado_id: Optional[int] = None,
        ciclo_id: Optional[int] = None,
    ) -> list[dict]:
        where: list[str] = []
        params: list[object] = []
        if grado_id is not None:
            where.append("cd.id_grado = ?")
            params.append(grado_id)
        if ciclo_id is not None:
            where.append("cd.id = ?")
            params.append(ciclo_id)
        where_sql = f"WHERE {' AND '.join(where)}" if where else ""

        reglas = conn.execute(
            f"""
            SELECT
                cv.id,
                cv.source_link,
                cv.source_page,
                md.id AS id_modulo_destino,
                md.nombre AS modulo_destino_nombre,
                md.id_oficial AS modulo_destino_codigo,
                cd.id AS id_ciclo_destino,
                cd.nombre AS ciclo_destino_nombre
            FROM convalidacion cv
            JOIN modulos md ON md.id = cv.id_modulo_destino
            JOIN ciclos cd ON cd.id = md.id_ciclo
            {where_sql}
            ORDER BY cv.id DESC
            """,
            params,
        ).fetchall()
        if not reglas:
            return []

        origenes = conn.execute(
            f"""
            SELECT
                co.conv_id,
                mo.id AS id_modulo_origen,
                mo.nombre AS modulo_origen_nombre,
                mo.id_oficial AS modulo_origen_codigo,
                co2.id AS id_ciclo_origen,
                co2.nombre AS ciclo_origen_nombre
            FROM convalidacion_origen co
            JOIN convalidacion cv ON cv.id = co.conv_id
            JOIN modulos md ON md.id = cv.id_modulo_destino
            JOIN ciclos cd ON cd.id = md.id_ciclo
            JOIN modulos mo ON mo.id = co.id_modulo
            JOIN ciclos co2 ON co2.id = mo.id_ciclo
            {where_sql}
            ORDER BY co.conv_id DESC, co2.nombre, mo.nombre
            """,
            params,
        ).fetchall()

        origenes_por_regla: dict[int, list[dict]] = {}
        for origen in origenes:
            conv_id = origen["conv_id"]
            origenes_por_regla.setdefault(conv_id, []).append(
                {
                    "id_modulo_origen": origen["id_modulo_origen"],
                    "modulo_origen_nombre": origen["modulo_origen_nombre"],
                    "modulo_origen_codigo": origen["modulo_origen_codigo"],
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
                "modulo_destino_codigo": regla["modulo_destino_codigo"],
                "id_ciclo_destino": regla["id_ciclo_destino"],
                "ciclo_destino_nombre": regla["ciclo_destino_nombre"],
                "origenes": origenes_por_regla.get(regla["id"], []),
            }
            for regla in reglas
        ]

    @staticmethod
    def delete_convalidacion_rule(conn: sqlite3.Connection, convalidacion_id: int) -> int:
        cursor = conn.execute(
            """
            DELETE FROM convalidacion
            WHERE id = ?
            """,
            (convalidacion_id,),
        )
        return int(cursor.rowcount)

    @staticmethod
    def delete_convalidacion_origen(
        conn: sqlite3.Connection,
        convalidacion_id: int,
        modulo_origen_id: int,
    ) -> int:
        cursor = conn.execute(
            """
            DELETE FROM convalidacion_origen
            WHERE conv_id = ? AND id_modulo = ?
            """,
            (convalidacion_id, modulo_origen_id),
        )
        return int(cursor.rowcount)

    @staticmethod
    def create_convalidacion_rule(
        conn: sqlite3.Connection,
        id_modulo_destino: int,
        id_modulos_origen: Sequence[int],
        source_link: Optional[str] = None,
        source_page: Optional[int] = None,
    ) -> dict:
        modulo_destino = conn.execute(
            """
            SELECT id
            FROM modulos
            WHERE id = ?
            """,
            (id_modulo_destino,),
        ).fetchone()
        if not modulo_destino:
            raise ValueError("Módulo destino no encontrado")

        origenes = sorted({int(item) for item in id_modulos_origen if int(item) > 0})
        if not origenes:
            raise ValueError("Debes indicar al menos un módulo de origen")

        placeholders = ",".join(["?"] * len(origenes))
        existentes = conn.execute(
            f"""
            SELECT id
            FROM modulos
            WHERE id IN ({placeholders})
            """,
            origenes,
        ).fetchall()
        existentes_set = {int(row["id"]) for row in existentes}
        faltantes = [id_modulo for id_modulo in origenes if id_modulo not in existentes_set]
        if faltantes:
            faltantes_text = ", ".join(str(x) for x in faltantes)
            raise ValueError(f"Módulos origen no encontrados: {faltantes_text}")

        cursor = conn.execute(
            """
            INSERT INTO convalidacion (source_link, source_page, id_modulo_destino)
            VALUES (?, ?, ?)
            """,
            (source_link, source_page, id_modulo_destino),
        )
        id_convalidacion = int(cursor.lastrowid)

        conn.executemany(
            """
            INSERT INTO convalidacion_origen (conv_id, id_modulo)
            VALUES (?, ?)
            """,
            [(id_convalidacion, id_modulo_origen) for id_modulo_origen in origenes],
        )

        return {
            "id": id_convalidacion,
            "id_modulo_destino": id_modulo_destino,
            "id_modulos_origen": origenes,
        }
