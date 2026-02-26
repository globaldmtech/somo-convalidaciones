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

# --- Solicitud unificada ---

class SolicitudItem(BaseModel):
    """Una solicitud dentro del formulario completo."""
    id_modulo_destino: Optional[int] = None
    id_convalidacion: Optional[int] = None
    descripcion: Optional[str] = None


class FormularioCompletoRequest(BaseModel):
    """Datos para crear formulario + módulos aportados + solicitudes en un solo paso."""
    # Datos del formulario
    id_alumno: int
    estado: Optional[int] = None
    enviado_at: Optional[str] = None
    anotaciones: Optional[str] = None
    # Módulos aportados (lista de ids)
    id_modulos_aportados: List[int]
    descripcion_modulos: Optional[str] = None
    # Solicitudes
    solicitudes: List[SolicitudItem]