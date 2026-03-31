"""SQLite access layer."""
from __future__ import annotations

import os
import sqlite3
import hashlib
import hmac
import secrets
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
        modulos_aportados: Sequence[object],
        acreditacion_ids: Sequence[int],
        ciclos_completos: Sequence[object],
        target_ciclo_id: int,
    ) -> Sequence[dict]:
        def _parse_int(value: object) -> int | None:
            try:
                return int(value)
            except Exception:
                return None

        def _parse_float(value: object) -> float | None:
            try:
                return float(value) if value is not None else None
            except Exception:
                return None

        def _get_field(item: object, field_name: str) -> object:
            if isinstance(item, dict):
                return item.get(field_name)
            return getattr(item, field_name, None)

        def _normalizar_notas_por_modulo(items: Sequence[object]) -> dict[int, float]:
            notas: dict[int, float] = {}
            for item in items or []:
                id_modulo = _parse_int(_get_field(item, "id_modulo"))
                nota = _parse_float(_get_field(item, "nota"))
                if id_modulo is None or nota is None:
                    continue

                current = notas.get(id_modulo)
                if current is None or nota > current:
                    notas[id_modulo] = nota
            return notas

        def _normalizar_notas_por_ciclo(items: Sequence[object]) -> dict[int, float | None]:
            notas: dict[int, float | None] = {}
            for item in items or []:
                id_ciclo = _parse_int(_get_field(item, "id_ciclo"))
                if id_ciclo is None:
                    continue
                notas[id_ciclo] = _parse_float(_get_field(item, "nota_media"))
            return notas

        def _parse_modulos_origen_ids(raw_ids: object) -> list[int]:
            ids: list[int] = []
            for token in str(raw_ids or "").split(","):
                id_modulo = _parse_int(token.strip())
                if id_modulo is not None:
                    ids.append(id_modulo)
            return ids

        def _calcular_nota_media_regla_por_modulos(regla: dict, notas_modulo: dict[int, float]) -> float | None:
            origen_modulo_ids = _parse_modulos_origen_ids(regla.get("modulos_origen_ids"))
            if not origen_modulo_ids:
                return None

            notas = [notas_modulo.get(id_modulo) for id_modulo in origen_modulo_ids]
            if any(nota is None for nota in notas):
                return None

            notas_validas = [float(nota) for nota in notas if nota is not None]
            return sum(notas_validas) / len(notas_validas)

        def _es_mejor_regla(candidate: dict, current: dict) -> bool:
            current_score = _parse_float(current.get("nota_media_origen"))
            candidate_score = _parse_float(candidate.get("nota_media_origen"))
            current_score_value = current_score if current_score is not None else float("-inf")
            candidate_score_value = candidate_score if candidate_score is not None else float("-inf")

            if candidate_score_value != current_score_value:
                return candidate_score_value > current_score_value

            current_is_ciclo = current.get("id_convalidacion_ciclo") is not None
            candidate_is_ciclo = candidate.get("id_convalidacion_ciclo") is not None
            if candidate_is_ciclo != current_is_ciclo:
                return candidate_is_ciclo

            return False

        # 1. Normalizar entrada del alumno.
        notas_por_modulo = _normalizar_notas_por_modulo(modulos_aportados)
        notas_media_por_ciclo = _normalizar_notas_por_ciclo(ciclos_completos)
        origen_ids = list(dict.fromkeys([*notas_por_modulo.keys(), *acreditacion_ids]))

        resultados_posibles: list[dict] = []

        # 2. Reglas cuyo origen son módulos o acreditaciones externas.
        if origen_ids:
            placeholders = ",".join(["?"] * len(origen_ids))
            query_modulos = f"""
                SELECT
                    conv.id AS id_convalidacion,
                    NULL AS id_convalidacion_ciclo,
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
                  AND COALESCE(m.deprecated, 0) = 0
                GROUP BY conv.id, m.id, m.nombre, c_target.nombre
                HAVING COUNT(DISTINCT co.id_modulo) = (
                    SELECT COUNT(*)
                    FROM convalidacion_origen co_all
                    WHERE co_all.conv_id = conv.id
                )
            """
            params_modulos = [
                CICLO_ACREDITACIONES_EXTERNAS,
                CICLO_ACREDITACIONES_EXTERNAS,
                *origen_ids,
                target_ciclo_id,
            ]
            for row in conn.execute(query_modulos, params_modulos).fetchall():
                item = dict(row)
                item["nota_media_origen"] = _calcular_nota_media_regla_por_modulos(item, notas_por_modulo)
                resultados_posibles.append(item)

        # 3. Reglas cuyo origen es un ciclo completo aportado por el alumno.
        if notas_media_por_ciclo:
            ciclo_ids = list(notas_media_por_ciclo.keys())
            placeholders_ciclos = ",".join(["?"] * len(ciclo_ids))
            query_ciclos = f"""
                SELECT
                    NULL AS id_convalidacion,
                    cc.conv_id_ciclo AS id_convalidacion_ciclo,
                    m.id,
                    m.nombre,
                    c_target.nombre AS ciclo_nombre,
                    'ciclo_completo' AS origen_tipo,
                    c_source.nombre AS source_nombre,
                    NULL AS modulos_origen,
                    NULL AS modulos_origen_ids,
                    cc.id_ciclo_origen
                FROM convalidacion_ciclo cc
                JOIN modulos m ON cc.id_modulo_destino = m.id
                JOIN ciclos c_target ON m.id_ciclo = c_target.id
                JOIN ciclos c_source ON cc.id_ciclo_origen = c_source.id
                WHERE cc.id_ciclo_origen IN ({placeholders_ciclos})
                  AND m.id_ciclo = ?
                  AND COALESCE(m.deprecated, 0) = 0
            """
            params_ciclos = [*ciclo_ids, target_ciclo_id]
            for row in conn.execute(query_ciclos, params_ciclos).fetchall():
                item = dict(row)
                item["nota_media_origen"] = notas_media_por_ciclo.get(int(item["id_ciclo_origen"]))
                item["observaciones"] = "Ciclo completo"
                item.pop("id_ciclo_origen", None)
                resultados_posibles.append(item)

        # 4. De todas las reglas posibles para un mismo módulo destino, nos quedamos con la mejor nota.
        best_by_modulo: dict[int, dict] = {}
        for item in resultados_posibles:
            modulo_id = _parse_int(item.get("id"))
            if modulo_id is None:
                continue

            current = best_by_modulo.get(modulo_id)
            if current is None or _es_mejor_regla(item, current):
                best_by_modulo[modulo_id] = item

        final_results: list[dict] = []
        for item in best_by_modulo.values():
            final_results.append(item)

        return sorted(final_results, key=lambda item: str(item.get("nombre") or "").lower())


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
    def insert_ciclo_aportado(
        conn: sqlite3.Connection,
        id_formulario: int,
        ciclos_detalle: Optional[Sequence[object]] = None,
    ) -> str:
        if not ciclos_detalle:
            return "Sin ciclos aportados para insertar"

        ciclos_insertados: set[int] = set()
        for item in ciclos_detalle:
            id_ciclo = int(getattr(item, "id_ciclo"))
            nota_media_raw = getattr(item, "nota_media", None)

            if id_ciclo in ciclos_insertados:
                continue
            ciclos_insertados.add(id_ciclo)
            nota_media = float(nota_media_raw) if nota_media_raw is not None else None
            conn.execute(
                """
                INSERT INTO formulario_ciclos_aportados (id_formulario, id_ciclo, nota_media)
                VALUES (?, ?, ?)
                """,
                (id_formulario, id_ciclo, nota_media),
            )

        return "Ciclos aportados insertados correctamente"

    @staticmethod
    def insert_formulario_solicitud(
        conn: sqlite3.Connection,
        id_formulario: int,
        solicitudes_registradas: Sequence[object],
        solicitudes_no_registradas: Sequence[str],
    ) -> str:
        for s_regis in solicitudes_registradas:
            id_convalidacion = getattr(s_regis, "id_convalidacion", None)
            id_convalidacion_ciclo = getattr(s_regis, "id_convalidacion_ciclo", None)
            estado_modulo = 1 if (id_convalidacion is not None or id_convalidacion_ciclo is not None) else 0
            conn.execute(
                """
                INSERT INTO formulario_solicitudes (
                    id_formulario,
                    id_modulo_destino,
                    id_convalidacion,
                    id_convalidacion_ciclo,
                    estado_modulo
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    id_formulario,
                    s_regis.id_modulo_destino,
                    id_convalidacion,
                    id_convalidacion_ciclo,
                    estado_modulo,
                ),
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
    _PASSWORD_SCHEME = "pbkdf2_sha256"
    _PASSWORD_ITERATIONS = 200000

    @staticmethod
    def _hash_password(password: str) -> str:
        salt = secrets.token_hex(16)
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            AdminQueries._PASSWORD_ITERATIONS,
        ).hex()
        return f"{AdminQueries._PASSWORD_SCHEME}${AdminQueries._PASSWORD_ITERATIONS}${salt}${digest}"

    @staticmethod
    def _verify_password(password: str, stored_value: str) -> bool:
        if not stored_value:
            return False

        parts = stored_value.split("$")
        if len(parts) == 4 and parts[0] == AdminQueries._PASSWORD_SCHEME:
            _, iterations_raw, salt, digest_hex = parts
            try:
                iterations = int(iterations_raw)
            except ValueError:
                return False
            computed = hashlib.pbkdf2_hmac(
                "sha256",
                password.encode("utf-8"),
                salt.encode("utf-8"),
                iterations,
            ).hex()
            return hmac.compare_digest(computed, digest_hex)
        return False

    @staticmethod
    def authenticate_admin(conn: sqlite3.Connection, nombre: str, password: str) -> Optional[dict]:
        row = conn.execute(
            """
            SELECT id, nombre, password
            FROM administradores
            WHERE nombre = ?
            """,
            (nombre,),
        ).fetchone()
        if not row:
            return None
        if not AdminQueries._verify_password(password, str(row["password"] or "")):
            return None
        return {"id": int(row["id"]), "nombre": str(row["nombre"])}

    @staticmethod
    def get_admin_by_id_nombre(conn: sqlite3.Connection, admin_id: int, nombre: str) -> Optional[dict]:
        row = conn.execute(
            """
            SELECT id, nombre
            FROM administradores
            WHERE id = ? AND nombre = ?
            """,
            (admin_id, nombre),
        ).fetchone()
        return dict(row) if row else None

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
                    fs.id_convalidacion_ciclo,
                    fs.nota_manual,
                    CASE
                        WHEN fs.nota_manual IS NOT NULL THEN fs.nota_manual
                        WHEN fs.id_convalidacion_ciclo IS NOT NULL THEN (
                            SELECT fca.nota_media
                            FROM convalidacion_ciclo cc
                            LEFT JOIN formulario_ciclos_aportados fca
                                ON fca.id_formulario = fs.id_formulario
                               AND fca.id_ciclo = cc.id_ciclo_origen
                            WHERE cc.conv_id_ciclo = fs.id_convalidacion_ciclo
                            LIMIT 1
                        )
                        WHEN fs.id_convalidacion IS NOT NULL THEN (
                            SELECT CASE
                                WHEN COUNT(*) = COUNT(fma_origen.nota) THEN AVG(fma_origen.nota)
                                ELSE NULL
                            END
                            FROM convalidacion_origen co_origen
                            JOIN modulos mo_origen ON mo_origen.id = co_origen.id_modulo
                            LEFT JOIN formulario_modulos_aportados fma_origen
                                ON fma_origen.id_formulario = fs.id_formulario
                               AND fma_origen.id_modulo = co_origen.id_modulo
                            WHERE co_origen.conv_id = fs.id_convalidacion
                              AND mo_origen.numerico = 1
                        )
                        ELSE NULL
                    END AS nota_media_origen,
                    c.id AS ciclo_id,
                    c.nombre AS ciclo_nombre,
                    m.nombre AS modulo_destino,
                    m.id_oficial AS modulo_destino_codigo,
                    CASE
                        WHEN fs.id_convalidacion_ciclo IS NOT NULL THEN (
                            SELECT
                                'Ciclo completo: ' || COALESCE(ccor.nombre, 'Ciclo origen desconocido')
                            FROM convalidacion_ciclo cc
                            LEFT JOIN ciclos ccor ON ccor.id = cc.id_ciclo_origen
                            WHERE cc.conv_id_ciclo = fs.id_convalidacion_ciclo
                        )
                        ELSE (
                        SELECT REPLACE(GROUP_CONCAT(DISTINCT mo.nombre), ',', ', ')
                        FROM convalidacion_origen co
                        JOIN modulos mo ON mo.id = co.id_modulo
                        WHERE co.conv_id = fs.id_convalidacion
                        )
                    END AS convalidado_por,
                    CASE
                        WHEN fs.id_convalidacion_ciclo IS NOT NULL THEN (
                            SELECT CAST(cc.id_ciclo_origen AS TEXT)
                            FROM convalidacion_ciclo cc
                            WHERE cc.conv_id_ciclo = fs.id_convalidacion_ciclo
                        )
                        ELSE (
                        SELECT GROUP_CONCAT(DISTINCT co.id_modulo)
                        FROM convalidacion_origen co
                        WHERE co.conv_id = fs.id_convalidacion
                        )
                    END AS convalidado_por_ids,
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
                CASE
                    WHEN COALESCE(AVG(CASE WHEN mo.numerico = 1 THEN fma.nota END), fs.nota_manual) IS NULL THEN NULL
                    ELSE CAST(
                        COALESCE(AVG(CASE WHEN mo.numerico = 1 THEN fma.nota END), fs.nota_manual) + 0.5
                        AS INTEGER
                    )
                END AS nota_modulo,
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
            SELECT fs.id_formulario, f.estado AS formulario_estado, fs.id_convalidacion,
                   fs.id_convalidacion_ciclo
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
                    WHEN id_convalidacion IS NULL AND id_convalidacion_ciclo IS NULL AND ? = 1 THEN ?
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
            "nota_manual": (
                nota_manual
                if formulario_row["id_convalidacion"] is None and formulario_row["id_convalidacion_ciclo"] is None
                else None
            ),
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
                m.numerico,
                m.deprecated
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
                    "deprecated": modulo["deprecated"],
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

        reglas_modulo = conn.execute(
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
        reglas_ciclo = conn.execute(
            f"""
            SELECT
                cc.conv_id_ciclo,
                cc.source_link,
                cc.source_page,
                md.id AS id_modulo_destino,
                md.nombre AS modulo_destino_nombre,
                md.id_oficial AS modulo_destino_codigo,
                cd.id AS id_ciclo_destino,
                cd.nombre AS ciclo_destino_nombre,
                co.id AS id_ciclo_origen,
                co.nombre AS ciclo_origen_nombre
            FROM convalidacion_ciclo cc
            JOIN modulos md ON md.id = cc.id_modulo_destino
            JOIN ciclos cd ON cd.id = md.id_ciclo
            JOIN ciclos co ON co.id = cc.id_ciclo_origen
            {where_sql}
            ORDER BY cc.conv_id_ciclo DESC
            """,
            params,
        ).fetchall()
        if not reglas_modulo and not reglas_ciclo:
            return []

        origenes_modulo = conn.execute(
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
        for origen in origenes_modulo:
            conv_id = origen["conv_id"]
            origenes_por_regla.setdefault(conv_id, []).append(
                {
                    "id_modulo_origen": origen["id_modulo_origen"],
                    "modulo_origen_nombre": origen["modulo_origen_nombre"],
                    "modulo_origen_codigo": origen["modulo_origen_codigo"],
                    "id_ciclo_origen": origen["id_ciclo_origen"],
                    "ciclo_origen_nombre": origen["ciclo_origen_nombre"],
                    "es_ciclo_completo": False,
                }
            )

        reglas: list[dict] = [
            {
                "id": regla["id"],
                "tipo_regla": "modulo",
                "source_link": regla["source_link"],
                "source_page": regla["source_page"],
                "id_modulo_destino": regla["id_modulo_destino"],
                "modulo_destino_nombre": regla["modulo_destino_nombre"],
                "modulo_destino_codigo": regla["modulo_destino_codigo"],
                "id_ciclo_destino": regla["id_ciclo_destino"],
                "ciclo_destino_nombre": regla["ciclo_destino_nombre"],
                "id_convalidacion_ciclo": None,
                "origenes": origenes_por_regla.get(regla["id"], []),
            }
            for regla in reglas_modulo
        ]
        reglas.extend(
            {
                "id": -int(regla["conv_id_ciclo"]),
                "tipo_regla": "ciclo",
                "source_link": regla["source_link"],
                "source_page": regla["source_page"],
                "id_modulo_destino": regla["id_modulo_destino"],
                "modulo_destino_nombre": regla["modulo_destino_nombre"],
                "modulo_destino_codigo": regla["modulo_destino_codigo"],
                "id_ciclo_destino": regla["id_ciclo_destino"],
                "ciclo_destino_nombre": regla["ciclo_destino_nombre"],
                "id_convalidacion_ciclo": int(regla["conv_id_ciclo"]),
                "origenes": [
                    {
                        "id_modulo_origen": None,
                        "modulo_origen_nombre": None,
                        "modulo_origen_codigo": None,
                        "id_ciclo_origen": regla["id_ciclo_origen"],
                        "ciclo_origen_nombre": regla["ciclo_origen_nombre"],
                        "es_ciclo_completo": True,
                    }
                ],
            }
            for regla in reglas_ciclo
        )
        reglas.sort(
            key=lambda item: int(item["id_convalidacion_ciclo"] or item["id"]),
            reverse=True,
        )
        return reglas

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

    @staticmethod
    def create_admin_user(conn: sqlite3.Connection, nombre: str, password: str) -> dict:
        created_at = datetime.now(timezone.utc).isoformat()
        password_hash = AdminQueries._hash_password(password)
        cursor = conn.execute(
            """
            INSERT INTO administradores (nombre, password, created_at)
            VALUES (?, ?, ?)
            """,
            (nombre, password_hash, created_at),
        )
        admin_id = int(cursor.lastrowid)
        return admin_id, created_at

    @staticmethod
    def update_admin_user(
        conn: sqlite3.Connection,
        admin_id: int,
        nombre: Optional[str] = None,
        password: Optional[str] = None,
    ) -> int:
        updates: list[str] = []
        params: list[object] = []

        if nombre is not None:
            updates.append("nombre = ?")
            params.append(nombre)
        if password is not None:
            updates.append("password = ?")
            params.append(AdminQueries._hash_password(password))

        if not updates:
            return 0

        params.append(admin_id)
        cursor = conn.execute(
            f"""
            UPDATE administradores
            SET {", ".join(updates)}
            WHERE id = ?
            """,
            params,
        )
        return int(cursor.rowcount)

    @staticmethod
    def delete_admin_user(conn: sqlite3.Connection, admin_id: int) -> int:
        cursor = conn.execute(
            """
            DELETE FROM administradores
            WHERE id = ?
            """,
            (admin_id,),
        )
        return int(cursor.rowcount)

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
    def delete_convalidacion_ciclo_rule(conn: sqlite3.Connection, convalidacion_ciclo_id: int) -> int:
        cursor = conn.execute(
            """
            DELETE FROM convalidacion_ciclo
            WHERE conv_id_ciclo = ?
            """,
            (convalidacion_ciclo_id,),
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

        origenes = sorted({int(item) for item in id_modulos_origen if int(item) > 0})
        if not origenes:
            raise ValueError("Debes indicar al menos un módulo de origen")

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

    @staticmethod
    def create_convalidacion_ciclo_rule(
        conn: sqlite3.Connection,
        id_modulo_destino: int,
        id_ciclo_origen: int,
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

        ciclo_origen = conn.execute(
            """
            SELECT id
            FROM ciclos
            WHERE id = ?
            """,
            (id_ciclo_origen,),
        ).fetchone()
        if not ciclo_origen:
            raise ValueError("Ciclo origen no encontrado")

        existente = conn.execute(
            """
            SELECT conv_id_ciclo
            FROM convalidacion_ciclo
            WHERE id_modulo_destino = ? AND id_ciclo_origen = ?
            """,
            (id_modulo_destino, id_ciclo_origen),
        ).fetchone()
        if existente:
            raise ValueError("Ya existe una regla de convalidación para ese módulo destino y ciclo origen")

        cursor = conn.execute(
            """
            INSERT INTO convalidacion_ciclo (source_link, source_page, id_modulo_destino, id_ciclo_origen)
            VALUES (?, ?, ?, ?)
            """,
            (source_link, source_page, id_modulo_destino, id_ciclo_origen),
        )

        return {
            "id": int(cursor.lastrowid),
            "id_modulo_destino": id_modulo_destino,
            "id_ciclo_origen": id_ciclo_origen,
        }

    @staticmethod
    def create_convalidacion_rules_batch(
        conn: sqlite3.Connection,
        reglas: Sequence[dict],
        source_link: Optional[str] = None,
        source_page: Optional[int] = None,
    ) -> dict:
        normalizadas: list[tuple[int, int]] = []
        seen: set[tuple[int, int]] = set()
        skipped = 0

        for regla in reglas:
            id_modulo_destino = int(regla["id_modulo_destino"])
            id_modulo_origen = int(regla["id_modulo_origen"])
            if id_modulo_destino <= 0 or id_modulo_origen <= 0:
                raise ValueError("Los módulos origen y destino son obligatorios")
            if id_modulo_destino == id_modulo_origen:
                skipped += 1
                continue
            key = (id_modulo_destino, id_modulo_origen)
            if key in seen:
                skipped += 1
                continue
            seen.add(key)
            normalizadas.append(key)

        if not normalizadas:
            return {
                "created": [],
                "created_count": 0,
                "skipped_count": skipped,
            }

        modulo_ids = sorted({item for pair in normalizadas for item in pair})

        placeholders = ",".join(["?"] * len(modulo_ids))
        pares_existentes_rows = conn.execute(
            f"""
            SELECT c.id_modulo_destino AS id_modulo_destino, co.id_modulo AS id_modulo_origen
            FROM convalidacion c
            JOIN convalidacion_origen co ON co.conv_id = c.id
            WHERE c.id_modulo_destino IN ({placeholders})
              AND co.id_modulo IN ({placeholders})
            """,
            [*modulo_ids, *modulo_ids],
        ).fetchall()
        pares_existentes = {
            (int(row["id_modulo_destino"]), int(row["id_modulo_origen"]))
            for row in pares_existentes_rows
        }

        created: list[dict] = []
        skipped_existing = 0
        for id_modulo_destino, id_modulo_origen in normalizadas:
            if (id_modulo_destino, id_modulo_origen) in pares_existentes:
                skipped_existing += 1
                continue
            created.append(
                AdminQueries.create_convalidacion_rule(
                    conn,
                    id_modulo_destino=id_modulo_destino,
                    id_modulos_origen=[id_modulo_origen],
                    source_link=source_link,
                    source_page=source_page,
                )
            )

        return {
            "created": created,
            "created_count": len(created),
            "skipped_count": skipped + skipped_existing,
            "skipped_existing_count": skipped_existing,
        }

    @staticmethod
    def create_convalidacion_ciclo_rules_batch(
        conn: sqlite3.Connection,
        reglas: Sequence[dict],
        source_link: Optional[str] = None,
        source_page: Optional[int] = None,
    ) -> dict:
        normalizadas: list[tuple[int, int]] = []
        seen: set[tuple[int, int]] = set()
        skipped = 0

        for regla in reglas:
            id_modulo_destino = int(regla["id_modulo_destino"])
            id_ciclo_origen = int(regla["id_ciclo_origen"])
            key = (id_modulo_destino, id_ciclo_origen)
            normalizadas.append(key)

        if not normalizadas:
            return {
                "created": [],
                "created_count": 0,
                "skipped_count": skipped,
            }

        created: list[dict] = []
        skipped_existing = 0
        for id_modulo_destino, id_ciclo_origen in normalizadas:
            try:
                created.append(
                    AdminQueries.create_convalidacion_ciclo_rule(
                        conn,
                        id_modulo_destino=id_modulo_destino,
                        id_ciclo_origen=id_ciclo_origen,
                        source_link=source_link,
                        source_page=source_page,
                    )
                )
            except ValueError as exc:
                if "Ya existe una regla de convalidación" not in str(exc):
                    raise
                skipped_existing += 1

        return {
            "created": created,
            "created_count": len(created),
            "skipped_count": skipped + skipped_existing,
            "skipped_existing_count": skipped_existing,
        }

    @staticmethod
    def delete_convalidacion_rules_batch(
        conn: sqlite3.Connection,
        reglas: Sequence[dict],
    ) -> dict:
        normalizadas: list[tuple[int, int]] = []
        skipped_invalid = 0

        for regla in reglas:
            id_modulo_destino = int(regla["id_modulo_destino"])
            id_modulo_origen = int(regla["id_modulo_origen"])
            key = (id_modulo_destino, id_modulo_origen)
            normalizadas.append(key)

        if not normalizadas:
            return {
                "deleted_count": 0,
                "skipped_count": skipped_invalid,
                "skipped_missing_count": 0,
            }

        temp_table = "temp_requested_convalidacion_rules"

        conn.execute(f"DROP TABLE IF EXISTS {temp_table}")
        conn.execute(
            f"""
            CREATE TEMP TABLE {temp_table} (
                id_modulo_destino INTEGER NOT NULL,
                id_modulo_origen INTEGER NOT NULL,
                PRIMARY KEY (id_modulo_destino, id_modulo_origen)
            )
            """
        )

        try:
            conn.executemany(
                """
                INSERT OR IGNORE INTO temp_requested_convalidacion_rules (
                    id_modulo_destino,
                    id_modulo_origen
                )
                VALUES (?, ?)
                """,
                normalizadas,
            )

            matched_pairs_row = conn.execute(
                f"""
                SELECT COUNT(*) AS total
                FROM {temp_table} requested
                WHERE EXISTS (
                    SELECT 1
                    FROM convalidacion c
                    JOIN convalidacion_origen co ON co.conv_id = c.id
                    WHERE c.id_modulo_destino = requested.id_modulo_destino
                      AND co.id_modulo = requested.id_modulo_origen
                )
                """
            ).fetchone()
            matched_pairs_count = int(matched_pairs_row["total"]) if matched_pairs_row else 0

            deleted_cursor = conn.execute(
                f"""
                DELETE FROM convalidacion
                WHERE id IN (
                    SELECT DISTINCT c.id
                    FROM convalidacion c
                    JOIN convalidacion_origen co ON co.conv_id = c.id
                    JOIN {temp_table} requested
                      ON requested.id_modulo_destino = c.id_modulo_destino
                     AND requested.id_modulo_origen = co.id_modulo
                )
                """
            )
            deleted_count = int(deleted_cursor.rowcount)

            return {
                "deleted_count": deleted_count,
                "skipped_count": skipped_invalid + max(len(set(normalizadas)) - matched_pairs_count, 0),
                "skipped_missing_count": max(len(set(normalizadas)) - matched_pairs_count, 0),
            }
        finally:
            conn.execute(f"DROP TABLE IF EXISTS {temp_table}")

    @staticmethod
    def delete_convalidacion_ciclo_rules_batch(
        conn: sqlite3.Connection,
        reglas: Sequence[dict],
    ) -> dict:
        normalizadas = [(int(regla["id_modulo_destino"]), int(regla["id_ciclo_origen"])) for regla in reglas]
        if not normalizadas:
            return {
                "deleted_count": 0,
                "skipped_count": 0,
                "skipped_missing_count": 0,
            }

        deleted_count = 0
        skipped_missing = 0
        seen: set[tuple[int, int]] = set()

        for id_modulo_destino, id_ciclo_origen in normalizadas:
            if id_modulo_destino <= 0 or id_ciclo_origen <= 0 or (id_modulo_destino, id_ciclo_origen) in seen:
                skipped_missing += 1
                continue
            seen.add((id_modulo_destino, id_ciclo_origen))
            row = conn.execute(
                """
                SELECT conv_id_ciclo
                FROM convalidacion_ciclo
                WHERE id_modulo_destino = ? AND id_ciclo_origen = ?
                """,
                (id_modulo_destino, id_ciclo_origen),
            ).fetchone()
            if not row:
                skipped_missing += 1
                continue
            deleted_count += AdminQueries.delete_convalidacion_ciclo_rule(conn, int(row["conv_id_ciclo"]))

        return {
            "deleted_count": deleted_count,
            "skipped_count": skipped_missing,
            "skipped_missing_count": skipped_missing,
        }
