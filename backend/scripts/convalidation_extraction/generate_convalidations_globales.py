"""
generate_convalidations_otros.py
===============================
Genera convalidaciones "globales" para módulos que son comunes a todos los ciclos,
como FOL (Formación y Orientación Laboral) y EIE (Empresa e Iniciativa Emprendedora).

Para cada módulo definido en rules_otros.py, busca todas sus apariciones en la BD
y crea una regla de convalidación para cada una, teniendo como orígenes a todas las demás.
"""

import argparse
import sqlite3
import os
import sys

# Añadir el directorio actual al path para importar db_helper
sys.path.insert(0, os.path.dirname(__file__))

from db_helper import (
    get_connection,
    DEFAULT_DB,
    convalidacion_exists,
    convalidacion_ciclo_exists,
    get_ciclo_id,
    get_grado_id,
    get_familia_id,
    get_modulos_por_ciclo,
)

# Importar la lista de módulos globales
from reglas_convalidacion.rules_otros import MODULOS_GLOBALES, REGLAS_MODULO_A_MODULO

OUTPUT_SQL = os.path.join(os.path.dirname(__file__), "..", "4_load_convalidations_global.sql")
SOURCE_LINK = "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf"
SOURCE_PAGE = 124839


def get_rule_source(regla: dict | None = None) -> tuple[str, int]:
    source_link = SOURCE_LINK
    source_page = SOURCE_PAGE
    if regla:
        source_link = regla.get("source_link") or source_link
        source_page = regla.get("source_page") or source_page
    return source_link, source_page


def get_modulo_scope(cursor: sqlite3.Cursor, modulo_id: int) -> tuple[int | None, int | None]:
    row = cursor.execute(
        """
        SELECT c.id_familia, c.id_grado
        FROM modulos m
        JOIN ciclos c ON c.id = m.id_ciclo
        WHERE m.id = ?
        """,
        (modulo_id,),
    ).fetchone()
    if not row:
        return None, None
    return row["id_familia"], row["id_grado"]


def get_modulos_by_rule(cursor: sqlite3.Cursor, regla: dict, prefix: str) -> list[int]:
    id_oficial = regla.get(f"id_oficial_{prefix}")
    nombre_modulo = regla.get(f"modulo_{prefix}")

    if id_oficial:
        cursor.execute("SELECT id FROM modulos WHERE id_oficial = ?", (id_oficial,))
    elif nombre_modulo:
        cursor.execute("SELECT id FROM modulos WHERE LOWER(nombre) = LOWER(?)", (nombre_modulo,))
    else:
        raise ValueError(
            f"La regla debe definir 'id_oficial_{prefix}' o 'modulo_{prefix}': {regla}"
        )

    return [row["id"] for row in cursor.fetchall()]


def load_existing_single_origin_pairs(cursor: sqlite3.Cursor) -> set[tuple[int, int]]:
    """
    Precarga las convalidaciones de un único módulo origen para evitar
    consultar SQLite en cada iteración de los bucles O(n^2).
    """
    cursor.execute(
        """
        SELECT cv.id_modulo_destino, co.id_modulo
        FROM convalidacion cv
        JOIN convalidacion_origen co ON co.conv_id = cv.id
        GROUP BY cv.id, cv.id_modulo_destino, co.id_modulo
        HAVING COUNT(*) = 1
        """
    )
    return {(row["id_modulo_destino"], row["id_modulo"]) for row in cursor.fetchall()}

def get_next_conv_id() -> int:
    with sqlite3.connect(DEFAULT_DB) as conn:
        row = conn.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM convalidacion").fetchone()
    return row[0]


def get_next_conv_ciclo_id() -> int:
    with sqlite3.connect(DEFAULT_DB) as conn:
        row = conn.execute("SELECT COALESCE(MAX(conv_id_ciclo), 0) + 1 FROM convalidacion_ciclo").fetchone()
    return row[0]

def generate_global_rules(dry_run: bool = False) -> list[str]:
    conn = get_connection()
    cursor = conn.cursor()
    
    conv_id = get_next_conv_id()
    conv_ciclo_id = get_next_conv_ciclo_id()
    existing_single_origin_pairs = load_existing_single_origin_pairs(cursor)
    sql_lines = []
    
    sql_lines.append("-- ==========================================================")
    sql_lines.append("-- Convalidaciones GLOBALES generadas por generate_convalidations_otros.py")
    sql_lines.append("-- ==========================================================")
    sql_lines.append("")
    sql_lines.append("PRAGMA foreign_keys = OFF;")
    sql_lines.append("")

    total_inserted = 0
    total_skipped = 0

    print(f"Generando reglas globales para: {', '.join(MODULOS_GLOBALES)}")
    
    for modulo_global in MODULOS_GLOBALES:
        if isinstance(modulo_global, dict):
            nombre_mod = modulo_global["nombre"]
            source_link, source_page = get_rule_source(modulo_global)
            same_family_only = bool(modulo_global.get("same_family_only"))
            same_grado_only = bool(modulo_global.get("same_grado_only"))
        else:
            nombre_mod = modulo_global
            source_link, source_page = get_rule_source()
            same_family_only = False
            same_grado_only = False

        # Buscar todos los módulos con este nombre
        # Usamos LIKE para ser más flexibles con mayúsculas/minúsculas si fuera necesario,
        # pero aquí buscamos coincidencia exacta de nombre según la lista.
        cursor.execute("SELECT id, id_ciclo FROM modulos WHERE nombre = ?", (nombre_mod,))
        modulos = cursor.fetchall()
        print(len(modulos))
        #print(f"\nProcesando '{nombre_mod}': {len(modulos)} instancias encontradas.")
        
        for m_dest in modulos:
            id_dest = m_dest['id']
            dest_familia_id, dest_grado_id = get_modulo_scope(cursor, id_dest)

            for m_orig in modulos:
                id_orig = m_orig['id']
                if id_orig == id_dest:
                    continue

                orig_familia_id, orig_grado_id = get_modulo_scope(cursor, id_orig)
                if same_family_only and (
                    dest_familia_id is None
                    or orig_familia_id is None
                    or dest_familia_id != orig_familia_id
                ):
                    total_skipped += 1
                    continue
                if same_grado_only and (
                    dest_grado_id is None
                    or orig_grado_id is None
                    or dest_grado_id != orig_grado_id
                ):
                    total_skipped += 1
                    continue

                # Cada origen tiene su propio conv_id (OR semántico en el modelo de datos)
                if (id_dest, id_orig) in existing_single_origin_pairs:
                    total_skipped += 1
                    continue

                sql_lines.append(f"-- Regla global '{nombre_mod}': destino={id_dest}, origen={id_orig}")
                sql_lines.append(
                    f"INSERT INTO convalidacion (id, source_link, source_page, id_modulo_destino) "
                    f"VALUES ({conv_id}, '{source_link}', {source_page}, {id_dest});"
                )
                sql_lines.append(
                    f"INSERT INTO convalidacion_origen (conv_id, id_modulo) "
                    f"VALUES ({conv_id}, {id_orig});"
                )
                sql_lines.append("")

                #if dry_run:
                #    print(f"  [Dry-run] conv_id={conv_id}: destino={id_dest} <- origen={id_orig}")

                conv_id += 1
                total_inserted += 1
                existing_single_origin_pairs.add((id_dest, id_orig))
            
    sql_lines.append("PRAGMA foreign_keys = ON;")

    # ── TIPO 3: módulo A (id_oficial) → módulo B (id_oficial) ─────────
    print(f"\nGenerando reglas TIPO 3 (modulo_a_modulo): {len(REGLAS_MODULO_A_MODULO)} reglas")

    for regla in REGLAS_MODULO_A_MODULO:
        origen_label = regla.get("id_oficial_origen") or regla.get("modulo_origen")
        destino_label = regla.get("id_oficial_destino") or regla.get("modulo_destino")
        source_link, source_page = get_rule_source(regla)

        origenes = get_modulos_by_rule(cursor, regla, "origen")
        destinos = get_modulos_by_rule(cursor, regla, "destino")

        print(
            f"  {origen_label} -> {destino_label}: "
            f"{len(origenes)} origenes, {len(destinos)} destinos"
        )

        for id_dest in destinos:
            for id_orig in origenes:
                if (id_dest, id_orig) in existing_single_origin_pairs:
                    total_skipped += 1
                    continue

                sql_lines.append(
                    f"-- TIPO3: {origen_label} -> {destino_label}: orig={id_orig}, dest={id_dest}"
                )
                sql_lines.append(
                    f"INSERT INTO convalidacion (id, source_link, source_page, id_modulo_destino) "
                    f"VALUES ({conv_id}, '{source_link}', {source_page}, {id_dest});"
                )
                sql_lines.append(
                    f"INSERT INTO convalidacion_origen (conv_id, id_modulo) "
                    f"VALUES ({conv_id}, {id_orig});"
                )
                sql_lines.append("")
                conv_id += 1
                total_inserted += 1
                existing_single_origin_pairs.add((id_dest, id_orig))

    sql_lines.append("PRAGMA foreign_keys = ON;")
    
    print(f"\nFinalizado:")
    print(f"  - Reglas nuevas generadas: {total_inserted}")
    print(f"  - Reglas ya existentes: {total_skipped}")
    
    conn.close()
    return sql_lines

def save_sql(sql_lines: list[str]) -> None:
    with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))
    print(f"\n✔ SQL guardado en: {OUTPUT_SQL}")

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
                print(f"  ✗ SQL Error: {e}")
        conn.commit()
    print(f"\n✔ Cambios aplicados a la BD.")

def main():
    parser = argparse.ArgumentParser(description="Genera reglas de convalidación globales.")
    parser.add_argument("--sql", action="store_true", help="Vuelca a fichero .sql")
    parser.add_argument("--db", action="store_true", help="Aplica a la base de datos")
    parser.add_argument("--dry-run", action="store_true", help="Solo muestra lo que haría")
    
    args = parser.parse_args()
    
    if not args.sql and not args.db and not args.dry_run:
        parser.print_help()
        return

    sql_lines = generate_global_rules(dry_run=args.dry_run)
    #print(sql_lines)
    if args.dry_run:
        print("\n(Modo dry-run: no se ha guardado nada)")
        return

    if args.sql:
        save_sql(sql_lines)
    
    if args.db:
        apply_to_db(sql_lines)

if __name__ == "__main__":
    main()
