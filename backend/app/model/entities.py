"""Modelos Pydantic de dominio y DTOs de lectura para BD."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field


# Modelo base para aceptar columnas extra en resultados SQL.
class DBResultModel(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)


# Rol de usuario según el dominio.
class Rol(str, Enum):
    ALUMNO = "ALUMNO"
    ADMIN = "ADMIN"


# Estado funcional del formulario.
class EstadoFormulario(str, Enum):
    BORRADOR = "BORRADOR"
    ENVIADO = "ENVIADO"
    EN_REVISION = "EN_REVISION"
    VALIDADO = "VALIDADO"
    RECHAZADO = "RECHAZADO"

    @classmethod
    def _missing_(cls, value: object):
        if not isinstance(value, str):
            return None
        normalized = value.strip().upper()
        aliases = {
            "A_REVISAR": cls.EN_REVISION,
            "APROBADO": cls.VALIDADO,
        }
        if normalized in aliases:
            return aliases[normalized]
        for member in cls:
            if member.value == normalized:
                return member
        return None


# Estado funcional de cada línea de solicitud.
class EstadoLinea(str, Enum):
    PENDIENTE = "PENDIENTE"
    APROBADA = "APROBADA"
    RECHAZADA = "RECHAZADA"

    @classmethod
    def _missing_(cls, value: object):
        if not isinstance(value, str):
            return None
        normalized = value.strip().upper()
        aliases = {
            "MATCH": cls.APROBADA,
            "NO_MATCH": cls.RECHAZADA,
        }
        if normalized in aliases:
            return aliases[normalized]
        for member in cls:
            if member.value == normalized:
                return member
        return None


# Entidad de grado del catálogo.
class Grado(DBResultModel):
    id: int
    nombre: str


# Entidad de familia del catálogo.
class Familia(DBResultModel):
    id: int
    nombre: str
    id_grado: int | None = None


# Entidad de ciclo del catálogo.
class Ciclo(DBResultModel):
    id: int
    nombre: str
    id_oficial: str | None = None
    normativa: str | None = None
    id_familia: int | None = None


# Entidad de módulo del catálogo.
class Modulo(DBResultModel):
    id: int
    nombre: str
    id_oficial: str | None = None
    id_ciclo: int | None = None


# Regla de convalidación.
class Convalidacion(DBResultModel):
    id: int
    source_link: str | None = None
    source_page: int | None = None
    source_doc: str | None = None
    source_anexo: int | None = None
    rule_mode: str = "ALL"
    id_modulo_destino: int | None = None
    created_at: datetime | None = None


# Tabla puente de módulos origen de una regla.
class ConvalidacionOrigen(DBResultModel):
    conv_id: int
    id_modulo: int


# Regla de convalidación para listados por origen y destino.
class ConvalidacionRegla(Convalidacion):
    modulo_destino_nombre: str
    origen_count: int


# Usuario del sistema.
class Usuario(DBResultModel):
    id: int
    nombre: str
    email: str
    rol: Rol
    created_at: datetime
    updated_at: datetime | None = None


# Formulario principal.
class Formulario(DBResultModel):
    id: int
    id_alumno: int
    enviado_at: datetime | None = None
    estado: EstadoFormulario
    validado_at: datetime | None = None
    validado_por: int | None = None
    anotaciones: str | None = None
    created_at: datetime
    updated_at: datetime


# Línea de solicitud dentro de un formulario.
class FormularioSolicitud(DBResultModel):
    id: int
    id_formulario: int
    id_modulo: int | None = None
    id_convalidacion: int | None = None
    descripcion: str | None = None
    estado_linea: EstadoLinea
    created_at: datetime
    updated_at: datetime


# Módulo aportado dentro de un formulario.
class FormularioModuloAportado(DBResultModel):
    id: int
    id_formulario: int
    id_modulo: int | None = None
    descripcion: str | None = None
    created_at: datetime
    updated_at: datetime
    modulo_nombre: str | None = None


# Archivo adjunto de un formulario.
class FormularioArchivo(DBResultModel):
    id: int
    id_formulario: int
    nombre_archivo: str
    descripcion: str | None = None
    ruta_almacenamiento: str
    mime_type: str | None = None
    size_bytes: int | None = None
    created_at: datetime


# DTO de búsqueda del catálogo para autocompletado.
class CatalogEntity(DBResultModel):
    entity: str
    entity_id: int
    nombre: str
    id_grado: int | None = None
    grado_nombre: str | None = None
    id_familia: int | None = None
    familia_nombre: str | None = None
    id_ciclo: int | None = None
    ciclo_nombre: str | None = None
    id_oficial: str | None = None
    normativa: str | None = None
    rules_count: int | None = None


# DTO de listado de formularios (incluye datos del alumno por JOIN).
class FormularioListItem(Formulario):
    alumno_nombre: str
    alumno_email: str


# DTO de solicitud para listados con nombre de módulo destino por JOIN.
class FormularioSolicitudItem(FormularioSolicitud):
    modulo_destino_nombre: str | None = None


# DTO de cabecera de detalle con datos del validador por JOIN.
class FormularioDetalleHeader(FormularioListItem):
    validador_nombre: str | None = None
    validador_email: str | None = None


# DTO de detalle completo del formulario.
class FormularioDetalle(DBResultModel):
    formulario: FormularioDetalleHeader
    solicitudes: list[FormularioSolicitudItem] = Field(default_factory=list)
    modulos_aportados: list[FormularioModuloAportado] = Field(default_factory=list)
    archivos: list[FormularioArchivo] = Field(default_factory=list)
