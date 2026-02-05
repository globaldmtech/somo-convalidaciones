"""Constantes, regex y configuraciones compartidas para el parser de convalidaciones."""

import re
from pathlib import Path

DB_DEFAULT = Path("grados-familias-ciclos-modulos.db")
PDF_DEFAULT = Path("docs/BOE-A-2020-17274.pdf")
SOURCE_DOC = "BOE-A-2020-17274"

TABLE_SETTINGS = {"vertical_strategy": "lines", "horizontal_strategy": "lines"}

RD_RE = re.compile(
    r"(?:R\.?\s*D\.?|Real\s+Decreto)\s*\d{1,4}/\d{4}[^\n\)]*",
    re.IGNORECASE,
)
PAREN_RE = re.compile(r"\([^\)]*\)")
CODE_RE = re.compile(r"^\s*(\d{3,4})\.\s*(.+)$")
CYCLE_RE = re.compile(r"\b(T[ée]cnico|Ciclo\s+Formativo)\b", re.IGNORECASE)
GRADE_RE = re.compile(
    r"^GRADO\s+(MEDIO|SUPERIOR|MEDIO\s+Y\s+GRADO\s+SUPERIOR)$", re.IGNORECASE
)
FAMILY_SKIP_RE = re.compile(
    r"\d|ley\s+org[aá]nica|loe|logse|lomce|ciclo|formativo|grado",
    re.IGNORECASE,
)

# Solo procesamos los anexos con tablas de convalidaciones.
ANEXO_MAP = {"I": 1, "II": 2, "III": 3, "IV": 4}
ANEXOS_VALIDOS = {"I", "II", "III", "IV"}
