"""
generate_external_convalidations.py
====================================
Genera convalidaciones externas de ingles en el modelo unificado:
- Los origenes externos se guardan como modulos de un ciclo especial
  "Acreditaciones externas".
- Las reglas se guardan en convalidacion + convalidacion_origen.

USO:
    python generate_external_convalidations.py --dry-run
    python generate_external_convalidations.py --sql
    python generate_external_convalidations.py --db
    python generate_external_convalidations.py --sql --db
"""

import argparse
import os
import sqlite3
import sys

sys.path.insert(0, os.path.dirname(__file__))

from db_helper import DEFAULT_DB

OUTPUT_SQL = os.path.join(os.path.dirname(__file__), "..", "6_load_convalidations_externa.sql")
CICLO_ACREDITACIONES_NOMBRE = "Acreditaciones externas"
SOURCE_LINK = "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf"
SOURCE_PAGE = 124840

ACREDITACIONES_INGLES = [
    {
        "nombre": "Certificado del Ciclo Elemental de Inglés (EOI)",
        "tipo": "certificado_idioma",
        "destinos_id_oficial": ["0156"],
    },
    {
        "nombre": "Certificado de Nivel Intermedio (B1) de Inglés (EOI)",
        "tipo": "certificado_idioma",
        "destinos_id_oficial": ["0156"],
    },
    {
        "nombre": "Certificado de Aptitud de Inglés (EOI)",
        "tipo": "certificado_idioma",
        "destinos_id_oficial": ["0156", "0179"],
    },
    {
        "nombre": "Certificado de Nivel Avanzado (B2) o superior de Inglés (EOI)",
        "tipo": "certificado_idioma",
        "destinos_id_oficial": ["0156", "0179"],
    },
    {
        "nombre": "Título de Grado en Filología Inglesa o en Traducción e Interpretación (Inglés)",
        "tipo": "titulo_universitario",
        "destinos_id_oficial": ["0156", "0179"],
    },
]


def sql_quote(value: str) -> str:
    return value.replace("'", "''")


def get_modulos_by_id_oficial(conn: sqlite3.Connection, id_oficial: str) -> list[int]:
    rows = conn.execute(
        "SELECT id FROM modulos WHERE id_oficial = ? ORDER BY id",
        (id_oficial,),
    ).fetchall()
    return [r[0] for r in rows]


def modulo_origen_id(conn: sqlite3.Connection, nombre: str) -> int | None:
    row = conn.execute(
        """
        SELECT m.id
        FROM modulos m
        JOIN ciclos c ON c.id = m.id_ciclo
        WHERE c.nombre = ? AND m.nombre = ?
        """,
        (CICLO_ACREDITACIONES_NOMBRE, nombre),
    ).fetchone()
    return row[0] if row else None


def convalidacion_ext_unificada_exists(
    conn: sqlite3.Connection,
    id_modulo_origen: int,
    id_modulo_destino: int,
) -> bool:
    return (
        conn.execute(
            """
            SELECT 1
            FROM convalidacion cv
            JOIN convalidacion_origen co ON co.conv_id = cv.id
            WHERE cv.id_modulo_destino = ?
              AND co.id_modulo = ?
            LIMIT 1
            """,
            (id_modulo_destino, id_modulo_origen),
        ).fetchone()
        is not None
    )


def generate(dry_run: bool = False) -> list[str]:
    conn = sqlite3.connect(DEFAULT_DB)

    sql_lines: list[str] = []
    sql_lines.append("-- ===========================================================")
    sql_lines.append("-- Acreditaciones externas de ingles en modelo unificado")
    sql_lines.append("-- Generado por: generate_external_convalidations.py")
    sql_lines.append("-- Tablas destino: modulos + convalidacion + convalidacion_origen")
    sql_lines.append("-- ===========================================================")
    sql_lines.append("")
    sql_lines.append("PRAGMA foreign_keys = OFF;")
    sql_lines.append("")
    sql_lines.append("-- Ciclo contenedor para acreditaciones externas")
    sql_lines.append(
        "INSERT INTO ciclos (id, nombre, id_oficial, normativa, id_familia, id_grado) "
        "SELECT COALESCE(MAX(id), 0) + 1, 'Acreditaciones externas', 'ACREDITACIONES_EXTERNAS', NULL, NULL, NULL "
        "FROM ciclos "
        "WHERE NOT EXISTS (SELECT 1 FROM ciclos WHERE nombre = 'Acreditaciones externas');"
    )
    sql_lines.append("")

    total_origenes_nuevos = 0
    total_reglas_nuevas = 0
    total_reglas_existentes = 0

    for acred in ACREDITACIONES_INGLES:
        nombre = acred["nombre"]
        tipo = acred["tipo"]
        nombre_sql = sql_quote(nombre)
        tipo_sql = sql_quote(tipo)

        print(f"\nAcreditacion/origen: '{nombre}'")

        id_origen = modulo_origen_id(conn, nombre)
        is_new_origen = id_origen is None

        sql_lines.append(f"-- Origen externo: {nombre}")
        sql_lines.append(
            "INSERT INTO modulos (id, nombre, id_oficial, id_ciclo) "
            "SELECT COALESCE(MAX(id), 0) + 1, "
            f"'{nombre_sql}', '{tipo_sql}', (SELECT id FROM ciclos WHERE nombre = 'Acreditaciones externas') "
            "FROM modulos "
            "WHERE NOT EXISTS ("
            "  SELECT 1 FROM modulos m "
            "  JOIN ciclos c ON c.id = m.id_ciclo "
            "  WHERE c.nombre = 'Acreditaciones externas' "
            f"    AND m.nombre = '{nombre_sql}'"
            ");"
        )

        id_origen_sql = (
            "(SELECT m.id FROM modulos m "
            " JOIN ciclos c ON c.id = m.id_ciclo "
            " WHERE c.nombre = 'Acreditaciones externas' "
            f"   AND m.nombre = '{nombre_sql}' "
            " LIMIT 1)"
        )

        if is_new_origen:
            total_origenes_nuevos += 1
            if dry_run:
                print("  [Dry-run] Nuevo modulo origen externo")
        elif dry_run:
            print(f"  Ya existia como modulo id={id_origen}")

        for id_oficial in acred["destinos_id_oficial"]:
            modulo_destino_ids = get_modulos_by_id_oficial(conn, id_oficial)
            if not modulo_destino_ids:
                print(f"  WARN: no hay modulos destino con id_oficial='{id_oficial}'")
                continue

            print(f"  Modulo destino {id_oficial}: {len(modulo_destino_ids)} instancias")

            for id_modulo_destino in modulo_destino_ids:
                if id_origen and convalidacion_ext_unificada_exists(conn, id_origen, id_modulo_destino):
                    total_reglas_existentes += 1
                    continue

                sql_lines.append(
                    "INSERT INTO convalidacion (source_link, source_page, id_modulo_destino) "
                    f"SELECT '{SOURCE_LINK}', {SOURCE_PAGE}, {id_modulo_destino} "
                    "WHERE NOT EXISTS ("
                    "  SELECT 1 "
                    "  FROM convalidacion cv "
                    "  JOIN convalidacion_origen co ON co.conv_id = cv.id "
                    f"  WHERE cv.id_modulo_destino = {id_modulo_destino} "
                    f"    AND co.id_modulo = {id_origen_sql}"
                    ");"
                )
                sql_lines.append(
                    "INSERT OR IGNORE INTO convalidacion_origen (conv_id, id_modulo) "
                    f"SELECT cv.id, {id_origen_sql} "
                    "FROM convalidacion cv "
                    f"WHERE cv.id_modulo_destino = {id_modulo_destino} "
                    "  AND NOT EXISTS ("
                    "      SELECT 1 FROM convalidacion_origen co "
                    "      WHERE co.conv_id = cv.id "
                    f"        AND co.id_modulo <> {id_origen_sql}"
                    "  ) "
                    "ORDER BY cv.id DESC "
                    "LIMIT 1;"
                )
                total_reglas_nuevas += 1

                if dry_run:
                    print(f"    -> regla nueva hacia id_modulo={id_modulo_destino}")

        sql_lines.append("")

    sql_lines.append("PRAGMA foreign_keys = ON;")
    sql_lines.append("")

    print(f"\n{'=' * 60}")
    print(f"  Origenes externos nuevos : {total_origenes_nuevos}")
    print(f"  Reglas nuevas            : {total_reglas_nuevas}")
    print(f"  Reglas ya existentes     : {total_reglas_existentes}")
    print(f"{'=' * 60}")

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
                print(f"  Error SQL: {e}\n  -> {stmt[:160]}")
        conn.commit()
    print("Cambios aplicados a la BD.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Genera convalidaciones externas de ingles en modelo unificado "
            "(modulos + convalidacion + convalidacion_origen)."
        )
    )
    parser.add_argument("--sql", action="store_true", help="Vuelca a fichero .sql")
    parser.add_argument("--db", action="store_true", help="Aplica a la BD SQLite")
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
