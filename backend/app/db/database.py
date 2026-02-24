"""SQLite access layer for Somorrostro Convalidaciones.

This module encapsulates all DB interactions for:
- Catalog management (grados/familias/ciclos/modulos)
- Convalidaciones management
- Formularios (create/list/get_detalle/change_status)
- Convalidacion lookup by origin and destination modules
"""
from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
import json
from pathlib import Path
import hashlib
import hmac
import os
import secrets
import sqlite3
from typing import Any, Iterable, Literal, Optional, Sequence


DEFAULT_DB_PATH = Path(os.getenv("DB_PATH", "data/somo.db"))
DEFAULT_SCHEMA_PATH = Path(__file__).resolve().parents[2] / "scripts" / "schema.sql"

FormularioEstado = Literal["BORRADOR", "ENVIADO", "A_REVISAR", "APROBADO", "RECHAZADO"]
RuleMode = Literal["ALL", "ANY"]

FORMULARIO_ESTADOS: set[str] = {"BORRADOR", "ENVIADO", "A_REVISAR", "APROBADO", "RECHAZADO"}
FORMULARIO_STATUS_TRANSITIONS: dict[str, set[str]] = {
    "BORRADOR": {"ENVIADO", "A_REVISAR"},
    "ENVIADO": {"A_REVISAR", "APROBADO", "RECHAZADO"},
    "A_REVISAR": {"APROBADO", "RECHAZADO"},
    "APROBADO": set(),
    "RECHAZADO": {"A_REVISAR"},
}
RULE_MODES: set[str] = {"ALL", "ANY"}
USER_ROLES: set[str] = {"ALUMNO", "ADMIN"}


@dataclass(frozen=True)
class DBConfig:
    path: Path = DEFAULT_DB_PATH
    schema_path: Path = DEFAULT_SCHEMA_PATH
    timeout: float = 30.0


# Genera la fecha y hora actual en UTC en formato ISO.
def _utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# Valida que un texto obligatorio no venga vacio.
def _require_non_empty(value: str, field_name: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError(f"`{field_name}` cannot be empty.")
    return cleaned


# Normaliza los parametros de paginacion limit y offset.
def _normalize_limit_offset(limit: int, offset: int) -> tuple[int, int]:
    normalized_limit = max(1, min(limit, 500))
    normalized_offset = max(0, offset)
    return normalized_limit, normalized_offset


# Normaliza texto de busqueda para consultas de catalogo.
def _normalize_search_term(search: Optional[str]) -> Optional[str]:
    if search is None:
        return None
    cleaned = search.strip()
    return cleaned if cleaned else None


# Normaliza, deduplica y ordena identificadores de modulos.
def _normalize_module_ids(ids: Iterable[int]) -> list[int]:
    normalized: set[int] = set()
    for module_id in ids:
        normalized.add(int(module_id))
    return sorted(normalized)


# Valida que el modo de regla sea uno permitido.
def _assert_rule_mode(rule_mode: str) -> str:
    if rule_mode not in RULE_MODES:
        raise ValueError(f"Invalid rule_mode '{rule_mode}'. Allowed: {sorted(RULE_MODES)}")
    return rule_mode


# Valida que el estado del formulario sea valido.
def _assert_formulario_estado(estado: str) -> str:
    if estado not in FORMULARIO_ESTADOS:
        raise ValueError(
            f"Invalid formulario estado '{estado}'. Allowed: {sorted(FORMULARIO_ESTADOS)}"
        )
    return estado


# Valida que el cambio de estado del formulario sea permitido.
def _assert_formulario_transition(from_estado: str, to_estado: str) -> None:
    if from_estado == to_estado:
        return
    allowed = FORMULARIO_STATUS_TRANSITIONS.get(from_estado, set())
    if to_estado not in allowed:
        raise ValueError(f"Invalid transition '{from_estado}' -> '{to_estado}'.")


# Valida que el rol de usuario sea uno permitido.
def _assert_usuario_rol(rol: str) -> str:
    if rol not in USER_ROLES:
        raise ValueError(f"Invalid usuario rol '{rol}'. Allowed: {sorted(USER_ROLES)}")
    return rol


# Genera un hash de contraseña usando scrypt con salt aleatorio.
def _hash_password(password: str) -> str:
    password = _require_non_empty(password, "password")
    n = 2**14
    r = 8
    p = 1
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=n,
        r=r,
        p=p,
        dklen=64,
    )
    return f"scrypt${n}${r}${p}${salt.hex()}${digest.hex()}"


# Verifica una contraseña en claro contra su hash almacenado.
def _verify_password(password: str, password_hash: str) -> bool:
    try:
        algo, n_raw, r_raw, p_raw, salt_hex, digest_hex = password_hash.split("$", 5)
        if algo != "scrypt":
            return False
        n = int(n_raw)
        r = int(r_raw)
        p = int(p_raw)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
    except (ValueError, TypeError):
        return False

    try:
        candidate = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=n,
            r=r,
            p=p,
            dklen=len(expected),
        )
    except ValueError:
        return False

    return hmac.compare_digest(candidate, expected)


# Asegura la columna de autenticacion de usuarios para compatibilidad con DB antiguas.
def _ensure_usuarios_auth_schema(conn: sqlite3.Connection) -> None:
    table = conn.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'usuarios'"
    ).fetchone()
    if table is None:
        return

    columns = {
        str(row["name"]).lower()
        for row in conn.execute("PRAGMA table_info(usuarios)").fetchall()
    }
    if "password_hash" not in columns:
        conn.execute("ALTER TABLE usuarios ADD COLUMN password_hash TEXT")
        conn.commit()


# Ejecuta un bloque de escritura dentro de una transaccion segura.
@contextmanager
def transaction(conn: sqlite3.Connection):
    """Wrap several writes in a single transaction.

    This supports nested usage safely by only opening/closing when needed.
    """
    started = not conn.in_transaction
    try:
        if started:
            conn.execute("BEGIN")
        yield
        if started:
            conn.commit()
    except Exception:
        if started:
            conn.rollback()
        raise


# Abre una conexion SQLite configurada para el proyecto.
def connect(config: DBConfig) -> sqlite3.Connection:
    """Return a SQLite connection with sane defaults."""
    config.path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(config.path), timeout=config.timeout)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    _ensure_usuarios_auth_schema(conn)
    return conn


# Cierra la conexion activa con la base de datos.
def close(conn: sqlite3.Connection) -> None:
    conn.close()


# Comprueba conectividad y metadatos basicos de la base de datos.
def healthcheck(conn: sqlite3.Connection) -> dict[str, Any]:
    row = conn.execute("SELECT 1 AS ok, sqlite_version() AS sqlite_version").fetchone()
    db_file = conn.execute("PRAGMA database_list").fetchone()
    return {
        "ok": bool(row["ok"]),
        "sqlite_version": row["sqlite_version"],
        "database_file": db_file["file"] if db_file else None,
    }


# Inicializa la base de datos aplicando el esquema SQL.
def init_db(config: DBConfig) -> None:
    """Create database file and apply schema.sql."""
    if not config.schema_path.exists():
        raise FileNotFoundError(f"Schema file not found: {config.schema_path}")

    schema_sql = config.schema_path.read_text(encoding="utf-8")
    with connect(config) as conn:
        conn.executescript(schema_sql)
        conn.commit()


# Limpia el catalogo completo eliminando grados en cascada.
def clear_catalog(conn: sqlite3.Connection) -> None:
    conn.execute("DELETE FROM grados")
    conn.commit()


# ---------------------------------------------------------------------------
# Catalogo Academico
# ---------------------------------------------------------------------------
# Crea un nuevo grado del catalogo.
def create_grado(conn: sqlite3.Connection, nombre: str) -> int:
    nombre = _require_non_empty(nombre, "nombre")
    cur = conn.execute(
        """
        INSERT INTO grados (nombre)
        VALUES (?)
        """,
        (nombre,),
    )
    conn.commit()
    return int(cur.lastrowid)


# Crea una nueva familia asociada a un grado.
def create_familia(conn: sqlite3.Connection, nombre: str, id_grado: int) -> int:
    nombre = _require_non_empty(nombre, "nombre")
    cur = conn.execute(
        """
        INSERT INTO familias (nombre, id_grado)
        VALUES (?, ?)
        """,
        (nombre, int(id_grado)),
    )
    conn.commit()
    return int(cur.lastrowid)


# Crea un nuevo ciclo asociado a una familia.
def create_ciclo(
    conn: sqlite3.Connection,
    nombre: str,
    id_familia: int,
    *,
    titulo: Optional[str] = None,
    id_oficial: Optional[str] = None,
    normativa: Optional[str] = None,
) -> int:
    nombre = _require_non_empty(nombre, "nombre")
    cur = conn.execute(
        """
        INSERT INTO ciclos (nombre, titulo, id_oficial, normativa, id_familia)
        VALUES (?, ?, ?, ?, ?)
        """,
        (nombre, titulo, id_oficial, normativa, int(id_familia)),
    )
    conn.commit()
    return int(cur.lastrowid)


# Crea un nuevo modulo asociado a un ciclo.
def create_modulo(
    conn: sqlite3.Connection,
    nombre: str,
    id_ciclo: int,
    *,
    id_oficial: Optional[str] = None,
) -> int:
    nombre = _require_non_empty(nombre, "nombre")
    cur = conn.execute(
        """
        INSERT INTO modulos (nombre, id_oficial, id_ciclo)
        VALUES (?, ?, ?)
        """,
        (nombre, id_oficial, int(id_ciclo)),
    )
    conn.commit()
    return int(cur.lastrowid)


# Busca en catalogo academico y, opcionalmente, destinos convalidables por modulo origen.
def get_catalog_entity(
    conn: sqlite3.Connection,
    search: Optional[str] = None,
    *,
    id_modulo_origen: Optional[int] = None,
    limit: int = 100,
    offset: int = 0,
) -> Sequence[sqlite3.Row]:
    search = _normalize_search_term(search)
    limit, offset = _normalize_limit_offset(limit, offset)

    if id_modulo_origen is not None:
        params: list[Any] = [int(id_modulo_origen)]
        where_parts = ["co.id_modulo = ?"]
        if search is not None:
            like = f"%{search}%"
            where_parts.append("(md.nombre LIKE ? OR md.id_oficial LIKE ?)")
            params.extend([like, like])

        query = f"""
            SELECT
                'modulo_destino' AS entity,
                md.id AS entity_id,
                md.nombre AS nombre,
                g.id AS id_grado,
                g.nombre AS grado_nombre,
                f.id AS id_familia,
                f.nombre AS familia_nombre,
                c.id AS id_ciclo,
                c.nombre AS ciclo_nombre,
                md.id_oficial AS id_oficial,
                c.normativa AS normativa,
                COUNT(DISTINCT cv.id) AS rules_count
            FROM convalidacion_origen co
            JOIN convalidacion cv ON cv.id = co.conv_id
            JOIN modulos md ON md.id = cv.id_modulo_destino
            JOIN ciclos c ON c.id = md.id_ciclo
            JOIN familias f ON f.id = c.id_familia
            JOIN grados g ON g.id = f.id_grado
            WHERE {' AND '.join(where_parts)}
            GROUP BY
                md.id, md.nombre, g.id, g.nombre, f.id, f.nombre,
                c.id, c.nombre, md.id_oficial, c.normativa
            ORDER BY md.nombre COLLATE NOCASE ASC
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        return conn.execute(query, tuple(params)).fetchall()

    if search is None:
        query = """
            SELECT * FROM (
                SELECT
                    'grado' AS entity,
                    g.id AS entity_id,
                    g.nombre AS nombre,
                    g.id AS id_grado,
                    g.nombre AS grado_nombre,
                    NULL AS id_familia,
                    NULL AS familia_nombre,
                    NULL AS id_ciclo,
                    NULL AS ciclo_nombre,
                    NULL AS id_oficial,
                    NULL AS normativa,
                    NULL AS rules_count
                FROM grados g
                UNION ALL
                SELECT
                    'familia' AS entity,
                    f.id AS entity_id,
                    f.nombre AS nombre,
                    g.id AS id_grado,
                    g.nombre AS grado_nombre,
                    f.id AS id_familia,
                    f.nombre AS familia_nombre,
                    NULL AS id_ciclo,
                    NULL AS ciclo_nombre,
                    NULL AS id_oficial,
                    NULL AS normativa,
                    NULL AS rules_count
                FROM familias f
                JOIN grados g ON g.id = f.id_grado
                UNION ALL
                SELECT
                    'ciclo' AS entity,
                    c.id AS entity_id,
                    c.nombre AS nombre,
                    g.id AS id_grado,
                    g.nombre AS grado_nombre,
                    f.id AS id_familia,
                    f.nombre AS familia_nombre,
                    c.id AS id_ciclo,
                    c.nombre AS ciclo_nombre,
                    c.id_oficial AS id_oficial,
                    c.normativa AS normativa,
                    NULL AS rules_count
                FROM ciclos c
                JOIN familias f ON f.id = c.id_familia
                JOIN grados g ON g.id = f.id_grado
            )
            ORDER BY nombre COLLATE NOCASE ASC, entity ASC
            LIMIT ? OFFSET ?
        """
        return conn.execute(query, (limit, offset)).fetchall()

    like = f"%{search}%"
    query = """
        SELECT * FROM (
            SELECT
                'grado' AS entity,
                g.id AS entity_id,
                g.nombre AS nombre,
                g.id AS id_grado,
                g.nombre AS grado_nombre,
                NULL AS id_familia,
                NULL AS familia_nombre,
                NULL AS id_ciclo,
                NULL AS ciclo_nombre,
                NULL AS id_oficial,
                NULL AS normativa,
                NULL AS rules_count
            FROM grados g
            WHERE g.nombre LIKE ?
            UNION ALL
            SELECT
                'familia' AS entity,
                f.id AS entity_id,
                f.nombre AS nombre,
                g.id AS id_grado,
                g.nombre AS grado_nombre,
                f.id AS id_familia,
                f.nombre AS familia_nombre,
                NULL AS id_ciclo,
                NULL AS ciclo_nombre,
                NULL AS id_oficial,
                NULL AS normativa,
                NULL AS rules_count
            FROM familias f
            JOIN grados g ON g.id = f.id_grado
            WHERE f.nombre LIKE ?
            UNION ALL
            SELECT
                'ciclo' AS entity,
                c.id AS entity_id,
                c.nombre AS nombre,
                g.id AS id_grado,
                g.nombre AS grado_nombre,
                f.id AS id_familia,
                f.nombre AS familia_nombre,
                c.id AS id_ciclo,
                c.nombre AS ciclo_nombre,
                c.id_oficial AS id_oficial,
                c.normativa AS normativa,
                NULL AS rules_count
            FROM ciclos c
            JOIN familias f ON f.id = c.id_familia
            JOIN grados g ON g.id = f.id_grado
            WHERE c.nombre LIKE ? OR c.id_oficial LIKE ?
        )
        ORDER BY nombre COLLATE NOCASE ASC, entity ASC
        LIMIT ? OFFSET ?
    """
    return conn.execute(query, (like, like, like, like, limit, offset)).fetchall()


# ---------------------------------------------------------------------------
# Convalidaciones (alta, consulta y listado por origen/destino)
# ---------------------------------------------------------------------------
# Limpia todas las convalidaciones y sus modulos origen.
def clear_convalidaciones(conn: sqlite3.Connection) -> None:
    conn.execute("DELETE FROM convalidacion_origen")
    conn.execute("DELETE FROM convalidacion")
    conn.commit()


# Crea una regla de convalidacion y registra sus modulos de origen.
def create_convalidacion(
    conn: sqlite3.Connection,
    id_modulo_destino: int,
    source_link: Optional[str],
    source_page: Optional[int],
    origen_modulos: Iterable[int],
    *,
    rule_mode: RuleMode = "ALL",
    source_doc: Optional[str] = None,
    source_anexo: Optional[int] = None,
) -> int:
    """Create convalidacion and its origin-module relations."""
    rule_mode = _assert_rule_mode(rule_mode)
    origin_ids = _normalize_module_ids(origen_modulos)
    if not origin_ids:
        raise ValueError("`origen_modulos` must include at least one module id.")

    with transaction(conn):
        cur = conn.execute(
            """
            INSERT INTO convalidacion (
                source_link, source_page, source_doc, source_anexo, rule_mode, id_modulo_destino
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (source_link, source_page, source_doc, source_anexo, rule_mode, id_modulo_destino),
        )
        conv_id = int(cur.lastrowid)

        conn.executemany(
            "INSERT INTO convalidacion_origen (conv_id, id_modulo) VALUES (?, ?)",
            [(conv_id, module_id) for module_id in origin_ids],
        )
    return conv_id


# Obtiene una convalidacion por su identificador.
def get_convalidacion(conn: sqlite3.Connection, conv_id: int) -> Optional[sqlite3.Row]:
    return conn.execute("SELECT * FROM convalidacion WHERE id = ?", (conv_id,)).fetchone()


# Lista reglas de convalidacion filtradas por modulo origen y modulo destino.
def list_convalidaciones_by_origen_destino(
    conn: sqlite3.Connection,
    id_modulo_origen: int,
    id_modulo_destino: int,
) -> Sequence[sqlite3.Row]:
    return conn.execute(
        """
        SELECT
            c.*,
            md.nombre AS modulo_destino_nombre,
            COUNT(DISTINCT co_all.id_modulo) AS origen_count
        FROM convalidacion c
        JOIN convalidacion_origen co_match
            ON co_match.conv_id = c.id
           AND co_match.id_modulo = ?
        JOIN modulos md ON md.id = c.id_modulo_destino
        LEFT JOIN convalidacion_origen co_all ON co_all.conv_id = c.id
        WHERE c.id_modulo_destino = ?
        GROUP BY c.id, md.nombre
        ORDER BY c.id ASC
        """,
        (int(id_modulo_origen), int(id_modulo_destino)),
    ).fetchall()


# TODO: update_convalidacion pendiente de definicion funcional.
# Se implementara cuando se confirme el caso de uso y su comportamiento exacto.
# Firma prevista:
# def update_convalidacion(
#     conn: sqlite3.Connection,
#     conv_id: int,
#     id_modulo_destino: int,
#     source_link: Optional[str],
#     source_page: Optional[int],
#     *,
#     rule_mode: RuleMode = "ALL",
#     source_doc: Optional[str] = None,
#     source_anexo: Optional[int] = None,
# ) -> bool:


# ---------------------------------------------------------------------------
# Usuarios (alta + login admin)
# ---------------------------------------------------------------------------
# Crea un nuevo registro de usuario.
def create_usuario(
    conn: sqlite3.Connection,
    nombre: str,
    email: str,
    rol: Literal["ALUMNO", "ADMIN"] = "ALUMNO",
    *,
    password: Optional[str] = None,
) -> int:
    nombre = _require_non_empty(nombre, "nombre")
    email = _require_non_empty(email, "email").lower()
    rol = _assert_usuario_rol(_require_non_empty(rol, "rol").upper())
    if rol == "ADMIN":
        if password is None:
            raise ValueError("`password` is required when rol is 'ADMIN'.")
        password_hash = _hash_password(password)
    else:
        if password is not None:
            raise ValueError("`password` is only allowed when rol is 'ADMIN'.")
        password_hash = None

    cur = conn.execute(
        "INSERT INTO usuarios (nombre, email, rol, password_hash) VALUES (?, ?, ?, ?)",
        (nombre, email, rol, password_hash),
    )
    conn.commit()
    return int(cur.lastrowid)


# Inicia sesion de administrador validando email y contraseña.
def login_admin(
    conn: sqlite3.Connection,
    email: str,
    password: str,
) -> Optional[sqlite3.Row]:
    email = _require_non_empty(email, "email").lower()
    password = _require_non_empty(password, "password")
    row = conn.execute(
        """
        SELECT id, nombre, email, rol, created_at, updated_at, password_hash
        FROM usuarios
        WHERE email = ? AND rol = 'ADMIN'
        """,
        (email,),
    ).fetchone()
    if row is None:
        return None

    stored_hash = row["password_hash"]
    if stored_hash is None:
        return None
    if not _verify_password(password, str(stored_hash)):
        return None

    return conn.execute(
        """
        SELECT id, nombre, email, rol, created_at, updated_at
        FROM usuarios
        WHERE id = ?
        """,
        (int(row["id"]),),
    ).fetchone()


# ---------------------------------------------------------------------------
# Formularios (create/list/get_detalle/change_status)
# ---------------------------------------------------------------------------
# Crea un nuevo formulario para un alumno.
def create_formulario(
    conn: sqlite3.Connection,
    id_alumno: int,
    estado: FormularioEstado = "BORRADOR",
    anotaciones: Optional[str] = None,
) -> int:
    estado = _assert_formulario_estado(estado)
    enviado_at = _utc_now() if estado != "BORRADOR" else None

    cur = conn.execute(
        """
        INSERT INTO formularios (id_alumno, estado, enviado_at, anotaciones)
        VALUES (?, ?, ?, ?)
        """,
        (id_alumno, estado, enviado_at, anotaciones),
    )
    conn.commit()
    return int(cur.lastrowid)


# Lista registros de formularios con los filtros disponibles.
def list_formularios(
    conn: sqlite3.Connection,
    id_alumno: Optional[int] = None,
    estado: Optional[FormularioEstado] = None,
    limit: int = 100,
    offset: int = 0,
) -> Sequence[sqlite3.Row]:
    limit, offset = _normalize_limit_offset(limit, offset)
    params: list[Any] = []
    where_parts: list[str] = []

    if id_alumno is not None:
        where_parts.append("f.id_alumno = ?")
        params.append(id_alumno)
    if estado is not None:
        _assert_formulario_estado(estado)
        where_parts.append("f.estado = ?")
        params.append(estado)

    where_clause = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""
    query = f"""
        SELECT
            f.*, u.nombre AS alumno_nombre, u.email AS alumno_email
        FROM formularios f
        JOIN usuarios u ON u.id = f.id_alumno
        {where_clause}
        ORDER BY f.created_at DESC
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])
    return conn.execute(query, tuple(params)).fetchall()


# Obtiene el detalle consolidado de un formulario en una sola consulta.
def get_formulario_detalle(
    conn: sqlite3.Connection,
    formulario_id: int,
) -> Optional[dict[str, Any]]:
    try:
        row = conn.execute(
            """
            SELECT
                f.*,
                u.nombre AS alumno_nombre,
                u.email AS alumno_email,
                uv.nombre AS validador_nombre,
                uv.email AS validador_email,
                COALESCE((
                    SELECT json_group_array(
                        json_object(
                            'id', s.id,
                            'id_formulario', s.id_formulario,
                            'id_modulo', s.id_modulo,
                            'id_convalidacion', s.id_convalidacion,
                            'descripcion', s.descripcion,
                            'estado_evaluacion', s.estado_evaluacion,
                            'created_at', s.created_at,
                            'updated_at', s.updated_at,
                            'modulo_destino_nombre', s.modulo_destino_nombre
                        )
                    )
                    FROM (
                        SELECT
                            fs.id,
                            fs.id_formulario,
                            fs.id_modulo,
                            fs.id_convalidacion,
                            fs.descripcion,
                            fs.estado_evaluacion,
                            fs.created_at,
                            fs.updated_at,
                            m.nombre AS modulo_destino_nombre
                        FROM formulario_solicitudes fs
                        LEFT JOIN modulos m ON m.id = fs.id_modulo
                        WHERE fs.id_formulario = f.id
                        ORDER BY fs.id ASC
                    ) s
                ), '[]') AS solicitudes_json,
                COALESCE((
                    SELECT json_group_array(
                        json_object(
                            'id', ma.id,
                            'id_formulario', ma.id_formulario,
                            'id_modulo', ma.id_modulo,
                            'descripcion', ma.descripcion,
                            'created_at', ma.created_at,
                            'updated_at', ma.updated_at,
                            'modulo_nombre', ma.modulo_nombre
                        )
                    )
                    FROM (
                        SELECT
                            fma.id,
                            fma.id_formulario,
                            fma.id_modulo,
                            fma.descripcion,
                            fma.created_at,
                            fma.updated_at,
                            m.nombre AS modulo_nombre
                        FROM formulario_modulos_aportados fma
                        LEFT JOIN modulos m ON m.id = fma.id_modulo
                        WHERE fma.id_formulario = f.id
                        ORDER BY fma.id ASC
                    ) ma
                ), '[]') AS modulos_aportados_json,
                COALESCE((
                    SELECT json_group_array(
                        json_object(
                            'id', a.id,
                            'id_formulario', a.id_formulario,
                            'nombre_archivo', a.nombre_archivo,
                            'descripcion', a.descripcion,
                            'ruta_almacenamiento', a.ruta_almacenamiento,
                            'mime_type', a.mime_type,
                            'size_bytes', a.size_bytes,
                            'created_at', a.created_at
                        )
                    )
                    FROM (
                        SELECT
                            fa.id,
                            fa.id_formulario,
                            fa.nombre_archivo,
                            fa.descripcion,
                            fa.ruta_almacenamiento,
                            fa.mime_type,
                            fa.size_bytes,
                            fa.created_at
                        FROM formulario_archivos fa
                        WHERE fa.id_formulario = f.id
                        ORDER BY fa.id ASC
                    ) a
                ), '[]') AS archivos_json
            FROM formularios f
            JOIN usuarios u ON u.id = f.id_alumno
            LEFT JOIN usuarios uv ON uv.id = f.validado_por
            WHERE f.id = ?
            """,
            (int(formulario_id),),
        ).fetchone()
    except sqlite3.OperationalError as exc:
        message = str(exc).lower()
        if "json_group_array" not in message and "json_object" not in message:
            raise

        form_row = conn.execute(
            """
            SELECT
                f.*,
                u.nombre AS alumno_nombre,
                u.email AS alumno_email,
                uv.nombre AS validador_nombre,
                uv.email AS validador_email
            FROM formularios f
            JOIN usuarios u ON u.id = f.id_alumno
            LEFT JOIN usuarios uv ON uv.id = f.validado_por
            WHERE f.id = ?
            """,
            (int(formulario_id),),
        ).fetchone()
        if form_row is None:
            return None

        return {
            "formulario": dict(form_row),
            "solicitudes": [dict(item) for item in list_formulario_solicitudes(conn, formulario_id)],
            "modulos_aportados": [
                dict(item) for item in list_formulario_modulos_aportados(conn, formulario_id)
            ],
            "archivos": [dict(item) for item in list_formulario_archivos(conn, formulario_id)],
        }
    if row is None:
        return None

    payload = dict(row)
    solicitudes = json.loads(str(payload.pop("solicitudes_json", "[]")))
    modulos_aportados = json.loads(str(payload.pop("modulos_aportados_json", "[]")))
    archivos = json.loads(str(payload.pop("archivos_json", "[]")))
    return {
        "formulario": payload,
        "solicitudes": solicitudes,
        "modulos_aportados": modulos_aportados,
        "archivos": archivos,
    }


# Cambia el estado del formulario validando la transicion permitida.
def change_formulario_status(
    conn: sqlite3.Connection,
    formulario_id: int,
    new_estado: FormularioEstado,
    *,
    validado_por: Optional[int] = None,
    anotaciones: Optional[str] = None,
) -> bool:
    new_estado = _assert_formulario_estado(new_estado)
    current = conn.execute("SELECT estado FROM formularios WHERE id = ?", (formulario_id,)).fetchone()
    if current is None:
        raise ValueError(f"Formulario {formulario_id} not found.")

    current_estado = str(current["estado"])
    _assert_formulario_transition(current_estado, new_estado)
    now = _utc_now()
    enviado_at = now if new_estado in {"ENVIADO", "A_REVISAR", "APROBADO", "RECHAZADO"} else None
    validado_at = now if new_estado in {"APROBADO", "RECHAZADO"} else None

    cur = conn.execute(
        """
        UPDATE formularios
        SET estado = ?,
            enviado_at = COALESCE(enviado_at, ?),
            validado_por = COALESCE(?, validado_por),
            validado_at = COALESCE(?, validado_at),
            anotaciones = COALESCE(?, anotaciones)
        WHERE id = ?
        """,
        (new_estado, enviado_at, validado_por, validado_at, anotaciones, formulario_id),
    )
    conn.commit()
    return cur.rowcount > 0


# ---------------------------------------------------------------------------
# Formulario_solicitudes (create/list)
# ---------------------------------------------------------------------------
# Crea una solicitud dentro de un formulario.
def create_formulario_solicitud(
    conn: sqlite3.Connection,
    id_formulario: int,
    id_modulo: Optional[int],
    id_convalidacion: Optional[int] = None,
    descripcion: Optional[str] = None,
) -> int:
    cur = conn.execute(
        """
        INSERT INTO formulario_solicitudes (id_formulario, id_modulo, id_convalidacion, descripcion)
        VALUES (?, ?, ?, ?)
        """,
        (id_formulario, id_modulo, id_convalidacion, descripcion),
    )
    conn.commit()
    return int(cur.lastrowid)


# Lista registros de formulario solicitudes con los filtros disponibles.
def list_formulario_solicitudes(
    conn: sqlite3.Connection,
    id_formulario: int,
) -> Sequence[sqlite3.Row]:
    return conn.execute(
        """
        SELECT
            fs.*, m.nombre AS modulo_destino_nombre
        FROM formulario_solicitudes fs
        LEFT JOIN modulos m ON m.id = fs.id_modulo
        WHERE fs.id_formulario = ?
        ORDER BY fs.id ASC
        """,
        (id_formulario,),
    ).fetchall()


# ---------------------------------------------------------------------------
# Formulario_modulos_aportados (create/list)
# ---------------------------------------------------------------------------
# Crea un registro de modulo aportado en un formulario.
def create_formulario_modulo_aportado(
    conn: sqlite3.Connection,
    id_formulario: int,
    id_modulo: Optional[int] = None,
    descripcion: Optional[str] = None,
) -> int:
    cur = conn.execute(
        """
        INSERT INTO formulario_modulos_aportados (id_formulario, id_modulo, descripcion)
        VALUES (?, ?, ?)
        """,
        (id_formulario, id_modulo, descripcion),
    )
    conn.commit()
    return int(cur.lastrowid)


# Lista registros de formulario modulos aportados con los filtros disponibles.
def list_formulario_modulos_aportados(
    conn: sqlite3.Connection,
    id_formulario: int,
) -> Sequence[sqlite3.Row]:
    return conn.execute(
        """
        SELECT
            fma.*, m.nombre AS modulo_nombre
        FROM formulario_modulos_aportados fma
        LEFT JOIN modulos m ON m.id = fma.id_modulo
        WHERE fma.id_formulario = ?
        ORDER BY fma.id ASC
        """,
        (id_formulario,),
    ).fetchall()


# ---------------------------------------------------------------------------
# Formulario_archivos (create/list)
# ---------------------------------------------------------------------------
# Crea un registro de archivo adjunto para un formulario.
def create_formulario_archivo(
    conn: sqlite3.Connection,
    id_formulario: int,
    nombre_archivo: str,
    ruta_almacenamiento: str,
    *,
    descripcion: Optional[str] = None,
    mime_type: Optional[str] = None,
    size_bytes: Optional[int] = None,
) -> int:
    nombre_archivo = _require_non_empty(nombre_archivo, "nombre_archivo")
    ruta_almacenamiento = _require_non_empty(ruta_almacenamiento, "ruta_almacenamiento")

    cur = conn.execute(
        """
        INSERT INTO formulario_archivos (
            id_formulario, nombre_archivo, descripcion, ruta_almacenamiento, mime_type, size_bytes
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (id_formulario, nombre_archivo, descripcion, ruta_almacenamiento, mime_type, size_bytes),
    )
    conn.commit()
    return int(cur.lastrowid)


# Lista registros de formulario archivos con los filtros disponibles.
def list_formulario_archivos(
    conn: sqlite3.Connection,
    id_formulario: int,
) -> Sequence[sqlite3.Row]:
    return conn.execute(
        """
        SELECT *
        FROM formulario_archivos
        WHERE id_formulario = ?
        ORDER BY id ASC
        """,
        (id_formulario,),
    ).fetchall()

