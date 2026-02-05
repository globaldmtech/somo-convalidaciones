"""Parsing de tablas por anexo/tipo y utilidades de detección."""

from typing import List, Optional, Tuple

from .constants import ANEXOS_VALIDOS, GRADE_RE
from .normalize import (
    clean_family_name,
    extract_family_items,
    extract_cycle_items_from_parens,
    grade_items_from_text,
    parse_cell_entities,
)
from .types import Item


def normalize_table_rows(table: List[List[Optional[str]]]) -> List[List[str]]:
    """Normaliza filas, elimina columnas vacías y espacios extra."""
    if not table:
        return []
    max_cols = max(len(row) for row in table)
    rows: List[List[str]] = []
    for row in table:
        padded = list(row) + [""] * (max_cols - len(row))
        rows.append([(c or "").replace("\xa0", " ").strip() for c in padded])

    keep = []
    for col_idx in range(max_cols):
        if any(rows[row_idx][col_idx] for row_idx in range(len(rows))):
            keep.append(col_idx)
    normalized = []
    for row in rows:
        normalized.append([row[i] for i in keep])
    return normalized


def is_header_row(row: List[str]) -> bool:
    """Identifica filas de cabecera que no contienen datos."""
    joined = " ".join(row).lower()
    if "formación aportada" in joined or "formacion aportada" in joined:
        return True
    if "formación a convalidar" in joined or "formacion a convalidar" in joined:
        return True
    if "módulos profesionales de diferentes títulos" in joined or "modulos profesionales de diferentes titulos" in joined:
        return True
    if "módulos profesionales a convalidar" in joined or "modulos profesionales a convalidar" in joined:
        return True
    if "familia profesional" in joined and "ciclos formativos" in joined:
        return True
    return False


def is_title_row(row: List[str]) -> bool:
    """Detecta filas-título que definen el contexto del bloque."""
    cells = [c for c in row if c]
    if len(cells) == 1:
        head = cells[0].strip()
        lower = head.lower()
        if lower.startswith("para todos") or lower.startswith("para determinados"):
            return True
        if lower.startswith("convalidaciones"):
            return True
        if lower.startswith("familia:"):
            return True
        if not any(ch.isdigit() for ch in lower) and not any(
            key in lower for key in ("ciclo", "técnico", "tecnico", "módulo", "modulo")
        ):
            return True
    return False


def detect_grade_row(row: List[str]) -> Optional[str]:
    """Detecta filas que solo informan del grado (GM/GS)."""
    for cell in row:
        if not cell:
            continue
        if GRADE_RE.match(cell.strip()):
            return cell.strip()
    return None


def is_cycle_text(text: str) -> bool:
    """Heurística para identificar títulos de ciclo."""
    if not text:
        return False
    lowered = text.lower()
    return "técnico" in lowered or "tecnico" in lowered or "ciclo formativo" in lowered


def detect_anexo_for_table(current_anexo: Optional[str], rows: List[List[str]], page_text: str) -> Optional[str]:
    """Determina el anexo de una tabla (por contenido y contexto de página)."""
    flat = " ".join(" ".join(r) for r in rows).lower()
    page_lower = page_text.lower()
    if "familia:" in flat or ("familia profesional" in flat and "ciclos formativos" in flat):
        return "I"
    if "ley orgánica 1/1990" in flat and "ley orgánica 2/2006" in flat:
        return "II"
    if "ley orgánica 1/1990" in flat and "ley orgánica 2/2006" not in flat:
        return "I"
    if "ley orgánica 2/2006" in flat and "ley orgánica 1/1990" not in flat:
        if "anexo iv" in page_lower:
            if "cualquier ciclo formativo" in flat:
                return "IV"
            return "III"
        return "III"
    if "cualquier ciclo formativo" in flat and "anexo iv" in page_lower:
        return "IV"
    return current_anexo if current_anexo in ANEXOS_VALIDOS else None


def parse_anexo_I_table(rows: List[List[str]]) -> List[Tuple[List[Item], List[Item]]]:
    """Parser específico para Anexo I (tablas tipo A/B/C)."""
    entries: List[Tuple[List[Item], List[Item]]] = []
    if not rows:
        return entries

    col_count = len(rows[0])
    current_family = None
    current_grade = None

    last_values: List[str] = [""] * col_count

    for row in rows:
        if is_header_row(row) or is_title_row(row):
            continue

        row_filled = []
        for idx, cell in enumerate(row):
            value = cell or last_values[idx]
            row_filled.append(value)
            if cell:
                last_values[idx] = cell

        grade_row = detect_grade_row(row_filled)
        if grade_row and col_count <= 3:
            current_grade = grade_row
            continue

        if col_count == 5:
            family, origen, grade_o, destino, grade_d = row_filled
            if family:
                current_family = family
            if not origen or not destino:
                continue
            origin_items = parse_cell_entities(origen, default_type="modulo")
            dest_items = parse_cell_entities(destino, default_type="modulo")

            if current_family and "cualquier" not in current_family.lower():
                origin_items.append(Item("familia", clean_family_name(current_family)))
            origin_items.extend(grade_items_from_text(grade_o))
            dest_items.extend(grade_items_from_text(grade_d))

        elif col_count == 3:
            family, origen, destino = row_filled
            if family:
                current_family = family
            if not origen or not destino:
                continue
            origin_items = parse_cell_entities(origen, default_type="modulo")
            dest_items = parse_cell_entities(destino, default_type="modulo")

            if current_family and "cualquier" not in current_family.lower():
                origin_items.append(Item("familia", clean_family_name(current_family)))
            if current_grade:
                origin_items.extend(grade_items_from_text(current_grade))
                dest_items.extend(grade_items_from_text(current_grade))
        else:
            if col_count < 2:
                continue
            origen, destino = row_filled[0], row_filled[1]
            if not origen or not destino:
                continue
            origin_items = parse_cell_entities(origen, default_type="modulo")
            dest_items = parse_cell_entities(destino, default_type="modulo")
            if current_grade:
                origin_items.extend(grade_items_from_text(current_grade))
                dest_items.extend(grade_items_from_text(current_grade))

        # Regla de expansión:
        # - Si el origen es un módulo con varios ciclos en paréntesis, se genera 1 origen por ciclo.
        # - Si el destino incluye múltiples módulos, se genera 1 convalidación por módulo destino.
        origin_modules = [item for item in origin_items if item.item_type == "modulo"]
        origin_cycles = [item for item in origin_items if item.item_type == "ciclo"]
        dest_modules = [item for item in dest_items if item.item_type == "modulo"]

        origin_groups: List[List[Item]] = [origin_items]
        if origin_modules and not origin_cycles:
            cycle_items = extract_cycle_items_from_parens(origen)
            if cycle_items:
                origin_groups = []
                for cycle in cycle_items:
                    origin_groups.append(origin_items + [cycle])

        if dest_modules:
            dest_non_modules = [item for item in dest_items if item.item_type != "modulo"]
            for origin_group in origin_groups:
                for module in dest_modules:
                    entries.append((origin_group, [module] + dest_non_modules))
        else:
            for origin_group in origin_groups:
                entries.append((origin_group, dest_items))
    return entries


def is_cycle_pair_row(left: str, right: str) -> bool:
    """Detecta una fila que define el par de ciclos origen/destino."""
    if not left or not right:
        return False
    if "ciclo completo" in left.lower() or "ciclo completo" in right.lower():
        return False
    return is_cycle_text(left) and is_cycle_text(right)


def parse_cycle_mapping_table(rows: List[List[str]]) -> List[Tuple[List[Item], List[Item]]]:
    """Parser genérico para tablas de mapeo ciclo ↔ módulos (Anexo II/III/IV)."""
    entries: List[Tuple[List[Item], List[Item]]] = []
    if not rows:
        return entries

    current_grade = None
    current_cycle_origen: Optional[Item] = None
    current_cycle_dest: Optional[Item] = None
    current_family_origen: List[Item] = []
    current_family_dest: List[Item] = []

    last_values = [""] * len(rows[0])

    for row in rows:
        if is_header_row(row) or is_title_row(row):
            continue

        row_filled = []
        for idx, cell in enumerate(row):
            value = cell or last_values[idx]
            row_filled.append(value)
            if cell:
                last_values[idx] = cell

        grade_row = detect_grade_row(row_filled)
        if grade_row:
            current_grade = grade_row
            continue

        if len(row_filled) < 2:
            continue
        left, right = row_filled[0], row_filled[1]

        if is_cycle_pair_row(left, right):
            # Fila de definición de ciclos; actualiza contexto
            cycle_left = parse_cell_entities(left, default_type="ciclo")
            cycle_right = parse_cell_entities(right, default_type="ciclo")
            current_cycle_origen = cycle_left[0] if cycle_left else None
            current_cycle_dest = cycle_right[0] if cycle_right else None
            current_family_origen = extract_family_items(left)
            current_family_dest = extract_family_items(right)
            continue

        if is_cycle_text(left) and "para cualquier ciclo formativo" in right.lower():
            cycle_left = parse_cell_entities(left, default_type="ciclo")
            current_cycle_origen = cycle_left[0] if cycle_left else None
            current_cycle_dest = Item("ciclo", "Cualquier ciclo formativo")
            continue

        if "ciclo completo" in left.lower():
            # Convalidación por ciclo completo (no módulo a módulo)
            origin_items: List[Item] = []
            if current_cycle_origen:
                origin_items.append(current_cycle_origen)
            else:
                origin_items.extend(parse_cell_entities(left, default_type="ciclo"))
            dest_items = parse_cell_entities(right, default_type="modulo")
        else:
            origin_items = parse_cell_entities(left, default_type="modulo")
            dest_items = parse_cell_entities(right, default_type="modulo")

        if current_cycle_origen and all(item.item_type != "ciclo" for item in origin_items):
            origin_items.append(current_cycle_origen)
        if current_cycle_dest and all(item.item_type != "ciclo" for item in dest_items):
            dest_items.append(current_cycle_dest)
        if current_family_origen and all(item.item_type != "familia" for item in origin_items):
            origin_items.extend(current_family_origen)
        if current_family_dest and all(item.item_type != "familia" for item in dest_items):
            dest_items.extend(current_family_dest)

        if current_grade:
            origin_items.extend(grade_items_from_text(current_grade))
            dest_items.extend(grade_items_from_text(current_grade))

        if origin_items and dest_items:
            entries.append((origin_items, dest_items))

    return entries


def parse_anexo_IV_cualquier(rows: List[List[str]]) -> List[Tuple[List[Item], List[Item]]]:
    """Parser específico para la tabla 'Cualquier ciclo formativo' del Anexo IV."""
    entries: List[Tuple[List[Item], List[Item]]] = []
    if not rows:
        return entries
    for row in rows[1:]:
        if len(row) < 2:
            continue
        left, right = row[0], row[1]
        if not left or not right:
            continue
        origin_items = parse_cell_entities(left, default_type="modulo")
        dest_items = parse_cell_entities(right, default_type="modulo")
        if origin_items and dest_items:
            entries.append((origin_items, dest_items))
    return entries
