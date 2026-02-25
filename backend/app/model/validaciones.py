from pydantic import BaseModel
from typing import List, Optional

class ConvalidationRequest(BaseModel):
    modulo_ids: List[int]
    acreditacion_ids: List[int]
    target_ciclo_id: int

class ConvalidationResult(BaseModel):
    id: int
    nombre: str
    ciclo_nombre: str
    origen_tipo: str
    source_nombre: Optional[str] = None
    modulos_origen: Optional[str] = None
    observaciones: Optional[str] = None
