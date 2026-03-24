"""
generate_convalidations_ciclo_universal.py
==========================================
Genera convalidaciones del tipo:
  "Ciclo completo X  →  módulo Y en CUALQUIER ciclo que lo tenga"

Ejemplo:
  Tener Gestión Administrativa (ciclo completo) convalida EIE en cualquier ciclo.

Las reglas se definen en:
  reglas_convalidacion/rules_otros.py  →  REGLAS_CICLO_A_MODULO_UNIVERSAL

MODOS DE USO
─────────────
  python generate_convalidations_ciclo_universal.py --dry-run
  python generate_convalidations_ciclo_universal.py --sql
  python generate_convalidations_ciclo_universal.py --db
  python generate_convalidations_ciclo_universal.py --sql --db
"""

import argparse
import sqlite3
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from db_helper import (
    get_connection,
    DEFAULT_DB,
    get_ciclo_id,
    get_grado_id,
    get_familia_id,
    get_modulos_por_ciclo,
    convalidacion_ciclo_exists,
)
from reglas_convalidacion.rules_otros import REGLAS_CICLO_A_MODULO_UNIVERSAL

OUTPUT_SQL = os.path.join(os.path.dirname(__file__), "..", "5_load_convalidations_ciclo_global.sql")
SOURCE_LINK = "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf"
SOURCE_PAGE = 124840


def get_next_conv_id() -> int:
    with sqlite3.connect(DEFAULT_DB) as conn:
        row = conn.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM convalidacion").fetchone()
    return row[0]


def get_next_conv_ciclo_id() -> int:
    with sqlite3.connect(DEFAULT_DB) as conn:
        row = conn.execute("SELECT COALESCE(MAX(conv_id_ciclo), 0) + 1 FROM convalidacion_ciclo").fetchone()
    return row[0]


def load_existing_conv_ciclo_pairs(cursor: sqlite3.Cursor) -> set[tuple[int, int]]:
    cursor.execute("SELECT id_modulo_destino, id_ciclo_origen FROM convalidacion_ciclo")
    return {(row["id_modulo_destino"], row["id_ciclo_origen"]) for row in cursor.fetchall()}


def generate(dry_run: bool = False) -> list[str]:
    conn = get_connection()
    cursor = conn.cursor()

    conv_ciclo_id = get_next_conv_ciclo_id()
    existing_conv_ciclo_pairs = load_existing_conv_ciclo_pairs(cursor)
    sql_lines = []

    sql_lines.append("-- ==========================================================")
    sql_lines.append("-- Convalidaciones ciclo_completo→modulo_universal")
    sql_lines.append("-- generate_convalidations_ciclo_universal.py")
    sql_lines.append("-- ==========================================================")
    sql_lines.append("")
    sql_lines.append("PRAGMA foreign_keys = OFF;")
    sql_lines.append("")

    total_inserted = 0
    total_skipped = 0
    total_errors = 0

    for i, regla in enumerate(REGLAS_CICLO_A_MODULO_UNIVERSAL):
        label = f"Regla #{i + 1}"
        ciclo_nombre  = regla["ciclo_origen"]
        grado_nombre  = regla.get("grado_origen")
        familia_nombre = regla.get("familia_origen")

        # ── Resolver ciclo origen ──────────────────────────────────────
        id_grado  = get_grado_id(grado_nombre)   if grado_nombre   else None
        id_familia = get_familia_id(familia_nombre) if familia_nombre else None
        id_ciclo  = get_ciclo_id(ciclo_nombre, id_familia=id_familia, id_grado=id_grado)

        if id_ciclo is None:
            print(f"  ERROR {label}: ciclo '{ciclo_nombre}' no encontrado. SALTANDO.")
            total_errors += 1
            continue

        # ── Obtener todos los módulos del ciclo origen ─────────────────
        origen_ids = get_modulos_por_ciclo(id_ciclo)
        if not origen_ids:
            print(f"  WARN  {label}: ciclo id={id_ciclo} no tiene modulos. SALTANDO.")
            total_errors += 1
            continue

        print(f"\n{label}: ciclo '{ciclo_nombre}' (id={id_ciclo}) → {len(origen_ids)} modulos origen")

        # ── Buscar todas las instancias del módulo destino ─────────────
        nombre_dest = regla.get("modulo_destino_nombre")

        if nombre_dest:
            cursor.execute("SELECT id FROM modulos WHERE nombre = ?", (nombre_dest,))
        else:
            print(f"  ERROR {label}: no se especificó modulo_destino_nombre ni modulo_destino_codigo. SALTANDO.")
            total_errors += 1
            continue

        destinos = [row[0] for row in cursor.fetchall()]
        desc_dest = nombre_dest
        print(f"  Modulo destino '{desc_dest}': {len(destinos)} instancias en la BD")

        # ── Generar una convalidación por cada instancia destino ────────
        for id_dest in destinos:
            # Excluir el propio módulo destino de los orígenes
            # (puede ocurrir si el módulo destino pertenece al mismo ciclo origen)
            origen_ids_filtrados = [oid for oid in origen_ids if oid != id_dest]

            if not origen_ids_filtrados:
                print(f"  WARN: destino id={id_dest} es el unico modulo del ciclo, sin origenes validos.")
                continue

            if (id_dest, id_ciclo) in existing_conv_ciclo_pairs:
                print(f"  Ya existia convalidacion_ciclo para modulo destino id={id_dest} y ciclo origen id={id_ciclo}")
                total_skipped += 1
                continue

            sql_lines.append(f"-- {label}: ciclo '{ciclo_nombre}' (completo) -> modulo destino id={id_dest}")
            sql_lines.append(
                f"INSERT INTO convalidacion_ciclo (conv_id_ciclo, source_link, source_page, id_modulo_destino, id_ciclo_origen) "
                f"VALUES ({conv_ciclo_id}, '{SOURCE_LINK}', {SOURCE_PAGE}, {id_dest}, {id_ciclo});"
            )
            sql_lines.append("")

            if dry_run:
                print(f"  [Dry-run] conv_id_ciclo={conv_ciclo_id}: destino={id_dest} <- ciclo_origen={id_ciclo}")

            conv_ciclo_id += 1
            total_inserted += 1
            existing_conv_ciclo_pairs.add((id_dest, id_ciclo))

    sql_lines.append("PRAGMA foreign_keys = ON;")
    sql_lines.append("")

    print(f"\n{'='*55}")
    print(f"  Reglas procesadas : {len(REGLAS_CICLO_A_MODULO_UNIVERSAL)}")
    print(f"  Insertadas (OK)   : {total_inserted}")
    print(f"  Ya existian       : {total_skipped}")
    print(f"  Errores           : {total_errors}")
    print(f"{'='*55}")

    conn.close()
    return sql_lines


def save_sql(sql_lines: list[str]) -> None:
    with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))
    print(f"SQL guardado en: {OUTPUT_SQL}")


def apply_to_db(sql_lines: list[str]) -> None:
    statements = [
        line.strip()
        for line in sql_lines
        if line.strip() and not line.strip().startswith("--")
    ]
    with sqlite3.connect(DEFAULT_DB) as conn:
        for stmt in statements:
            try:
                conn.execute(stmt)
            except sqlite3.Error as e:
                print(f"  Error SQL: {e}")
        conn.commit()
    print("Cambios aplicados a la BD.")


def main():
    parser = argparse.ArgumentParser(
        description="Genera convalidaciones ciclo_completo -> modulo en cualquier ciclo."
    )
    parser.add_argument("--sql",     action="store_true", help="Vuelca a fichero .sql")
    parser.add_argument("--db",      action="store_true", help="Aplica a la BD SQLite")
    parser.add_argument("--dry-run", action="store_true", help="Solo muestra lo que haria")
    args = parser.parse_args()

    if not args.sql and not args.db and not args.dry_run:
        parser.print_help()
        return

    sql_lines = generate(dry_run=args.dry_run)

    if args.dry_run:
        print("\n(Modo dry-run: no se ha escrito nada)")
        return

    if args.sql:
        save_sql(sql_lines)

    if args.db:
        apply_to_db(sql_lines)


if __name__ == "__main__":
    main()
