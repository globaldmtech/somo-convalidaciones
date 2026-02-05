"""Funciones de persistencia y resolución de IDs contra la base de datos."""

from typing import Optional, Tuple

from .constants import CODE_RE, SOURCE_DOC
from .normalize import clean_cycle_name, normalize_match
from .types import Item


def ensure_tables(conn, reset: bool = False) -> None:
    """Crea (o reinicia) las tablas Convalidacion y Convalidacion_links."""
    cur = conn.cursor()
    if reset:
        cur.execute("DROP TABLE IF EXISTS Convalidacion_links")
        cur.execute("DROP TABLE IF EXISTS Convalidacion")

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Convalidacion (
          id TEXT PRIMARY KEY,
          source_doc TEXT NOT NULL,
          source_anexo INTEGER,
          source_page INTEGER
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS Convalidacion_links (
          id INTEGER PRIMARY KEY,
          rd TEXT,
          link_id INTEGER,
          link_item TEXT NOT NULL,
          origen_destino TEXT NOT NULL,
          convalid_id TEXT NOT NULL,
          FOREIGN KEY (convalid_id) REFERENCES Convalidacion(id) ON DELETE CASCADE,
          CHECK (link_item IN ('modulo', 'ciclo', 'familia', 'grado')),
          CHECK (origen_destino IN ('origen', 'destino'))
        )
        """
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_conv_links_conv ON Convalidacion_links(convalid_id)"
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_conv_links_link ON Convalidacion_links(link_id)"
    )
    conn.commit()


def load_reference_ids(conn):
    """Carga diccionarios de lookup por nombre normalizado."""
    cur = conn.cursor()

    cur.execute("SELECT id, nombre FROM Modulos")
    mod_by_norm = {normalize_match(nombre): mod_id for mod_id, nombre in cur.fetchall()}

    cur.execute("SELECT id, nombre, titulo FROM Ciclos")
    cycle_by_norm = {}
    for ciclo_id, nombre, titulo in cur.fetchall():
        cycle_by_norm[normalize_match(nombre)] = ciclo_id
        if titulo:
            cycle_by_norm.setdefault(normalize_match(titulo), ciclo_id)

    cur.execute("SELECT id, nombre FROM Familias")
    family_by_norm = {normalize_match(nombre): fam_id for fam_id, nombre in cur.fetchall()}

    cur.execute("SELECT id, nombre FROM Grados")
    grade_by_norm = {normalize_match(nombre): grado_id for grado_id, nombre in cur.fetchall()}

    return mod_by_norm, cycle_by_norm, family_by_norm, grade_by_norm


def resolve_best_link(name: str, lookups) -> Tuple[Optional[int], Optional[str]]:
    """Resuelve un nombre a su ID y tipo en catálogo (modulo/ciclo/familia/grado)."""
    mod_by_norm, cycle_by_norm, family_by_norm, grade_by_norm = lookups
    candidates = [name]
    match = CODE_RE.match(name)
    if match:
        candidates.append(match.group(2).strip())
    candidates.append(clean_cycle_name(name))

    for cand in candidates:
        key = normalize_match(cand)
        if key in mod_by_norm:
            return mod_by_norm[key], "modulo"
        if key in cycle_by_norm:
            return cycle_by_norm[key], "ciclo"
        if key in family_by_norm:
            return family_by_norm[key], "familia"
        if key in grade_by_norm:
            return grade_by_norm[key], "grado"

    return None, None


def insert_convalidacion(cur, conv_id: str, source_anexo: int, source_page: int) -> None:
    """Inserta una convalidación base si no existe."""
    cur.execute(
        """
        INSERT OR IGNORE INTO Convalidacion (id, source_doc, source_anexo, source_page)
        VALUES (?,?,?,?)
        """,
        (conv_id, SOURCE_DOC, source_anexo, source_page),
    )


def insert_link(cur, convalid_id: str, item: Item, origen_destino: str, lookups) -> None:
    """Inserta un link de origen/destino con resolución opcional a catálogo."""
    link_id, link_item = resolve_best_link(item.name, lookups)
    if link_item is None:
        link_item = item.item_type
    cur.execute(
        """
        INSERT INTO Convalidacion_links (rd, link_id, link_item, origen_destino, convalid_id)
        VALUES (?,?,?,?,?)
        """,
        (item.rd, link_id, link_item, origen_destino, convalid_id),
    )
