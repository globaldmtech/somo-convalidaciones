"""SQLite access layer.

First milestone: implement this module so other layers can use it.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import sqlite3
from typing import Iterable, Optional, Sequence
import os


DEFAULT_DB_PATH = Path(os.getenv("DB_PATH", "data/somo.db"))


@dataclass
class DBConfig:
    path: Path = DEFAULT_DB_PATH


def connect(config: DBConfig) -> sqlite3.Connection:
    """Return a SQLite connection with sane defaults.

    TODO:
    - enable foreign keys
    - set row factory
    """
    conn = sqlite3.connect(config.path)
    return conn


def init_db(config: DBConfig) -> None:
    """Create database file and apply schema.

    TODO: open schema.sql and execute it.
    """
    raise NotImplementedError


# === Catalog CRUD (first implementation targets) ===

def create_grado(conn: sqlite3.Connection, nombre: str) -> int:
    """Insert grado and return id."""
    raise NotImplementedError


def list_grados(conn: sqlite3.Connection) -> Sequence[sqlite3.Row]:
    """List grados."""
    raise NotImplementedError


# === Convalidaciones CRUD (first implementation targets) ===

def create_convalidacion(
    conn: sqlite3.Connection,
    id_modulo_destino: int,
    source_link: Optional[str],
    source_page: Optional[int],
    origen_modulos: Iterable[int],
) -> int:
    """Create convalidacion and its origen relations.

    `origen_modulos` are module ids that map to the destination module.
    """
    raise NotImplementedError


def list_convalidaciones(conn: sqlite3.Connection) -> Sequence[sqlite3.Row]:
    """List convalidaciones with origen modules."""
    raise NotImplementedError
