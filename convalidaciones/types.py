"""Modelos ligeros usados por el extractor."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class Item:
    """Elemento normalizado extraído de una celda (módulo/ciclo/familia/grado)."""

    item_type: str
    name: str
    rd: Optional[str] = None
