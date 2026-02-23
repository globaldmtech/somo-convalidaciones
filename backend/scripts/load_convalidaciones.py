"""Load convalidaciones into backend schema.

Supported sources:
1) JSON file with explicit destination/origin module ids.
2) Existing SQLite containing tables Convalidacion + Convalidacion_links.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sqlite3
import sys
from typing import Any


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.db.database import (  # noqa: E402
    DBConfig,
    clear_convalidaciones,
    connect,
    create_convalidacion,
    init_db,
)


# Define y procesa los argumentos de linea de comandos.
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Load convalidaciones into backend SQLite schema.")
    parser.add_argument("--db", default="data/somo.db", help="Target DB path (backend schema).")
    parser.add_argument(
        "--json",
        default=None,
        help="Optional JSON file with explicit rules.",
    )
    parser.add_argument(
        "--source-db",
        default=None,
        help="Optional source SQLite with Convalidacion + Convalidacion_links.",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete existing convalidacion data before loading.",
    )
    args = parser.parse_args()
    if not args.json and not args.source_db:
        parser.error("Use --json or --source-db.")
    return args


# Carga reglas de convalidacion desde un archivo JSON.
def _load_from_json(conn: sqlite3.Connection, json_path: Path) -> int:
    if not json_path.exists():
        raise FileNotFoundError(f"JSON file not found: {json_path}")
    payload = json.loads(json_path.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise ValueError("JSON source must be a list of convalidacion rules.")

    created = 0
    for item in payload:
        if not isinstance(item, dict):
            continue
        id_modulo_destino = item.get("id_modulo_destino", item.get("modulo_destino_id"))
        origen_modulos = item.get("origen_modulos", item.get("id_modulos_origen", []))
        if id_modulo_destino is None or not isinstance(origen_modulos, list):
            continue
        create_convalidacion(
            conn,
            id_modulo_destino=int(id_modulo_destino),
            source_link=item.get("source_link"),
            source_page=item.get("source_page"),
            origen_modulos=[int(mid) for mid in origen_modulos],
            rule_mode=str(item.get("rule_mode", "ALL")).upper(),  # type: ignore[arg-type]
            source_doc=item.get("source_doc"),
            source_anexo=item.get("source_anexo"),
        )
        created += 1
    return created


# Busca una tabla por nombre ignorando mayusculas y minusculas.
def _find_table_name(conn: sqlite3.Connection, expected_lower: str) -> str | None:
    rows = conn.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table'"
    ).fetchall()
    for row in rows:
        table_name = str(row[0])
        if table_name.lower() == expected_lower:
            return table_name
    return None


# Obtiene el conjunto de columnas disponibles en una tabla.
def _get_columns(conn: sqlite3.Connection, table_name: str) -> set[str]:
    rows = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    return {str(row[1]).lower() for row in rows}


# Importa convalidaciones desde una base SQLite de origen.
def _load_from_source_db(conn: sqlite3.Connection, source_db_path: Path) -> int:
    if not source_db_path.exists():
        raise FileNotFoundError(f"Source DB not found: {source_db_path}")

    source_conn = sqlite3.connect(str(source_db_path))
    source_conn.row_factory = sqlite3.Row
    try:
        conv_table = _find_table_name(source_conn, "convalidacion")
        links_table = _find_table_name(source_conn, "convalidacion_links")
        if not conv_table or not links_table:
            raise ValueError(
                "Source DB must include tables Convalidacion and Convalidacion_links."
            )

        link_columns = _get_columns(source_conn, links_table)
        conv_columns = _get_columns(source_conn, conv_table)
        conv_fk_col = "convalidacion_id" if "convalidacion_id" in link_columns else "convalid_id"
        if conv_fk_col not in link_columns:
            raise ValueError(
                f"Table {links_table} must include convalidacion_id or convalid_id."
            )

        conv_rows = source_conn.execute(
            f"SELECT * FROM {conv_table}"
        ).fetchall()
        conv_meta: dict[str, dict[str, Any]] = {}
        for row in conv_rows:
            row_dict = dict(row)
            conv_id = str(row_dict.get("id"))
            conv_meta[conv_id] = {
                "source_doc": row_dict.get("source_doc") if "source_doc" in conv_columns else None,
                "source_anexo": row_dict.get("source_anexo") if "source_anexo" in conv_columns else None,
                "source_page": row_dict.get("source_page") if "source_page" in conv_columns else None,
            }

        links = source_conn.execute(
            f"""
            SELECT {conv_fk_col} AS conv_fk, link_id, link_item, origen_destino
            FROM {links_table}
            WHERE link_id IS NOT NULL
              AND lower(link_item) = 'modulo'
            """
        ).fetchall()

        grouped: dict[str, dict[str, set[int]]] = {}
        for link in links:
            conv_fk = str(link["conv_fk"])
            item = grouped.setdefault(conv_fk, {"origen": set(), "destino": set()})
            side = str(link["origen_destino"]).strip().lower()
            link_id = int(link["link_id"])
            if side == "origen":
                item["origen"].add(link_id)
            elif side == "destino":
                item["destino"].add(link_id)

        created = 0
        for conv_fk, parts in grouped.items():
            origenes = sorted(parts["origen"])
            destinos = sorted(parts["destino"])
            if not origenes or not destinos:
                continue

            meta = conv_meta.get(conv_fk, {})
            source_doc = meta.get("source_doc")
            source_anexo = meta.get("source_anexo")
            source_page = meta.get("source_page")
            source_link = None
            if source_doc:
                source_link = str(source_doc)
                if source_anexo is not None:
                    source_link = f"{source_doc}#anexo-{source_anexo}"

            for destino_id in destinos:
                create_convalidacion(
                    conn,
                    id_modulo_destino=int(destino_id),
                    source_link=source_link,
                    source_page=int(source_page) if source_page is not None else None,
                    origen_modulos=origenes,
                    rule_mode="ALL",
                    source_doc=str(source_doc) if source_doc else None,
                    source_anexo=int(source_anexo) if source_anexo is not None else None,
                )
                created += 1
        return created
    finally:
        source_conn.close()


# Punto de entrada principal del script.
def main() -> None:
    args = parse_args()
    target_db = Path(args.db)
    init_db(DBConfig(path=target_db))
    conn = connect(DBConfig(path=target_db))
    try:
        if args.reset:
            clear_convalidaciones(conn)

        created_total = 0
        if args.json:
            created_total += _load_from_json(conn, Path(args.json))
        if args.source_db:
            created_total += _load_from_source_db(conn, Path(args.source_db))

        print(f"Convalidaciones loaded into {target_db}")
        print(f"Created rules: {created_total}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
