"""Punto de entrada para construir las convalidaciones desde el PDF."""

import argparse
import hashlib
import sqlite3
from pathlib import Path

import pdfplumber

from .constants import (
    ANEXO_MAP,
    ANEXOS_VALIDOS,
    DB_DEFAULT,
    PDF_DEFAULT,
    TABLE_SETTINGS,
)
from .db import ensure_tables, insert_convalidacion, insert_link, load_reference_ids
from .parsing import (
    detect_anexo_for_table,
    normalize_table_rows,
    parse_anexo_I_table,
    parse_anexo_IV_cualquier,
    parse_cycle_mapping_table,
)


def conv_id_for(page_idx: int, anexo: int, table_idx: int, row_idx: int) -> str:
    """ID estable basado en origen del dato (anexo/página/tabla/fila)."""
    raw = f"BOE-A-2020-17274|{anexo}|{page_idx}|{table_idx}|{row_idx}"
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]


def parse_boe(conn, pdf_path: Path, lookups) -> int:
    """Recorre el PDF, detecta anexos y vuelca convalidaciones."""
    cur = conn.cursor()
    inserted_links = 0
    current_anexo = None

    with pdfplumber.open(pdf_path) as pdf:
        for page_idx, page in enumerate(pdf.pages, start=1):
            page_text = page.extract_text() or ""
            if "ANEXO I" in page_text:
                current_anexo = "I"
            elif "ANEXO II" in page_text:
                current_anexo = "II"
            elif "ANEXO III" in page_text:
                current_anexo = "III"
            elif "ANEXO IV" in page_text:
                current_anexo = "IV"

            tables = page.extract_tables(TABLE_SETTINGS) or []
            if not tables:
                continue

            for table_idx, table in enumerate(tables):
                rows = normalize_table_rows(table)
                if not rows:
                    continue

                anexo = detect_anexo_for_table(current_anexo, rows, page_text)
                if anexo not in ANEXOS_VALIDOS:
                    continue

                anexo_num = ANEXO_MAP[anexo]
                if anexo == "I":
                    # Anexo I: estructura distinta (familias, grados y ciclos)
                    entries = parse_anexo_I_table(rows)
                elif anexo == "II":
                    # Anexo II: LO 1/1990 ↔ LO 2/2006
                    entries = parse_cycle_mapping_table(rows)
                elif anexo == "III":
                    # Anexo III: LO 2/2006 ↔ LO 2/2006
                    entries = parse_cycle_mapping_table(rows)
                else:
                    # Anexo IV: casos generales y excepciones
                    if rows and rows[0] and rows[0][0].lower().startswith("cualquier ciclo formativo"):
                        entries = parse_anexo_IV_cualquier(rows)
                    else:
                        entries = parse_cycle_mapping_table(rows)

                if not entries:
                    continue

                for row_idx, (origin_items, dest_items) in enumerate(entries):
                    if not origin_items or not dest_items:
                        continue
                    conv_id = conv_id_for(page_idx, anexo_num, table_idx, row_idx)
                    insert_convalidacion(cur, conv_id, anexo_num, page_idx)

                    seen = set()
                    for item in origin_items:
                        key = (item.item_type, item.name, item.rd, "origen")
                        if key in seen:
                            continue
                        seen.add(key)
                        insert_link(cur, conv_id, item, "origen", lookups)
                        inserted_links += 1
                    for item in dest_items:
                        key = (item.item_type, item.name, item.rd, "destino")
                        if key in seen:
                            continue
                        seen.add(key)
                        insert_link(cur, conv_id, item, "destino", lookups)
                        inserted_links += 1

    return inserted_links


def main() -> None:
    """CLI principal."""
    parser = argparse.ArgumentParser(
        description="Create Convalidacion tables and load BOE-A-2020-17274 into them."
    )
    parser.add_argument("--db", default=str(DB_DEFAULT))
    parser.add_argument("--pdf", default=str(PDF_DEFAULT))
    parser.add_argument("--reset", action="store_true")
    args = parser.parse_args()

    db_path = Path(args.db)
    pdf_path = Path(args.pdf)

    if not db_path.exists():
        raise FileNotFoundError(f"DB not found: {db_path}")
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    conn = sqlite3.connect(db_path)
    ensure_tables(conn, reset=args.reset)
    lookups = load_reference_ids(conn)

    inserted_links = parse_boe(conn, pdf_path, lookups)
    conn.commit()
    conn.close()

    print(f"Loaded convalidaciones into {db_path}")
    print(f"Inserted links: {inserted_links}")


if __name__ == "__main__":
    main()
