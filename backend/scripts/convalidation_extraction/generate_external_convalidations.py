"""
generate_external_convalidations.py
====================================
Genera convalidaciones externas de inglés.

Inserta en `acreditacion_externa` los certificados/títulos de inglés y en
`convalidacion_externa` las reglas 1-to-1 hacia todos los módulos 0156 (Inglés)
y 0179 (Inglés) existentes en la BD.

Reglas según normativa:
  Certificado Ciclo Elemental (EOI)      → 0156
  Certificado Nivel Intermedio B1 (EOI)  → 0156
  Certificado de Aptitud (EOI)           → 0156 + 0179
  Certificado Nivel Avanzado B2+ (EOI)   → 0156 + 0179
  Grado Filología Inglesa / Traducción   → 0156 + 0179

USO:
    python generate_external_convalidations.py --dry-run
    python generate_external_convalidations.py --sql
    python generate_external_convalidations.py --db
    python generate_external_convalidations.py --sql --db
"""

import sqlite3
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from db_helper import DEFAULT_DB

OUTPUT_SQL = os.path.join(os.path.dirname(__file__), "..", "6_load_convalidations_externa.sql")

# ──────────────────────────────────────────────────────────────────────────────
# Definición de acreditaciones externas de inglés
# destinos_id_oficial: id_oficial de los módulos que se convalidan
# ──────────────────────────────────────────────────────────────────────────────
ACREDITACIONES_INGLES = [
    {
        "nombre": "Certificado del Ciclo Elemental de Inglés (EOI)",
        "tipo":   "certificado_idioma",
        "destinos_id_oficial": ["0156"],
    },
    {
        "nombre": "Certificado de Nivel Intermedio (B1) de Inglés (EOI)",
        "tipo":   "certificado_idioma",
        "destinos_id_oficial": ["0156"],
    },
    {
        "nombre": "Certificado de Aptitud de Inglés (EOI)",
        "tipo":   "certificado_idioma",
        "destinos_id_oficial": ["0156", "0179"],
    },
    {
        "nombre": "Certificado de Nivel Avanzado (B2) o superior de Inglés (EOI)",
        "tipo":   "certificado_idioma",
        "destinos_id_oficial": ["0156", "0179"],
    },
    {
        "nombre": "Título de Grado en Filología Inglesa o en Traducción e Interpretación (Inglés)",
        "tipo":   "titulo_universitario",
        "destinos_id_oficial": ["0156", "0179"],
    },
]


def get_modulos_by_id_oficial(conn: sqlite3.Connection, id_oficial: str) -> list[int]:
    rows = conn.execute(
        "SELECT id FROM modulos WHERE id_oficial = ?", (id_oficial,)
    ).fetchall()
    return [r[0] for r in rows]


def acreditacion_id(conn: sqlite3.Connection, nombre: str) -> int | None:
    row = conn.execute(
        "SELECT id FROM acreditacion_externa WHERE nombre = ?", (nombre,)
    ).fetchone()
    return row[0] if row else None


def convalidacion_ext_exists(conn: sqlite3.Connection, id_acred: int, id_modulo: int) -> bool:
    return conn.execute(
        "SELECT 1 FROM convalidacion_externa WHERE id_acreditacion = ? AND id_modulo_destino = ?",
        (id_acred, id_modulo),
    ).fetchone() is not None


def generate(dry_run: bool = False) -> list[str]:
    conn = sqlite3.connect(DEFAULT_DB)

    sql_lines = []
    sql_lines.append("-- ===========================================================")
    sql_lines.append("-- Acreditaciones externas de inglés + convalidacion_externa")
    sql_lines.append("-- Generado por: generate_external_convalidations.py")
    sql_lines.append("-- ===========================================================")
    sql_lines.append("")
    sql_lines.append("PRAGMA foreign_keys = OFF;")
    sql_lines.append("")

    total_acred   = 0
    total_conv    = 0
    total_skipped = 0

    for acred in ACREDITACIONES_INGLES:
        nombre = acred["nombre"]
        tipo   = acred["tipo"]

        print(f"\nAcreditacion: '{nombre}'")

        # ── Insertar acreditacion_externa si no existe ─────────────────
        id_acred = acreditacion_id(conn, nombre)
        is_new   = id_acred is None

        if is_new:
            sql_lines.append(f"-- Acreditacion externa: {nombre}")
            sql_lines.append(
                f"INSERT INTO acreditacion_externa (nombre, tipo) "
                f"VALUES ('{nombre}', '{tipo}');"
            )
            # Placeholder para el SQL; en --db se usará la subquery
            id_acred_sql = f"(SELECT id FROM acreditacion_externa WHERE nombre='{nombre}')"
            if dry_run:
                print(f"  [Dry-run] Nueva acreditacion")
            total_acred += 1
        else:
            id_acred_sql = str(id_acred)
            if dry_run:
                print(f"  Ya existia con id={id_acred}")

        # ── Convalidaciones hacia cada módulo destino ──────────────────
        for id_oficial in acred["destinos_id_oficial"]:
            modulo_ids = get_modulos_by_id_oficial(conn, id_oficial)
            if not modulo_ids:
                print(f"  WARN: no hay modulos con id_oficial='{id_oficial}'")
                continue

            print(f"  Modulo {id_oficial}: {len(modulo_ids)} instancias")

            for id_modulo in modulo_ids:
                if not is_new and convalidacion_ext_exists(conn, id_acred, id_modulo):
                    total_skipped += 1
                    continue

                sql_lines.append(
                    f"INSERT OR IGNORE INTO convalidacion_externa (id_acreditacion, id_modulo_destino) "
                    f"VALUES ({id_acred_sql}, {id_modulo});"
                )
                total_conv += 1

                if dry_run:
                    print(f"    -> id_modulo={id_modulo} (id_oficial={id_oficial})")

        sql_lines.append("")

    sql_lines.append("PRAGMA foreign_keys = ON;")
    sql_lines.append("")

    print(f"\n{'='*55}")
    print(f"  Acreditaciones nuevas : {total_acred}")
    print(f"  Reglas generadas      : {total_conv}")
    print(f"  Ya existian           : {total_skipped}")
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
                print(f"  Error SQL: {e}\n  -> {stmt[:100]}")
        conn.commit()
    print("Cambios aplicados a la BD.")


def main():
    parser = argparse.ArgumentParser(
        description="Genera convalidaciones externas de inglés (acreditaciones EOI y universitarias)."
    )
    parser.add_argument("--sql",     action="store_true", help="Vuelca a fichero .sql")
    parser.add_argument("--db",      action="store_true", help="Aplica a la BD SQLite")
    parser.add_argument("--dry-run", action="store_true", help="Muestra lo que haria sin escribir nada")
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
