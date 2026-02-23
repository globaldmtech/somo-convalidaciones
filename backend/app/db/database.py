"""SQLite access layer for Somorrostro Convalidaciones.

This module encapsulates all DB interactions for:
- Catalog management (grados/familias/ciclos/modulos)
- Convalidaciones management
- Formularios CRUD
- Rule engine evaluation based on provided modules
"""
from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
import os
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
_UNSET = object()


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
# Catalog CRUD: grados, familias, ciclos, modulos
# ---------------------------------------------------------------------------
# Crea un nuevo registro de grado.
def create_grado(conn: sqlite3.Connection, nombre: str) -> int:
    """Insert grado and return id."""
    nombre = _require_non_empty(nombre, "nombre")
    cur = conn.execute("INSERT INTO grados (nombre) VALUES (?)", (nombre,))
    conn.commit()
    return int(cur.lastrowid)


# Obtiene un registro de grado por su identificador o criterio.
def get_grado(conn: sqlite3.Connection, grado_id: int) -> Optional[sqlite3.Row]:
    return conn.execute("SELECT * FROM grados WHERE id = ?", (grado_id,)).fetchone()


# Busca un grado por nombre exacto.
def find_grado_by_nombre(conn: sqlite3.Connection, nombre: str) -> Optional[sqlite3.Row]:
    nombre = _require_non_empty(nombre, "nombre")
    return conn.execute("SELECT * FROM grados WHERE nombre = ?", (nombre,)).fetchone()


# Lista registros de grados con los filtros disponibles.
def list_grados(conn: sqlite3.Connection) -> Sequence[sqlite3.Row]:
    """List grados."""
    return conn.execute("SELECT * FROM grados ORDER BY nombre ASC").fetchall()


# Actualiza un registro de grado con los datos recibidos.
def update_grado(conn: sqlite3.Connection, grado_id: int, nombre: str) -> bool:
    nombre = _require_non_empty(nombre, "nombre")
    cur = conn.execute("UPDATE grados SET nombre = ? WHERE id = ?", (nombre, grado_id))
    conn.commit()
    return cur.rowcount > 0


# Elimina un registro de grado por su identificador.
def delete_grado(conn: sqlite3.Connection, grado_id: int) -> bool:
    cur = conn.execute("DELETE FROM grados WHERE id = ?", (grado_id,))
    conn.commit()
    return cur.rowcount > 0


# Obtiene un grado existente o lo crea si no existe.
def get_or_create_grado(conn: sqlite3.Connection, nombre: str) -> int:
    nombre = _require_non_empty(nombre, "nombre")
    row = conn.execute("SELECT id FROM grados WHERE nombre = ?", (nombre,)).fetchone()
    if row:
        return int(row["id"])
    return create_grado(conn, nombre)


# Crea un nuevo registro de familia.
def create_familia(conn: sqlite3.Connection, nombre: str, id_grado: int) -> int:
    nombre = _require_non_empty(nombre, "nombre")
    cur = conn.execute(
        "INSERT INTO familias (nombre, id_grado) VALUES (?, ?)",
        (nombre, id_grado),
    )
    conn.commit()
    return int(cur.lastrowid)


# Obtiene un registro de familia por su identificador o criterio.
def get_familia(conn: sqlite3.Connection, familia_id: int) -> Optional[sqlite3.Row]:
    return conn.execute("SELECT * FROM familias WHERE id = ?", (familia_id,)).fetchone()


# Busca una familia por nombre y grado.
def find_familia_by_nombre(
    conn: sqlite3.Connection,
    nombre: str,
    id_grado: int,
) -> Optional[sqlite3.Row]:
    nombre = _require_non_empty(nombre, "nombre")
    return conn.execute(
        "SELECT * FROM familias WHERE nombre = ? AND id_grado = ?",
        (nombre, id_grado),
    ).fetchone()


# Lista registros de familias con los filtros disponibles.
def list_familias(conn: sqlite3.Connection, id_grado: Optional[int] = None) -> Sequence[sqlite3.Row]:
    if id_grado is None:
        return conn.execute("SELECT * FROM familias ORDER BY nombre ASC").fetchall()
    return conn.execute(
        "SELECT * FROM familias WHERE id_grado = ? ORDER BY nombre ASC",
        (id_grado,),
    ).fetchall()


# Actualiza un registro de familia con los datos recibidos.
def update_familia(
    conn: sqlite3.Connection,
    familia_id: int,
    nombre: str,
    id_grado: int,
) -> bool:
    nombre = _require_non_empty(nombre, "nombre")
    cur = conn.execute(
        "UPDATE familias SET nombre = ?, id_grado = ? WHERE id = ?",
        (nombre, id_grado, familia_id),
    )
    conn.commit()
    return cur.rowcount > 0


# Elimina un registro de familia por su identificador.
def delete_familia(conn: sqlite3.Connection, familia_id: int) -> bool:
    cur = conn.execute("DELETE FROM familias WHERE id = ?", (familia_id,))
    conn.commit()
    return cur.rowcount > 0


# Obtiene un familia existente o lo crea si no existe.
def get_or_create_familia(conn: sqlite3.Connection, nombre: str, id_grado: int) -> int:
    nombre = _require_non_empty(nombre, "nombre")
    row = conn.execute(
        "SELECT id FROM familias WHERE nombre = ? AND id_grado = ?",
        (nombre, id_grado),
    ).fetchone()
    if row:
        return int(row["id"])
    return create_familia(conn, nombre, id_grado)

# Crea un nuevo registro de ciclo.
def create_ciclo(
    conn: sqlite3.Connection,
    nombre: str,
    id_familia: int,
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
        (nombre, titulo, id_oficial, normativa, id_familia),
    )
    conn.commit()
    return int(cur.lastrowid)


# Obtiene un registro de ciclo por su identificador o criterio.
def get_ciclo(conn: sqlite3.Connection, ciclo_id: int) -> Optional[sqlite3.Row]:
    return conn.execute("SELECT * FROM ciclos WHERE id = ?", (ciclo_id,)).fetchone()


# Busca un ciclo por nombre y familia.
def find_ciclo_by_nombre(
    conn: sqlite3.Connection,
    nombre: str,
    id_familia: int,
) -> Optional[sqlite3.Row]:
    nombre = _require_non_empty(nombre, "nombre")
    return conn.execute(
        "SELECT * FROM ciclos WHERE nombre = ? AND id_familia = ?",
        (nombre, id_familia),
    ).fetchone()


# Lista registros de ciclos con los filtros disponibles.
def list_ciclos(conn: sqlite3.Connection, id_familia: Optional[int] = None) -> Sequence[sqlite3.Row]:
    if id_familia is None:
        return conn.execute("SELECT * FROM ciclos ORDER BY nombre ASC").fetchall()
    return conn.execute(
        "SELECT * FROM ciclos WHERE id_familia = ? ORDER BY nombre ASC",
        (id_familia,),
    ).fetchall()


# Actualiza un registro de ciclo con los datos recibidos.
def update_ciclo(
    conn: sqlite3.Connection,
    ciclo_id: int,
    nombre: str,
    id_familia: int,
    titulo: Optional[str] = None,
    id_oficial: Optional[str] = None,
    normativa: Optional[str] = None,
) -> bool:
    nombre = _require_non_empty(nombre, "nombre")
    cur = conn.execute(
        """
        UPDATE ciclos
        SET nombre = ?, titulo = ?, id_oficial = ?, normativa = ?, id_familia = ?
        WHERE id = ?
        """,
        (nombre, titulo, id_oficial, normativa, id_familia, ciclo_id),
    )
    conn.commit()
    return cur.rowcount > 0


# Elimina un registro de ciclo por su identificador.
def delete_ciclo(conn: sqlite3.Connection, ciclo_id: int) -> bool:
    cur = conn.execute("DELETE FROM ciclos WHERE id = ?", (ciclo_id,))
    conn.commit()
    return cur.rowcount > 0


# Obtiene un ciclo existente o lo crea si no existe.
def get_or_create_ciclo(
    conn: sqlite3.Connection,
    nombre: str,
    id_familia: int,
    titulo: Optional[str] = None,
    id_oficial: Optional[str] = None,
    normativa: Optional[str] = None,
) -> int:
    nombre = _require_non_empty(nombre, "nombre")
    row = conn.execute(
        "SELECT id FROM ciclos WHERE nombre = ? AND id_familia = ?",
        (nombre, id_familia),
    ).fetchone()
    if row:
        ciclo_id = int(row["id"])
        conn.execute(
            """
            UPDATE ciclos
            SET titulo = COALESCE(?, titulo),
                id_oficial = COALESCE(?, id_oficial),
                normativa = COALESCE(?, normativa)
            WHERE id = ?
            """,
            (titulo, id_oficial, normativa, ciclo_id),
        )
        conn.commit()
        return ciclo_id
    return create_ciclo(conn, nombre, id_familia, titulo, id_oficial, normativa)


# Crea un nuevo registro de modulo.
def create_modulo(
    conn: sqlite3.Connection,
    nombre: str,
    id_ciclo: int,
    id_oficial: Optional[str] = None,
) -> int:
    nombre = _require_non_empty(nombre, "nombre")
    cur = conn.execute(
        "INSERT INTO modulos (nombre, id_oficial, id_ciclo) VALUES (?, ?, ?)",
        (nombre, id_oficial, id_ciclo),
    )
    conn.commit()
    return int(cur.lastrowid)


# Obtiene un registro de modulo por su identificador o criterio.
def get_modulo(conn: sqlite3.Connection, modulo_id: int) -> Optional[sqlite3.Row]:
    return conn.execute("SELECT * FROM modulos WHERE id = ?", (modulo_id,)).fetchone()


# Busca un modulo por nombre y ciclo.
def find_modulo_by_nombre(
    conn: sqlite3.Connection,
    nombre: str,
    id_ciclo: int,
) -> Optional[sqlite3.Row]:
    nombre = _require_non_empty(nombre, "nombre")
    return conn.execute(
        "SELECT * FROM modulos WHERE nombre = ? AND id_ciclo = ?",
        (nombre, id_ciclo),
    ).fetchone()


# Lista registros de modulos con los filtros disponibles.
def list_modulos(
    conn: sqlite3.Connection,
    id_ciclo: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> Sequence[sqlite3.Row]:
    limit, offset = _normalize_limit_offset(limit, offset)
    params: list[Any] = []
    where_parts: list[str] = []

    if id_ciclo is not None:
        where_parts.append("m.id_ciclo = ?")
        params.append(id_ciclo)
    if search:
        where_parts.append("m.nombre LIKE ?")
        params.append(f"%{search.strip()}%")

    where_clause = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""
    query = f"""
        SELECT m.*, c.nombre AS ciclo_nombre, f.nombre AS familia_nombre, g.nombre AS grado_nombre
        FROM modulos m
        JOIN ciclos c ON c.id = m.id_ciclo
        JOIN familias f ON f.id = c.id_familia
        JOIN grados g ON g.id = f.id_grado
        {where_clause}
        ORDER BY m.nombre ASC
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])
    return conn.execute(query, tuple(params)).fetchall()


# Actualiza un registro de modulo con los datos recibidos.
def update_modulo(
    conn: sqlite3.Connection,
    modulo_id: int,
    nombre: str,
    id_ciclo: int,
    id_oficial: Optional[str] = None,
) -> bool:
    nombre = _require_non_empty(nombre, "nombre")
    cur = conn.execute(
        """
        UPDATE modulos
        SET nombre = ?, id_ciclo = ?, id_oficial = ?
        WHERE id = ?
        """,
        (nombre, id_ciclo, id_oficial, modulo_id),
    )
    conn.commit()
    return cur.rowcount > 0


# Elimina un registro de modulo por su identificador.
def delete_modulo(conn: sqlite3.Connection, modulo_id: int) -> bool:
    cur = conn.execute("DELETE FROM modulos WHERE id = ?", (modulo_id,))
    conn.commit()
    return cur.rowcount > 0


# Obtiene un modulo existente o lo crea si no existe.
def get_or_create_modulo(
    conn: sqlite3.Connection,
    nombre: str,
    id_ciclo: int,
    id_oficial: Optional[str] = None,
) -> int:
    nombre = _require_non_empty(nombre, "nombre")
    row = conn.execute(
        "SELECT id FROM modulos WHERE nombre = ? AND id_ciclo = ?",
        (nombre, id_ciclo),
    ).fetchone()
    if row:
        modulo_id = int(row["id"])
        if id_oficial:
            conn.execute(
                "UPDATE modulos SET id_oficial = COALESCE(?, id_oficial) WHERE id = ?",
                (id_oficial, modulo_id),
            )
            conn.commit()
        return modulo_id
    return create_modulo(conn, nombre, id_ciclo, id_oficial)


# ---------------------------------------------------------------------------
# Convalidaciones CRUD
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


# Obtiene un registro de convalidacion por su identificador o criterio.
def get_convalidacion(conn: sqlite3.Connection, conv_id: int) -> Optional[sqlite3.Row]:
    return conn.execute("SELECT * FROM convalidacion WHERE id = ?", (conv_id,)).fetchone()


# Lista registros de convalidacion origenes con los filtros disponibles.
def list_convalidacion_origenes(conn: sqlite3.Connection, conv_id: int) -> Sequence[sqlite3.Row]:
    return conn.execute(
        """
        SELECT co.conv_id, co.id_modulo, m.nombre AS modulo_nombre, m.id_ciclo
        FROM convalidacion_origen co
        JOIN modulos m ON m.id = co.id_modulo
        WHERE co.conv_id = ?
        ORDER BY m.nombre ASC
        """,
        (conv_id,),
    ).fetchall()


# Lista registros de convalidaciones con los filtros disponibles.
def list_convalidaciones(conn: sqlite3.Connection) -> Sequence[sqlite3.Row]:
    """List convalidaciones with origin modules."""
    return conn.execute(
        """
        SELECT
            c.*, md.nombre AS modulo_destino_nombre,
            COUNT(co.id_modulo) AS origen_count
        FROM convalidacion c
        JOIN modulos md ON md.id = c.id_modulo_destino
        LEFT JOIN convalidacion_origen co ON co.conv_id = c.id
        GROUP BY c.id
        ORDER BY c.id ASC
        """
    ).fetchall()


# Lista convalidaciones asociadas a un modulo destino.
def list_convalidaciones_for_destino(
    conn: sqlite3.Connection,
    id_modulo_destino: int,
) -> Sequence[sqlite3.Row]:
    return conn.execute(
        """
        SELECT c.*
        FROM convalidacion c
        WHERE c.id_modulo_destino = ?
        ORDER BY c.id ASC
        """,
        (id_modulo_destino,),
    ).fetchall()

# Actualiza un registro de convalidacion con los datos recibidos.
def update_convalidacion(
    conn: sqlite3.Connection,
    conv_id: int,
    id_modulo_destino: int,
    source_link: Optional[str],
    source_page: Optional[int],
    *,
    rule_mode: RuleMode = "ALL",
    source_doc: Optional[str] = None,
    source_anexo: Optional[int] = None,
) -> bool:
    rule_mode = _assert_rule_mode(rule_mode)
    cur = conn.execute(
        """
        UPDATE convalidacion
        SET id_modulo_destino = ?,
            source_link = ?,
            source_page = ?,
            source_doc = ?,
            source_anexo = ?,
            rule_mode = ?
        WHERE id = ?
        """,
        (id_modulo_destino, source_link, source_page, source_doc, source_anexo, rule_mode, conv_id),
    )
    conn.commit()
    return cur.rowcount > 0


# Elimina un registro de convalidacion por su identificador.
def delete_convalidacion(conn: sqlite3.Connection, conv_id: int) -> bool:
    cur = conn.execute("DELETE FROM convalidacion WHERE id = ?", (conv_id,))
    conn.commit()
    return cur.rowcount > 0


# Agrega un elemento a convalidacion origen.
def add_convalidacion_origen(conn: sqlite3.Connection, conv_id: int, id_modulo: int) -> bool:
    cur = conn.execute(
        "INSERT OR IGNORE INTO convalidacion_origen (conv_id, id_modulo) VALUES (?, ?)",
        (conv_id, id_modulo),
    )
    conn.commit()
    return cur.rowcount > 0


# Quita un elemento de convalidacion origen.
def remove_convalidacion_origen(conn: sqlite3.Connection, conv_id: int, id_modulo: int) -> bool:
    cur = conn.execute(
        "DELETE FROM convalidacion_origen WHERE conv_id = ? AND id_modulo = ?",
        (conv_id, id_modulo),
    )
    conn.commit()
    return cur.rowcount > 0


# Reemplaza la coleccion de convalidacion origenes con nuevos valores.
def replace_convalidacion_origenes(
    conn: sqlite3.Connection,
    conv_id: int,
    origen_modulos: Iterable[int],
) -> None:
    origin_ids = _normalize_module_ids(origen_modulos)
    if not origin_ids:
        raise ValueError("`origen_modulos` must include at least one module id.")

    with transaction(conn):
        conn.execute("DELETE FROM convalidacion_origen WHERE conv_id = ?", (conv_id,))
        conn.executemany(
            "INSERT INTO convalidacion_origen (conv_id, id_modulo) VALUES (?, ?)",
            [(conv_id, module_id) for module_id in origin_ids],
        )


# ---------------------------------------------------------------------------
# Usuarios (alta/consulta/listado)
# ---------------------------------------------------------------------------
# Crea un nuevo registro de usuario.
def create_usuario(
    conn: sqlite3.Connection,
    nombre: str,
    email: str,
    rol: Literal["ALUMNO", "ADMIN"] = "ALUMNO",
) -> int:
    nombre = _require_non_empty(nombre, "nombre")
    email = _require_non_empty(email, "email").lower()
    rol = _assert_usuario_rol(_require_non_empty(rol, "rol").upper())
    cur = conn.execute(
        "INSERT INTO usuarios (nombre, email, rol) VALUES (?, ?, ?)",
        (nombre, email, rol),
    )
    conn.commit()
    return int(cur.lastrowid)


# Obtiene un registro de usuario por su identificador o criterio.
def get_usuario(conn: sqlite3.Connection, usuario_id: int) -> Optional[sqlite3.Row]:
    return conn.execute("SELECT * FROM usuarios WHERE id = ?", (usuario_id,)).fetchone()


# Obtiene un usuario a partir de su correo electronico.
def get_usuario_by_email(conn: sqlite3.Connection, email: str) -> Optional[sqlite3.Row]:
    email = _require_non_empty(email, "email").lower()
    return conn.execute("SELECT * FROM usuarios WHERE email = ?", (email,)).fetchone()


# Lista registros de usuarios con los filtros disponibles.
def list_usuarios(conn: sqlite3.Connection) -> Sequence[sqlite3.Row]:
    return conn.execute("SELECT * FROM usuarios ORDER BY nombre ASC").fetchall()


# ---------------------------------------------------------------------------
# Formularios CRUD
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


# Obtiene un registro de formulario por su identificador o criterio.
def get_formulario(conn: sqlite3.Connection, formulario_id: int) -> Optional[sqlite3.Row]:
    return conn.execute(
        """
        SELECT
            f.*, u.nombre AS alumno_nombre, u.email AS alumno_email
        FROM formularios f
        JOIN usuarios u ON u.id = f.id_alumno
        WHERE f.id = ?
        """,
        (formulario_id,),
    ).fetchone()


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


# Actualiza un registro de formulario con los datos recibidos.
def update_formulario(
    conn: sqlite3.Connection,
    formulario_id: int,
    *,
    anotaciones: Optional[str] = None,
    validado_por: Optional[int] = None,
) -> bool:
    cur = conn.execute(
        """
        UPDATE formularios
        SET anotaciones = COALESCE(?, anotaciones),
            validado_por = COALESCE(?, validado_por)
        WHERE id = ?
        """,
        (anotaciones, validado_por, formulario_id),
    )
    conn.commit()
    return cur.rowcount > 0


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


# Marca un formulario como enviado.
def submit_formulario(conn: sqlite3.Connection, formulario_id: int) -> bool:
    return change_formulario_status(conn, formulario_id, "ENVIADO")


# Aplica una revision y estado final al formulario.
def review_formulario(
    conn: sqlite3.Connection,
    formulario_id: int,
    *,
    estado: Literal["A_REVISAR", "APROBADO", "RECHAZADO"],
    validado_por: int,
    anotaciones: Optional[str] = None,
) -> bool:
    return change_formulario_status(
        conn,
        formulario_id,
        estado,
        validado_por=validado_por,
        anotaciones=anotaciones,
    )


# Elimina un registro de formulario por su identificador.
def delete_formulario(conn: sqlite3.Connection, formulario_id: int) -> bool:
    cur = conn.execute("DELETE FROM formularios WHERE id = ?", (formulario_id,))
    conn.commit()
    return cur.rowcount > 0

# ---------------------------------------------------------------------------
# Formulario_solicitudes CRUD
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


# Obtiene un registro de formulario solicitud por su identificador o criterio.
def get_formulario_solicitud(conn: sqlite3.Connection, solicitud_id: int) -> Optional[sqlite3.Row]:
    return conn.execute(
        "SELECT * FROM formulario_solicitudes WHERE id = ?",
        (solicitud_id,),
    ).fetchone()


# Actualiza un registro de formulario solicitud con los datos recibidos.
def update_formulario_solicitud(
    conn: sqlite3.Connection,
    solicitud_id: int,
    *,
    id_modulo: Optional[int] | object = _UNSET,
    id_convalidacion: Optional[int] | object = _UNSET,
    descripcion: Optional[str] | object = _UNSET,
    estado_evaluacion: Optional[str] | object = _UNSET,
) -> bool:
    if estado_evaluacion is not _UNSET and estado_evaluacion not in {"PENDIENTE", "MATCH", "NO_MATCH"}:
        raise ValueError("estado_evaluacion must be PENDIENTE, MATCH or NO_MATCH.")

    set_parts: list[str] = []
    params: list[Any] = []
    if id_modulo is not _UNSET:
        set_parts.append("id_modulo = ?")
        params.append(id_modulo)
    if id_convalidacion is not _UNSET:
        set_parts.append("id_convalidacion = ?")
        params.append(id_convalidacion)
    if descripcion is not _UNSET:
        set_parts.append("descripcion = ?")
        params.append(descripcion)
    if estado_evaluacion is not _UNSET:
        set_parts.append("estado_evaluacion = ?")
        params.append(estado_evaluacion)

    if not set_parts:
        return False

    query = f"UPDATE formulario_solicitudes SET {', '.join(set_parts)} WHERE id = ?"
    params.append(solicitud_id)
    cur = conn.execute(query, tuple(params))
    conn.commit()
    return cur.rowcount > 0


# Elimina un registro de formulario solicitud por su identificador.
def delete_formulario_solicitud(conn: sqlite3.Connection, solicitud_id: int) -> bool:
    cur = conn.execute("DELETE FROM formulario_solicitudes WHERE id = ?", (solicitud_id,))
    conn.commit()
    return cur.rowcount > 0


# ---------------------------------------------------------------------------
# Formulario_modulos_aportados CRUD
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


# Actualiza un registro de formulario modulo aportado con los datos recibidos.
def update_formulario_modulo_aportado(
    conn: sqlite3.Connection,
    item_id: int,
    *,
    id_modulo: Optional[int] = None,
    descripcion: Optional[str] = None,
) -> bool:
    cur = conn.execute(
        """
        UPDATE formulario_modulos_aportados
        SET id_modulo = COALESCE(?, id_modulo),
            descripcion = COALESCE(?, descripcion)
        WHERE id = ?
        """,
        (id_modulo, descripcion, item_id),
    )
    conn.commit()
    return cur.rowcount > 0


# Elimina un registro de formulario modulo aportado por su identificador.
def delete_formulario_modulo_aportado(conn: sqlite3.Connection, item_id: int) -> bool:
    cur = conn.execute("DELETE FROM formulario_modulos_aportados WHERE id = ?", (item_id,))
    conn.commit()
    return cur.rowcount > 0


# ---------------------------------------------------------------------------
# Formulario_archivos CRUD
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


# Construye una estructura completa de formulario para exportacion.
def get_formulario_export_data(conn: sqlite3.Connection, formulario_id: int) -> dict[str, Any]:
    formulario = get_formulario(conn, formulario_id)
    if formulario is None:
        raise ValueError(f"Formulario {formulario_id} not found.")

    solicitudes = [dict(row) for row in list_formulario_solicitudes(conn, formulario_id)]
    modulos_aportados = [dict(row) for row in list_formulario_modulos_aportados(conn, formulario_id)]
    archivos = [dict(row) for row in list_formulario_archivos(conn, formulario_id)]

    return {
        "formulario": dict(formulario),
        "solicitudes": solicitudes,
        "modulos_aportados": modulos_aportados,
        "archivos": archivos,
        "exported_at": _utc_now(),
    }


# Lista formularios listos para exportacion con filtros y paginacion.
def list_formularios_export_data(
    conn: sqlite3.Connection,
    id_alumno: Optional[int] = None,
    estado: Optional[FormularioEstado] = None,
    limit: int = 100,
    offset: int = 0,
) -> list[dict[str, Any]]:
    formularios = list_formularios(
        conn,
        id_alumno=id_alumno,
        estado=estado,
        limit=limit,
        offset=offset,
    )
    return [get_formulario_export_data(conn, int(row["id"])) for row in formularios]


# Elimina un registro de formulario archivo por su identificador.
def delete_formulario_archivo(conn: sqlite3.Connection, archivo_id: int) -> bool:
    cur = conn.execute("DELETE FROM formulario_archivos WHERE id = ?", (archivo_id,))
    conn.commit()
    return cur.rowcount > 0


# ---------------------------------------------------------------------------
# Motor de reglas
# ---------------------------------------------------------------------------
# Obtiene los ids de modulos aportados asociados a un formulario.
def _get_aportados_ids(conn: sqlite3.Connection, formulario_id: int) -> set[int]:
    rows = conn.execute(
        """
        SELECT DISTINCT id_modulo
        FROM formulario_modulos_aportados
        WHERE id_formulario = ? AND id_modulo IS NOT NULL
        """,
        (formulario_id,),
    ).fetchall()
    return {int(row["id_modulo"]) for row in rows}


# Busca reglas candidatas para un modulo destino.
def find_candidate_convalidaciones(
    conn: sqlite3.Connection,
    id_modulo_destino: int,
) -> list[dict[str, Any]]:
    rows = conn.execute(
        """
        SELECT
            c.id AS convalidacion_id,
            c.rule_mode,
            c.source_link,
            c.source_page,
            c.source_doc,
            c.source_anexo,
            co.id_modulo AS origen_modulo_id
        FROM convalidacion c
        LEFT JOIN convalidacion_origen co ON co.conv_id = c.id
        WHERE c.id_modulo_destino = ?
        ORDER BY c.id ASC, co.id_modulo ASC
        """,
        (id_modulo_destino,),
    ).fetchall()

    grouped: dict[int, dict[str, Any]] = {}
    for row in rows:
        conv_id = int(row["convalidacion_id"])
        candidate = grouped.setdefault(
            conv_id,
            {
                "convalidacion_id": conv_id,
                "rule_mode": row["rule_mode"],
                "source_link": row["source_link"],
                "source_page": row["source_page"],
                "source_doc": row["source_doc"],
                "source_anexo": row["source_anexo"],
                "required_origen_ids": [],
            },
        )
        if row["origen_modulo_id"] is not None:
            candidate["required_origen_ids"].append(int(row["origen_modulo_id"]))

    return list(grouped.values())


# Evalua si una regla candidata cumple con los modulos aportados.
def _evaluate_candidate(candidate: dict[str, Any], aportados_ids: set[int]) -> dict[str, Any]:
    required_ids = set(candidate["required_origen_ids"])
    rule_mode = str(candidate["rule_mode"])
    if rule_mode == "ALL":
        is_match = required_ids.issubset(aportados_ids)
    else:
        is_match = bool(required_ids.intersection(aportados_ids))

    matched_ids = sorted(required_ids.intersection(aportados_ids))
    missing_ids = sorted(required_ids - aportados_ids)
    return {
        **candidate,
        "is_match": is_match,
        "matched_origen_ids": matched_ids,
        "missing_origen_ids": missing_ids,
        "matched_count": len(matched_ids),
        "missing_count": len(missing_ids),
        "required_count": len(required_ids),
    }


# Evalua una solicitud concreta y determina si hay convalidacion aplicable.
def evaluate_solicitud(
    conn: sqlite3.Connection,
    solicitud_id: int,
    *,
    auto_assign: bool = False,
) -> dict[str, Any]:
    solicitud = conn.execute(
        """
        SELECT id, id_formulario, id_modulo, id_convalidacion
        FROM formulario_solicitudes
        WHERE id = ?
        """,
        (solicitud_id,),
    ).fetchone()
    if solicitud is None:
        raise ValueError(f"Solicitud {solicitud_id} not found.")

    formulario_id = int(solicitud["id_formulario"])
    id_modulo_destino = solicitud["id_modulo"]
    if id_modulo_destino is None:
        result = {
            "solicitud_id": solicitud_id,
            "formulario_id": formulario_id,
            "status": "PENDING_DESTINATION",
            "message": "Solicitud has no destination module assigned.",
            "candidates": [],
            "best_match": None,
        }
        if auto_assign:
            update_formulario_solicitud(conn, solicitud_id, estado_evaluacion="NO_MATCH")
        return result

    aportados_ids = _get_aportados_ids(conn, formulario_id)
    candidates = find_candidate_convalidaciones(conn, int(id_modulo_destino))
    evaluations = [_evaluate_candidate(candidate, aportados_ids) for candidate in candidates]
    matches = [item for item in evaluations if item["is_match"]]
    matches.sort(key=lambda item: (-item["matched_count"], item["missing_count"], item["convalidacion_id"]))
    best_match = matches[0] if matches else None

    status = "MATCH" if best_match else "NO_MATCH"

    if auto_assign:
        if best_match:
            update_formulario_solicitud(
                conn,
                solicitud_id,
                id_convalidacion=int(best_match["convalidacion_id"]),
                estado_evaluacion="MATCH",
            )
        else:
            update_formulario_solicitud(conn, solicitud_id, id_convalidacion=None, estado_evaluacion="NO_MATCH")

    return {
        "solicitud_id": solicitud_id,
        "formulario_id": formulario_id,
        "id_modulo_destino": int(id_modulo_destino),
        "aportados_ids": sorted(aportados_ids),
        "status": status,
        "candidates": evaluations,
        "best_match": best_match,
    }


# Evalua todas las solicitudes de un formulario.
def evaluate_formulario(
    conn: sqlite3.Connection,
    formulario_id: int,
    *,
    auto_assign: bool = False,
) -> dict[str, Any]:
    solicitudes = conn.execute(
        "SELECT id FROM formulario_solicitudes WHERE id_formulario = ? ORDER BY id ASC",
        (formulario_id,),
    ).fetchall()

    evaluation_results: list[dict[str, Any]] = []
    for row in solicitudes:
        evaluation_results.append(
            evaluate_solicitud(conn, int(row["id"]), auto_assign=auto_assign)
        )

    matched_count = sum(1 for item in evaluation_results if item["status"] == "MATCH")
    no_match_count = sum(1 for item in evaluation_results if item["status"] == "NO_MATCH")
    pending_count = sum(1 for item in evaluation_results if item["status"] == "PENDING_DESTINATION")
    total = len(evaluation_results)

    return {
        "formulario_id": formulario_id,
        "auto_assign": auto_assign,
        "total_solicitudes": total,
        "matched": matched_count,
        "no_match": no_match_count,
        "pending_destination": pending_count,
        "solicitudes": evaluation_results,
    }


# Evalua y asigna automaticamente convalidaciones al formulario.
def resolve_formulario_convalidaciones(conn: sqlite3.Connection, formulario_id: int) -> dict[str, Any]:
    """Evaluate and persist automatic convalidacion assignment for all solicitudes."""
    return evaluate_formulario(conn, formulario_id, auto_assign=True)
