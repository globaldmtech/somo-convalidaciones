from pydantic import BaseModel
from typing import List, Optional

class ConvalidationRequest(BaseModel):
    modulo_ids: List[int]
    acreditacion_ids: List[int]
    target_ciclo_id: int

class ConvalidationResult(BaseModel):
    id_convalidacion: Optional[int] = None
    id: int
    nombre: str
    ciclo_nombre: str
    origen_tipo: str
    source_nombre: Optional[str] = None
    modulos_origen: Optional[str] = None
    modulos_origen_ids: Optional[str] = None
    observaciones: Optional[str] = None

# --- Solicitud unificada ---

class SolicitudItem(BaseModel):
    """Una solicitud dentro del formulario completo."""
    id_modulo_destino: Optional[int] = None
    id_convalidacion: Optional[int] = None
    descripcion: Optional[str] = None

class ModuloAportadoDetalleItem(BaseModel):
    id_modulo: int
    nota: Optional[float] = None


class FormularioCompletoRequest(BaseModel):
    """Datos para crear formulario + módulos aportados + solicitudes en un solo paso."""
    # Datos personales del alumno
    nombre: str
    apellidos: Optional[str] = None
    dni: str
    email: str

    # Datos del formulario
    estado: Optional[int] = 1
    enviado_at: Optional[str] = None
    anotaciones: Optional[str] = None

    # Módulos aportados (lista de ids)
    id_modulos_registrados_aportados: List[int] #modulos de grado ciclo
    modulos_aportados_detalle: Optional[List[ModuloAportadoDetalleItem]] = None
    id_acreditaciones_registradas_aportadas: List[int] #certificaciones o titulaciones aportadas
    descripcion_no_registrados: Optional[List[str]] = None #todo lo que sea texto input

    # Solicitudes
    solicitudes_registradas: List[SolicitudItem]
    solicitudes_no_registradas: List[str]
