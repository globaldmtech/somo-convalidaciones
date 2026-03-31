import re
from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, field_validator, model_validator


DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE"


def _normalize_document_number(document_type: str, value: str) -> str:
    normalized = str(value or "").strip().upper()

    if document_type in {"dni", "nie"}:
        return re.sub(r"[\s-]+", "", normalized)

    return re.sub(r"\s+", " ", normalized)


def _is_valid_dni_letter(number: int, letter: str) -> bool:
    return DNI_LETTERS[number % 23] == letter


def _is_valid_document_number(document_type: str, value: str) -> bool:
    if document_type == "dni":
        if not re.fullmatch(r"\d{8}[A-Z]", value):
            return False
        return _is_valid_dni_letter(int(value[:8]), value[-1])

    if document_type == "nie":
        if not re.fullmatch(r"[XYZ]\d{7}[A-Z]", value):
            return False
        prefix_map = {"X": "0", "Y": "1", "Z": "2"}
        numeric_value = f"{prefix_map[value[0]]}{value[1:8]}"
        return _is_valid_dni_letter(int(numeric_value), value[-1])

    return bool(re.fullmatch(r"[A-Z0-9](?:[A-Z0-9 /.-]{1,28}[A-Z0-9])?", value))


class ModuloAportadoDetalleItem(BaseModel):
    id_modulo: int
    nota: Optional[float] = None


class CicloAportadoDetalleItem(BaseModel):
    id_ciclo: int
    nota_media: Optional[float] = None


class ConvalidationRequest(BaseModel):
    modulos_aportados: List[ModuloAportadoDetalleItem] = []
    acreditacion_ids: List[int]
    ciclos_completos: List[CicloAportadoDetalleItem] = []
    target_ciclo_id: int


class ConvalidationResult(BaseModel):
    id_convalidacion: Optional[int] = None
    id_convalidacion_ciclo: Optional[int] = None
    id: int
    nombre: str
    ciclo_nombre: str
    origen_tipo: str
    source_nombre: Optional[str] = None
    modulos_origen: Optional[str] = None
    modulos_origen_ids: Optional[str] = None
    nota_media_origen: Optional[float] = None
    observaciones: Optional[str] = None


# --- Solicitud unificada ---

class SolicitudItem(BaseModel):
    """Una solicitud dentro del formulario completo."""
    id_modulo_destino: Optional[int] = None
    id_convalidacion: Optional[int] = None
    id_convalidacion_ciclo: Optional[int] = None
    descripcion: Optional[str] = None


class FormularioCompletoRequest(BaseModel):
    """Datos para crear formulario + módulos aportados + solicitudes en un solo paso."""
    # Datos personales del alumno
    document_type: Literal["dni", "nie", "otro"] = "dni"
    nombre: str
    apellidos: Optional[str] = None
    dni: str
    email: EmailStr

    # Datos del formulario
    estado: Optional[int] = 1
    enviado_at: Optional[str] = None
    anotaciones: Optional[str] = None

    # Módulos aportados (lista de ids)
    id_modulos_registrados_aportados: List[int] #modulos de grado ciclo
    modulos_aportados_detalle: Optional[List[ModuloAportadoDetalleItem]] = None
    ciclos_aportados_detalle: Optional[List[CicloAportadoDetalleItem]] = None
    id_acreditaciones_registradas_aportadas: List[int] #certificaciones o titulaciones aportadas
    descripcion_no_registrados: Optional[List[str]] = None #todo lo que sea texto input

    # Solicitudes
    solicitudes_registradas: List[SolicitudItem]
    solicitudes_no_registradas: List[str]

    @field_validator("document_type", mode="before")
    @classmethod
    def _normalize_document_type(cls, value: str) -> str:
        return str(value or "dni").strip().lower() or "dni"

    @model_validator(mode="after")
    def _validate_document(self) -> "FormularioCompletoRequest":
        self.dni = _normalize_document_number(self.document_type, self.dni)
        if not _is_valid_document_number(self.document_type, self.dni):
            labels = {
                "dni": "DNI",
                "nie": "NIE",
                "otro": "documento",
            }
            raise ValueError(f"El formato del {labels.get(self.document_type, 'documento')} no es válido")
        return self
