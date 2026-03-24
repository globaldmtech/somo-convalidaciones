import json
import re
import os

INPUT = os.path.join(os.path.dirname(__file__), "catalog.json")
OUTPUT = os.path.join(os.path.dirname(__file__), "..", "2_load_catalog.sql")

GRADO_NORM = {
    "BÁSICA": 1,
    "GRADO MEDIO": 2,
    "GRADO SUPERIOR": 3,
    "OTROS": 4,
}

COMMON_MODULES_BY_GRADE = {
    "GRADO MEDIO": [
        "0156. Inglés Profesional (Grado Medio)",
        "1664. Digitalización aplicada a los sectores productivos (Grado Medio)",
        "1708. Sostenibilidad aplicada al sistema productivo",
        "1709. Itinerario personal para la empleabilidad I",
        "1710. Itinerario personal para la empleabilidad II",
        "1713. Proyecto intermodular",
    ],
    "GRADO SUPERIOR": [
        "0179. Inglés Profesional (Grado Superior)",
        "1665. Digitalización aplicada a los sectores productivos (Grado Superior)",
        "1708. Sostenibilidad aplicada al sistema productivo",
        "1709. Itinerario personal para la empleabilidad I",
        "1710. Itinerario personal para la empleabilidad II",
        "1713. Proyecto intermodular",
    ],
}

def esc(s):
    """Escape single quotes for SQL."""
    return s.replace("'", "''").replace("\n", " ")

def extract_code(module_str):
    """Extract id_oficial from strings like '0451. Nombre del módulo'."""
    m = re.match(r'^([A-Z0-9]+)\.\s+', module_str.strip())
    return m.group(1) if m else None

def extract_name(module_str):
    """Extract name from strings like '0451. Nombre del módulo'."""
    m = re.match(r'^[A-Z0-9]+\.\s+(.+)', module_str.strip().replace("\n", " "))
    return m.group(1).strip() if m else module_str.strip().replace("\n", " ")


def add_common_modules(data):
    """Ensure common transversal modules exist on every ciclo of Medio/Superior."""
    for grados_dict in data.values():
        for grado_str, common_modules in COMMON_MODULES_BY_GRADE.items():
            ciclos_dict = grados_dict.get(grado_str)
            if not ciclos_dict:
                continue

            for ciclo_nombre, modulos_list in ciclos_dict.items():
                existing_modules = {mod.strip() for mod in modulos_list}
                for module in common_modules:
                    if module not in existing_modules:
                        modulos_list.append(module)
                        existing_modules.add(module)


def is_deprecated_module(module_name, module_code):
    normalized = module_name.strip().lower()
    normalized_code = (module_code or "").strip().upper()
    return normalized in {
        "empresa e iniciativa emprendedora",
        "formación y orientación laboral",
        "formacion y orientacion laboral",
    } or normalized_code in {"E100", "E200"}


with open(INPUT, encoding="utf-8") as f:
    data = json.load(f)

add_common_modules(data)

lines = []
lines.append("-- ============================================================")
lines.append("-- Seed data generated from modules.json")
lines.append("-- ============================================================")
lines.append("")
lines.append("PRAGMA foreign_keys = OFF;")
lines.append("")

# ---------- GRADOS ----------
lines.append("-- Grados")
lines.append("INSERT OR IGNORE INTO grados (id, nombre) VALUES")
lines.append("  (1, 'Básica'),")
lines.append("  (2, 'Grado Medio'),")
lines.append("  (3, 'Grado Superior'),")
lines.append("  (4, 'Especialización');")
lines.append("")

# ---------- FAMILIAS ----------
lines.append("-- Familias")
fam_rows = []
fam_index = {}   # raw_key -> fam_id
fam_id = 1
for raw_key in data.keys():
    parts = raw_key.rsplit(" - ", 1)
    nombre = esc(parts[0].strip())
    codigo = parts[1].strip() if len(parts) > 1 else ""
    fam_index[raw_key] = fam_id
    # id_grado=1 is a placeholder; familia spans all grados.
    # If you want to separate by grado, you would need one row per (familia, grado).
    fam_rows.append(f"  ({fam_id}, '{nombre}', '{codigo}')")
    fam_id += 1

lines.append("INSERT OR IGNORE INTO familias (id, nombre, codigo) VALUES")
lines.append(",\n".join(fam_rows) + ";")
lines.append("")

# ---------- CICLOS & MODULOS ----------
ciclo_id = 1
modulo_id = 1
ciclo_rows = []
modulo_rows = []

# Track already-inserted modules to avoid duplicates
# (same module can appear in multiple ciclos, that is intentional: we keep all)

for raw_fam, grados_dict in data.items():
    fam_id_val = fam_index[raw_fam]
    for grado_str, ciclos_dict in grados_dict.items():
        grado_id = GRADO_NORM.get(grado_str)
        if grado_id is None:
            print(f"WARNING: unknown grado '{grado_str}'")
            continue
        for ciclo_nombre, modulos_list in ciclos_dict.items():
            ciclo_rows.append(
                f"  ({ciclo_id}, '{esc(ciclo_nombre)}', NULL, NULL, {fam_id_val}, {grado_id})"
            )
            for mod_str in modulos_list:
                mod_str_clean = mod_str.replace("\n", " ").strip()
                id_oficial = extract_code(mod_str_clean)
                nombre_mod = extract_name(mod_str_clean) if id_oficial else esc(mod_str_clean)
                is_fct = "Formación en Centros de Trabajo" in nombre_mod
                numerico = 0 if is_fct else 1
                deprecated = 1 if is_deprecated_module(nombre_mod, id_oficial) else 0
                
                modulo_rows.append(
                    f"  ({modulo_id}, '{esc(nombre_mod)}', {repr(id_oficial) if id_oficial else 'NULL'}, {ciclo_id}, {numerico}, {deprecated})"
                )
                modulo_id += 1
            ciclo_id += 1

lines.append("-- Ciclos")
lines.append("INSERT OR IGNORE INTO ciclos (id, nombre, id_oficial, normativa, id_familia, id_grado) VALUES")
lines.append(",\n".join(ciclo_rows) + ";")
lines.append("")

lines.append("-- Modulos")
lines.append("INSERT OR IGNORE INTO modulos (id, nombre, id_oficial, id_ciclo, numerico, deprecated) VALUES")
# Fix repr() for None -> NULL
modulo_rows_fixed = [r.replace("None", "NULL") for r in modulo_rows]
lines.append(",\n".join(modulo_rows_fixed) + ";")
lines.append("")

lines.append("PRAGMA foreign_keys = ON;")
lines.append("")

with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"Done! Written to {OUTPUT}")
print(f"  Familias: {len(fam_index)}")
print(f"  Ciclos:   {ciclo_id - 1}")
print(f"  Modulos:  {modulo_id - 1}")
