"""
db_helper.py
============
Funciones de consulta sobre la base de datos SQLite para resolver nombres/códigos
de módulos, ciclos y familias a sus IDs internos.

Uso típico (solo para depuración / comprobación):
    python db_helper.py
"""

import sqlite3
import os
from typing import Optional

# Ruta por defecto a la base de datos
DEFAULT_DB = os.path.join(os.path.dirname(__file__), "..", "db.sqlite")


def get_connection(db_path: str = DEFAULT_DB) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


# ─────────────────────────────────────────────
# FAMILIAS
# ─────────────────────────────────────────────

def get_familia_id(nombre: str, db_path: str = DEFAULT_DB) -> Optional[int]:
    """Devuelve el id de la familia cuyo nombre contiene la cadena dada (insensible a mayúsculas)."""
    with get_connection(db_path) as conn:
        row = conn.execute(
            "SELECT id FROM familias WHERE LOWER(nombre) LIKE LOWER(?)",
            (f"%{nombre}%",)
        ).fetchone()
    return row["id"] if row else None


def list_familias(db_path: str = DEFAULT_DB) -> list[dict]:
    """Lista todas las familias disponibles."""
    with get_connection(db_path) as conn:
        rows = conn.execute("SELECT id, nombre, codigo FROM familias ORDER BY id").fetchall()
    return [dict(r) for r in rows]


# ─────────────────────────────────────────────
# GRADOS
# ─────────────────────────────────────────────

def get_grado_id(nombre: str, db_path: str = DEFAULT_DB) -> Optional[int]:
    """Devuelve el id del grado cuyo nombre contiene la cadena dada."""
    with get_connection(db_path) as conn:
        row = conn.execute(
            "SELECT id FROM grados WHERE LOWER(nombre) LIKE LOWER(?)",
            (f"%{nombre}%",)
        ).fetchone()
    return row["id"] if row else None


def list_grados(db_path: str = DEFAULT_DB) -> list[dict]:
    with get_connection(db_path) as conn:
        rows = conn.execute("SELECT id, nombre FROM grados ORDER BY id").fetchall()
    return [dict(r) for r in rows]


# ─────────────────────────────────────────────
# CICLOS
# ─────────────────────────────────────────────

def get_ciclo_id(
    nombre: str,
    id_familia: Optional[int] = None,
    id_grado: Optional[int] = None,
    db_path: str = DEFAULT_DB,
) -> Optional[int]:
    """
    Devuelve el id del ciclo que coincide con el nombre dado.
    Se puede filtrar por id_familia y/o id_grado para mayor precisión.
    """
    query = "SELECT id FROM ciclos WHERE LOWER(nombre) LIKE LOWER(?)"
    params: list = [f"%{nombre}%"]
    if id_familia is not None:
        query += " AND id_familia = ?"
        params.append(id_familia)
    if id_grado is not None:
        query += " AND id_grado = ?"
        params.append(id_grado)
    with get_connection(db_path) as conn:
        row = conn.execute(query, params).fetchone()
    return row["id"] if row else None


def search_ciclos(
    nombre: str,
    id_familia: Optional[int] = None,
    id_grado: Optional[int] = None,
    db_path: str = DEFAULT_DB,
) -> list[dict]:
    """Devuelve todos los ciclos que coinciden (útil para depurar ambigüedades)."""
    query = """
        SELECT c.id, c.nombre, f.nombre AS familia, g.nombre AS grado
        FROM ciclos c
        JOIN familias f ON f.id = c.id_familia
        JOIN grados g ON g.id = c.id_grado
        WHERE LOWER(c.nombre) LIKE LOWER(?)
    """
    params: list = [f"%{nombre}%"]
    if id_familia is not None:
        query += " AND c.id_familia = ?"
        params.append(id_familia)
    if id_grado is not None:
        query += " AND c.id_grado = ?"
        params.append(id_grado)
    with get_connection(db_path) as conn:
        rows = conn.execute(query, params).fetchall()
    return [dict(r) for r in rows]


# ─────────────────────────────────────────────
# MÓDULOS
# ─────────────────────────────────────────────

def get_modulo_id(
    nombre: str,
    id_ciclo: Optional[int] = None,
    id_oficial: Optional[str] = None,
    db_path: str = DEFAULT_DB,
) -> Optional[int]:
    """
    Devuelve el id del módulo que coincide.
    - Si se proporciona id_oficial (ej. '0626'), se busca también por ese campo.
    - Si se proporciona id_ciclo, se filtra por él.
    """
    if id_oficial:
        query = "SELECT id FROM modulos WHERE id_oficial = ?"
        params: list = [id_oficial]
        if id_ciclo is not None:
            query += " AND id_ciclo = ?"
            params.append(id_ciclo)
        with get_connection(db_path) as conn:
            row = conn.execute(query, params).fetchone()
        if row:
            return row["id"]

    # Fallback: búsqueda por nombre
    query = "SELECT id FROM modulos WHERE LOWER(nombre) LIKE LOWER(?)"
    params = [f"%{nombre}%"]
    if id_ciclo is not None:
        query += " AND id_ciclo = ?"
        params.append(id_ciclo)
    with get_connection(db_path) as conn:
        row = conn.execute(query, params).fetchone()
    return row["id"] if row else None


def search_modulos(
    nombre: str,
    id_ciclo: Optional[int] = None,
    db_path: str = DEFAULT_DB,
) -> list[dict]:
    """Busca módulos por nombre parcial. Útil para depurar ambigüedades."""
    query = """
        SELECT m.id, m.nombre, m.id_oficial, c.nombre AS ciclo
        FROM modulos m
        JOIN ciclos c ON c.id = m.id_ciclo
        WHERE LOWER(m.nombre) LIKE LOWER(?)
    """
    params: list = [f"%{nombre}%"]
    if id_ciclo is not None:
        query += " AND m.id_ciclo = ?"
        params.append(id_ciclo)
    with get_connection(db_path) as conn:
        rows = conn.execute(query, params).fetchall()
    return [dict(r) for r in rows]


# ─────────────────────────────────────────────
# CICLO COMPLETO
# ─────────────────────────────────────────────

def get_modulos_por_ciclo(
    id_ciclo: int,
    db_path: str = DEFAULT_DB,
) -> list[int]:
    """
    Devuelve los IDs de todos los módulos que pertenecen al ciclo dado.
    Se usa cuando el origen de una regla es 'Ciclo Completo':
    todos esos módulos se insertarán en convalidacion_origen.
    """
    with get_connection(db_path) as conn:
        rows = conn.execute(
            "SELECT id FROM modulos WHERE id_ciclo = ? ORDER BY id",
            (id_ciclo,)
        ).fetchall()
    return [r["id"] for r in rows]


# ─────────────────────────────────────────────
# DETECCIÓN DE DUPLICADOS
# ─────────────────────────────────────────────

def convalidacion_exists(
    id_modulo_destino: int,
    origen_ids: list[int],
    db_path: str = DEFAULT_DB,
) -> bool:
    """
    Devuelve True si ya existe en la BD una regla con exactamente:
      - el mismo módulo destino (id_modulo_destino)
      - el mismo conjunto de módulos origen (origen_ids)
    La comprobación es exacta: mismos IDs, sin más ni menos.
    """
    if not origen_ids:
        return False

    origen_set = set(origen_ids)

    with get_connection(db_path) as conn:
        candidatos = conn.execute(
            "SELECT id FROM convalidacion WHERE id_modulo_destino = ?",
            (id_modulo_destino,)
        ).fetchall()

        for row in candidatos:
            rows_orig = conn.execute(
                "SELECT id_modulo FROM convalidacion_origen WHERE conv_id = ?",
                (row["id"],)
            ).fetchall()
            existentes = {r["id_modulo"] for r in rows_orig}
            if existentes == origen_set:
                return True

    return False


# ─────────────────────────────────────────────
# UTILIDAD DE DIAGNÓSTICO
# ─────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Uso: python db_helper.py <tipo> <nombre>")
        print("  tipo: familia | grado | ciclo | modulo")
        print("Ejemplos:")
        print("  python db_helper.py familia 'administracion'")
        print("  python db_helper.py ciclo 'ventas'")
        print("  python db_helper.py modulo 'logistica'")
        print()
        print("Familias disponibles:")
        for f in list_familias():
            print(f"  [{f['id']}] {f['nombre']} ({f['codigo']})")
    else:
        tipo = sys.argv[1].lower()
        nombre = sys.argv[2]
        if tipo == "familia":
            results = list_familias()
            results = [r for r in results if nombre.lower() in r["nombre"].lower()]
        elif tipo == "grado":
            results = list_grados()
            results = [r for r in results if nombre.lower() in r["nombre"].lower()]
        elif tipo == "ciclo":
            results = search_ciclos(nombre)
        elif tipo == "modulo":
            results = search_modulos(nombre)
        else:
            print(f"Tipo '{tipo}' no reconocido.")
            sys.exit(1)

        if not results:
            print(f"No se encontraron resultados para '{nombre}'.")
        else:
            for r in results:
                print(r)
