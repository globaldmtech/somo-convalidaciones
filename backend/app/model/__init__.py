"""Modelos de datos del dominio."""

from .entities import (
    # Catálogo académico
    Grado,
    Familia,
    Ciclo,
    Modulo,
    CatalogEntity,

    # Convalidaciones
    Convalidacion,
    ConvalidacionOrigen,
    ConvalidacionRegla,

    # Usuarios
    Rol,
    Usuario,

    # Formularios base
    EstadoFormulario,
    EstadoLinea,
    Formulario,
    FormularioSolicitud,
    FormularioModuloAportado,
    FormularioArchivo,

    # Formularios para listados y detalle
    FormularioListItem,
    FormularioSolicitudItem,
    FormularioDetalleHeader,
    FormularioDetalle,
)

__all__ = [
    # Catálogo académico
    "Grado",
    "Familia",
    "Ciclo",
    "Modulo",
    "CatalogEntity",

    # Convalidaciones
    "Convalidacion",
    "ConvalidacionOrigen",
    "ConvalidacionRegla",

    # Usuarios
    "Rol",
    "Usuario",

    # Formularios base
    "EstadoFormulario",
    "EstadoLinea",
    "Formulario",
    "FormularioSolicitud",
    "FormularioModuloAportado",
    "FormularioArchivo",

    # Formularios para listados y detalle
    "FormularioListItem",  # Elemento para listar formularios.
    "FormularioSolicitudItem",  # Elemento de solicitud para detalle de formulario.
    "FormularioDetalleHeader",  # Detalle parcial: Datos, alumno y validador (sin solicitudes, módulos, archivos).
    "FormularioDetalle",  # Detalle completo: con datos, solicitudes, módulos y archivos.
]
