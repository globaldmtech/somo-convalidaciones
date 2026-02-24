"""Modelos Pydantic usados por la capa de acceso a base de datos."""
from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

# Modelo base para aceptar columnas extra en resultados SQL.
class DBResultModel(BaseModel):
    model_config = ConfigDict(extra="ignore")

# Resultado de búsqueda del catálogo.
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

# Regla de convalidación.
class Convalidacion(DBResultModel):
    id: int
    source_link: str | None = None
    source_page: int | None = None
    source_doc: str | None = None
    source_anexo: int | None = None
    rule_mode: Literal["ALL", "ANY"]
    id_modulo_destino: int
    created_at: str

# Regla de convalidación para listados por origen y destino.
class ConvalidacionRegla(Convalidacion):
    modulo_destino_nombre: str
    origen_count: int

# Usuario.
class Usuario(DBResultModel):
    id: int
    nombre: str
    email: str
    rol: Literal["ALUMNO", "ADMIN"]
    created_at: str
    updated_at: str | None = None

# Fila del listado de formularios.
class FormularioListItem(DBResultModel):
    id: int
    id_alumno: int
    enviado_at: str | None = None
    estado: Literal["BORRADOR", "ENVIADO", "A_REVISAR", "APROBADO", "RECHAZADO"]
    validado_por: int | None = None
    anotaciones: str | None = None
    validado_at: str | None = None
    created_at: str
    updated_at: str
    alumno_nombre: str
    alumno_email: str

# Línea de solicitud de convalidación.
class FormularioSolicitudItem(DBResultModel):
    id: int
    id_formulario: int
    id_modulo: int | None = None
    id_convalidacion: int | None = None
    descripcion: str | None = None
    estado_evaluacion: str
    created_at: str
    updated_at: str
    modulo_destino_nombre: str | None = None

# Módulo aportado en un formulario.
class FormularioModuloAportadoItem(DBResultModel):
    id: int
    id_formulario: int
    id_modulo: int | None = None
    descripcion: str | None = None
    created_at: str
    updated_at: str
    modulo_nombre: str | None = None

# Archivo adjunto.
class FormularioArchivoItem(DBResultModel):
    id: int
    id_formulario: int
    nombre_archivo: str
    descripcion: str | None = None
    ruta_almacenamiento: str
    mime_type: str | None = None
    size_bytes: int | None = None
    created_at: str

# Datos principales del formulario para el detalle.
class FormularioDetalleHeader(FormularioListItem):
    validador_nombre: str | None = None
    validador_email: str | None = None

# Detalle completo del formulario.
class FormularioDetalle(DBResultModel):
    formulario: FormularioDetalleHeader
    solicitudes: list[FormularioSolicitudItem] = Field(default_factory=list)
    modulos_aportados: list[FormularioModuloAportadoItem] = Field(default_factory=list)
    archivos: list[FormularioArchivoItem] = Field(default_factory=list)
