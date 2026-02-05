"""Funciones de normalización y parsing de texto de celdas."""

import re
import unicodedata
from typing import List

from .constants import (
    CODE_RE,
    CYCLE_RE,
    FAMILY_SKIP_RE,
    GRADE_RE,
    PAREN_RE,
    RD_RE,
)
from .types import Item


def normalize_match(text: str) -> str:
    """Normaliza texto para matching contra el catálogo (sin RD, paréntesis, tildes)."""
    if not text:
        return ""
    text = RD_RE.sub(" ", text)
    text = PAREN_RE.sub(" ", text)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[^a-zA-Z0-9\s]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text


def normalize_rd(text: str) -> str:
    """Normaliza variaciones de 'RD' a un formato homogéneo."""
    cleaned = re.sub(r"\s+", " ", text).strip()
    cleaned = re.sub(
        r"^(?:Real\s+Decreto|R\.?\s*D\.?)\s*",
        "RD ",
        cleaned,
        flags=re.IGNORECASE,
    )
    return cleaned


def extract_rds_list(text: str) -> List[str]:
    """Extrae una lista de RDs únicos encontrados en el texto."""
    if not text:
        return []
    rds = []
    for match in RD_RE.findall(text):
        cleaned = normalize_rd(match)
        if cleaned and cleaned not in rds:
            rds.append(cleaned)
    return rds


def strip_rd_and_paren(text: str) -> str:
    """Elimina RDs y paréntesis para quedarse con el nombre limpio."""
    text = RD_RE.sub(" ", text)
    text = PAREN_RE.sub(" ", text)
    return re.sub(r"\s+", " ", text).strip()


def normalize_module_code(code: str) -> str:
    """Normaliza códigos de 3 dígitos a 4 (p. ej. 180 -> 0180)."""
    if len(code) == 3:
        return f"0{code}"
    return code


def clean_module_name(text: str) -> str:
    """Limpia y normaliza nombre de módulo, conservando código si existe."""
    text = strip_rd_and_paren(text)
    text = text.replace("–", " ").replace("—", " ")
    text = re.sub(r"\s+", " ", text).strip(" .;")
    match = CODE_RE.match(text)
    if match:
        code = normalize_module_code(match.group(1))
        name = match.group(2).strip(" .;")
        return f"{code}. {name}" if name else f"{code}."
    return text


def clean_cycle_name(text: str) -> str:
    """Limpia prefijos de 'Técnico...' o 'Ciclo Formativo' para empatar catálogo."""
    text = strip_rd_and_paren(text)
    text = re.sub(r"^Ciclo\s+Formativo\s*:?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^T[ée]cnico\s+Superior\s+en\s+", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^T[ée]cnico\s+en\s+", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^T[ée]cnico\s+Superior\s+", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^T[ée]cnico\s+", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+", " ", text).strip(" .;")
    return text


def clean_family_name(text: str) -> str:
    """Limpia un nombre de familia (sin prefijo ni paréntesis)."""
    text = strip_rd_and_paren(text)
    text = re.sub(r"^Familia\s*:?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+", " ", text).strip(" .;")
    return text


def grade_items_from_text(text: str) -> List[Item]:
    """Crea Items de grado a partir de etiquetas GM/GS/GS-GM."""
    if not text:
        return []
    text = text.strip().upper()
    if "GS/GM" in text:
        return [Item("grado", "Grado Superior"), Item("grado", "Grado Medio")]
    if "GS" in text or "SUPERIOR" in text:
        return [Item("grado", "Grado Superior")]
    if "GM" in text or "MEDIO" in text:
        return [Item("grado", "Grado Medio")]
    return []


def split_cell_lines(text: str) -> List[str]:
    """Separa una celda en líneas útiles, ignorando paréntesis sueltos."""
    if not text:
        return []
    lines = [l.strip() for l in text.splitlines() if l and l.strip()]
    cleaned = []
    for line in lines:
        if line.startswith("(") and line.endswith(")"):
            continue
        cleaned.append(line)
    return cleaned


def parse_cell_entities(text: str, default_type: str = "modulo") -> List[Item]:
    """Parsea una celda a Items de módulo/ciclo/familia/grado según el contenido."""
    items: List[Item] = []
    if not text:
        return items
    rds = extract_rds_list(text)
    rd = rds[0] if rds else None

    lines = split_cell_lines(text)
    for line in lines:
        lower = line.lower()
        if "ciclo completo" in lower:
            continue
        if lower.startswith(
            ("módulo profesional", "modulo profesional", "módulos profesionales", "modulos profesionales")
        ):
            name = line.split(":", 1)[-1].strip()
            name = clean_module_name(name)
            if name:
                items.append(Item("modulo", name, rd))
            continue
        if lower.startswith("familia"):
            name = clean_family_name(line)
            if name:
                items.append(Item("familia", name, rd))
            continue
        if GRADE_RE.match(line.strip()):
            items.extend(grade_items_from_text(line))
            continue
        if CYCLE_RE.search(line):
            name = clean_cycle_name(line)
            if name:
                items.append(Item("ciclo", name, rd))
            continue

        name = clean_module_name(line)
        if name:
            items.append(Item(default_type, name, rd))

    if not items:
        name = clean_module_name(text)
        if name:
            items.append(Item(default_type, name, rd))
    return items


def extract_family_items(text: str) -> List[Item]:
    """Extrae familia profesional desde paréntesis dentro de un título de ciclo."""
    items: List[Item] = []
    if not text:
        return items
    for seg in re.findall(r"\(([^)]*)\)", text):
        seg = seg.strip()
        if not seg:
            continue
        if RD_RE.search(seg):
            continue
        if FAMILY_SKIP_RE.search(seg):
            continue
        name = clean_family_name(seg)
        if name:
            items.append(Item("familia", name))
    return items


def extract_cycle_items_from_parens(text: str) -> List[Item]:
    """Extrae ciclos listados entre paréntesis en celdas de módulos."""
    items: List[Item] = []
    if not text:
        return items
    for seg in re.findall(r"\(([^)]*)\)", text):
        seg = seg.strip()
        if not seg:
            continue
        if RD_RE.search(seg):
            continue
        if FAMILY_SKIP_RE.search(seg):
            continue
        name = clean_cycle_name(seg)
        if name:
            items.append(Item("ciclo", name))
    return items
