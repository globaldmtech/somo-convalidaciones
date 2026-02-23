"""
generate_convalidations.py
==========================
Genera los INSERTs para las tablas `convalidacion` y `convalidacion_origen`
a partir de las reglas definidas en rules.py, y los aplica a la base de datos
(o los vuelca a un fichero SQL según el modo elegido).

MODOS DE USO
─────────────
1) Generar sólo el SQL (sin tocar la BD):
   python generate_convalidations.py --sql

2) Insertar directamente en la BD:
   python generate_convalidations.py --db

3) Ambas cosas:
   python generate_convalidations.py --sql --db

4) Vista previa (dry-run, sólo muestra lo que haría):
   python generate_convalidations.py --dry-run

El fichero SQL se guarda en: ../convalidaciones.sql
"""

import argparse
import glob
import importlib.util
import os
import sys
import sqlite3

# Añadir el directorio padre al path para poder importar db_helper
sys.path.insert(0, os.path.dirname(__file__))

from db_helper import (
    get_modulo_id,
    get_ciclo_id,
    get_grado_id,
    get_modulos_por_ciclo,
    convalidacion_exists,
    DEFAULT_DB,
)

OUTPUT_SQL = os.path.join(os.path.dirname(__file__), "..", "convalidaciones.sql")
RULES_DIR  = os.path.dirname(__file__)


# ─────────────────────────────────────────────────────────────────────
# Carga dinámica de archivos de reglas
# ─────────────────────────────────────────────────────────────────────

def load_rules(rules_file: str | None = None) -> list[dict]:
    """
    Carga y fusiona las listas CONVALIDACIONES de:
      - Un fichero concreto si se pasa rules_file  (ej. "rules_administracion_y_gestion.py")
      - Todos los ficheros rules_*.py de la carpeta si rules_file es None
    """
    if rules_file:
        pattern_paths = [os.path.join(RULES_DIR, rules_file)]
    else:
        pattern_paths = sorted(
            glob.glob(os.path.join(RULES_DIR, "rules_*.py"))
        )
        # Incluir también rules.py genérico si existe
        generic = os.path.join(RULES_DIR, "rules.py")
        if os.path.exists(generic):
            pattern_paths.insert(0, generic)

    all_rules: list[dict] = []
    for path in pattern_paths:
        spec = importlib.util.spec_from_file_location("_rules_module", path)
        mod  = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        reglas = getattr(mod, "CONVALIDACIONES", [])
        print(f"  📄 {os.path.basename(path)}: {len(reglas)} regla(s)")
        all_rules.extend(reglas)

    return all_rules


# ─────────────────────────────────────────────────────────────────────
# Resolución de IDs
# ─────────────────────────────────────────────────────────────────────

def resolve_ciclo(regla_key: str, nombre: str, familia: str | None, grado: str | None) -> int | None:
    """Resuelve el ID de un ciclo a partir de nombre parcial + filtros opcionales."""
    id_grado = None
    if grado:
        id_grado = get_grado_id(grado)
        if id_grado is None:
            print(f"  ⚠ WARN: No se encontró el grado '{grado}' para {regla_key}")

    id_familia = None
    if familia:
        from db_helper import get_familia_id
        id_familia = get_familia_id(familia)
        if id_familia is None:
            print(f"  ⚠ WARN: No se encontró la familia '{familia}' para {regla_key}")

    cid = get_ciclo_id(nombre, id_familia=id_familia, id_grado=id_grado)
    if cid is None:
        print(f"  ✗ ERROR: No se encontró el ciclo '{nombre}' para {regla_key}")
    return cid


def resolve_modulo(regla_key: str, nombre: str | None, codigo: str | None, id_ciclo: int | None) -> int | None:
    """Resuelve el ID de un módulo por código oficial o nombre parcial."""
    mid = get_modulo_id(
        nombre=nombre or "",
        id_ciclo=id_ciclo,
        id_oficial=codigo,
    )
    desc = codigo or nombre
    if mid is None:
        ciclo_desc = f"(ciclo_id={id_ciclo})" if id_ciclo else "(sin ciclo especificado)"
        print(f"  ✗ ERROR: No se encontró el módulo '{desc}' {ciclo_desc} para {regla_key}")
    return mid


# ─────────────────────────────────────────────────────────────────────
# Obtener el próximo ID disponible de convalidacion
# ─────────────────────────────────────────────────────────────────────

def get_next_conv_id() -> int:
    with sqlite3.connect(DEFAULT_DB) as conn:
        row = conn.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM convalidacion").fetchone()
    return row[0]


# ─────────────────────────────────────────────────────────────────────
# Generación principal
# ─────────────────────────────────────────────────────────────────────

def generate(dry_run: bool = False, rules_file: str | None = None) -> list[str]:
    """
    Resuelve todas las reglas y devuelve una lista de sentencias SQL INSERT.
    Si dry_run=True, solo imprime información sin generar SQL real.
    Si rules_file se especifica, solo carga ese fichero de reglas.
    """
    CONVALIDACIONES = load_rules(rules_file)
    print(f"  Total reglas cargadas: {len(CONVALIDACIONES)}\n")

    sql_lines: list[str] = []
    sql_lines.append("-- ==========================================================")
    sql_lines.append("-- Convalidaciones generadas por generate_convalidations.py")
    sql_lines.append("-- ==========================================================")
    sql_lines.append("")
    sql_lines.append("PRAGMA foreign_keys = OFF;")
    sql_lines.append("")

    conv_id = get_next_conv_id()
    errors = 0
    inserted = 0
    skipped = 0

    for i, regla in enumerate(CONVALIDACIONES):
        label = f"Regla #{i + 1}"

        # ── DESTINO ──────────────────────────────────────────────────
        ciclo_destino_nombre = regla.get("ciclo_destino", "")
        id_ciclo_destino = None
        if ciclo_destino_nombre:
            id_ciclo_destino = resolve_ciclo(
                label,
                ciclo_destino_nombre,
                familia=regla.get("familia_destino"),
                grado=regla.get("grado_destino"),
            )

        id_modulo_destino = resolve_modulo(
            label,
            nombre=regla.get("modulo_destino"),
            codigo=regla.get("codigo_destino"),
            id_ciclo=id_ciclo_destino,
        )

        if id_modulo_destino is None:
            errors += 1
            print(f"  → {label}: SALTADA por error en módulo destino.\n")
            continue

        # ── ORÍGENES ──────────────────────────────────────────────────
        origen_ids: list[int] = []
        for j, origen in enumerate(regla.get("origenes", [])):
            origen_label = f"{label} Origen #{j + 1}"
            id_ciclo_origen = None
            if origen.get("ciclo_origen"):
                id_ciclo_origen = resolve_ciclo(
                    origen_label,
                    origen["ciclo_origen"],
                    familia=origen.get("familia_origen"),
                    grado=origen.get("grado_origen"),
                )

            # ── CICLO COMPLETO: añadir TODOS los módulos del ciclo origen ──
            if origen.get("ciclo_completo_origen"):
                if id_ciclo_origen is None:
                    print(f"  ✗ ERROR: No se pudo resolver el ciclo para {origen_label} (ciclo completo), SALTANDO.")
                    errors += 1
                else:
                    ids_ciclo = get_modulos_por_ciclo(id_ciclo_origen)
                    if not ids_ciclo:
                        print(f"  ⚠ WARN: El ciclo id={id_ciclo_origen} no tiene módulos en la BD ({origen_label}).")
                    else:
                        print(f"  ✓ {origen_label}: ciclo completo → {len(ids_ciclo)} módulo(s) (ciclo_id={id_ciclo_origen})")
                        origen_ids.extend(ids_ciclo)
                continue  # No buscar módulo individual

            # ── MÓDULO ESPECÍFICO ────────────────────────────────
            id_mod_origen = resolve_modulo(
                origen_label,
                nombre=origen.get("nombre_origen"),
                codigo=origen.get("codigo_origen"),
                id_ciclo=id_ciclo_origen,
            )
            if id_mod_origen is None:
                errors += 1
            else:
                origen_ids.append(id_mod_origen)

        if not origen_ids:
            print(f"  → {label}: SALTADA, sin orígenes resueltos.\n")
            errors += 1
            continue

        # ── Comprobar si la regla ya existe en la BD ──────────────────
        if convalidacion_exists(id_modulo_destino, origen_ids):
            print(f"  ↷ {label}: YA EXISTE (destino={id_modulo_destino}, orígenes={origen_ids}), SALTADA.")
            skipped += 1
            continue

        # ── Construir el SQL ──────────────────────────────────────────
        source_link = regla.get("source_link")
        source_page = regla.get("source_page")

        link_sql = f"'{source_link}'" if source_link else "NULL"
        page_sql = str(source_page) if source_page is not None else "NULL"

        sql_lines.append(f"-- {label}: módulo destino id={id_modulo_destino}, orígenes={origen_ids}")
        sql_lines.append(
            f"INSERT OR IGNORE INTO convalidacion (id, source_link, source_page, id_modulo_destino) "
            f"VALUES ({conv_id}, {link_sql}, {page_sql}, {id_modulo_destino});"
        )
        for oid in origen_ids:
            sql_lines.append(
                f"INSERT OR IGNORE INTO convalidacion_origen (conv_id, id_modulo) "
                f"VALUES ({conv_id}, {oid});"
            )
        sql_lines.append("")

        if dry_run:
            print(f"  ► {label}: conv_id={conv_id} | destino_modulo_id={id_modulo_destino} | orígenes={origen_ids}")

        conv_id += 1
        inserted += 1

    sql_lines.append("PRAGMA foreign_keys = ON;")
    sql_lines.append("")

    print(f"\n{'='*55}")
    print(f"  Reglas procesadas : {len(CONVALIDACIONES)}")
    print(f"  Insertadas (OK)   : {inserted}")
    print(f"  Ya existían (OK)  : {skipped}")
    print(f"  Errores           : {errors}")
    print(f"{'='*55}\n")

    return sql_lines


# ─────────────────────────────────────────────────────────────────────
# Aplicar a la BD
# ─────────────────────────────────────────────────────────────────────

def apply_to_db(sql_lines: list[str]) -> None:
    """Ejecuta los INSERTs directamente sobre la base de datos SQLite."""
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
                print(f"  ✗ SQL Error en: {stmt[:80]}...\n    {e}")
        conn.commit()
    print(f"  ✔ Cambios aplicados a la BD: {DEFAULT_DB}")


# ─────────────────────────────────────────────────────────────────────
# Guardar el fichero SQL
# ─────────────────────────────────────────────────────────────────────

def save_sql(sql_lines: list[str]) -> None:
    with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))
    print(f"  ✔ SQL guardado en: {OUTPUT_SQL}")


# ─────────────────────────────────────────────────────────────────────
# Punto de entrada
# ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Genera e inserta reglas de convalidación en la BD."
    )
    parser.add_argument(
        "--sql", action="store_true",
        help="Vuelca los INSERTs a un fichero .sql"
    )
    parser.add_argument(
        "--db", action="store_true",
        help="Aplica los INSERTs directamente a la base de datos SQLite"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Solo muestra lo que haría, sin escribir nada"
    )
    parser.add_argument(
        "--rules", metavar="FICHERO",
        help="Cargar solo un fichero de reglas concreto (ej. rules_administracion_y_gestion.py). "
             "Por defecto se cargan todos los rules_*.py de la carpeta."
    )
    args = parser.parse_args()

    if not args.sql and not args.db and not args.dry_run:
        parser.print_help()
        print("\n⚠  Especifica al menos --sql, --db o --dry-run.")
        sys.exit(1)

    print(f"\nCargando reglas de convalidación...\n")
    sql_lines = generate(dry_run=args.dry_run, rules_file=args.rules)
    
    if args.dry_run:
        print("(Modo dry-run: no se ha escrito nada.")
        return

    if args.sql:
        save_sql(sql_lines)

    if args.db:
        apply_to_db(sql_lines)


if __name__ == "__main__":
    main()
