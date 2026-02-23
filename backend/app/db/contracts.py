"""I/O contracts for DB module functions.

This file is the explicit design inventory requested before implementation:
- Function list by use case
- Exact input/output format for each public operation
"""
from __future__ import annotations

from typing import Any, Literal, NotRequired, TypedDict


# Estados permitidos para el ciclo de vida de un formulario.
FormularioEstado = Literal["BORRADOR", "ENVIADO", "A_REVISAR", "APROBADO", "RECHAZADO"]
# Modos de evaluacion de reglas de convalidacion (todos o alguno de los origenes).
RuleMode = Literal["ALL", "ANY"]


# Salida estandar para verificar el estado de la conexion SQLite.
class HealthcheckOut(TypedDict):
    ok: bool
    sqlite_version: str
    database_file: str | None


# Detalle de evaluacion de una regla candidata frente a modulos aportados.
class CandidateEvaluationOut(TypedDict):
    convalidacion_id: int
    rule_mode: RuleMode
    source_link: str | None
    source_page: int | None
    source_doc: str | None
    source_anexo: int | None
    required_origen_ids: list[int]
    matched_origen_ids: list[int]
    missing_origen_ids: list[int]
    matched_count: int
    missing_count: int
    required_count: int
    is_match: bool


# Resultado de evaluacion para una solicitud individual del formulario.
class SolicitudEvaluationOut(TypedDict):
    solicitud_id: int
    formulario_id: int
    status: Literal["MATCH", "NO_MATCH", "PENDING_DESTINATION"]
    candidates: list[CandidateEvaluationOut]
    best_match: CandidateEvaluationOut | None
    id_modulo_destino: NotRequired[int]
    aportados_ids: NotRequired[list[int]]
    message: NotRequired[str]


# Resumen agregado de evaluacion para todas las solicitudes de un formulario.
class FormularioEvaluationOut(TypedDict):
    formulario_id: int
    auto_assign: bool
    total_solicitudes: int
    matched: int
    no_match: int
    pending_destination: int
    solicitudes: list[SolicitudEvaluationOut]


# Estructura de datos consolidada para exportar un formulario.
class FormularioExportOut(TypedDict):
    formulario: dict[str, Any]
    solicitudes: list[dict[str, Any]]
    modulos_aportados: list[dict[str, Any]]
    archivos: list[dict[str, Any]]
    exported_at: str


# Inventario formal de contratos de entrada/salida para funciones del modulo DB.
FUNCTION_CONTRACTS: dict[str, dict[str, Any]] = {
    "infraestructura": {
        "transaction": {
            "input": {"conn": "sqlite3.Connection"},
            "output": "ContextManager[None]",
        },
        "connect": {
            "input": {"config": "DBConfig(path: Path, schema_path: Path, timeout: float)"},
            "output": "sqlite3.Connection",
        },
        "close": {"input": {"conn": "sqlite3.Connection"}, "output": "None"},
        "init_db": {"input": {"config": "DBConfig"}, "output": "None"},
        "healthcheck": {"input": {"conn": "sqlite3.Connection"}, "output": "HealthcheckOut"},
    },
    "catalogo": {
        "clear_catalog": {"input": {"conn": "sqlite3.Connection"}, "output": "None"},
        "create_catalog_entity": {
            "input": {
                "conn": "sqlite3.Connection",
                "entity": "Literal['grado', 'familia', 'ciclo', 'modulo']",
                "nombre": "str",
                "parent_id": "int | None",
                "titulo": "str | None",
                "id_oficial": "str | None",
                "normativa": "str | None",
            },
            "output": "int",
        },
        "get_catalog_entity": {
            "input": {
                "conn": "sqlite3.Connection",
                "entity": "Literal['grado', 'familia', 'ciclo', 'modulo']",
                "entity_id": "int",
            },
            "output": "sqlite3.Row | None",
        },
        "find_catalog_entity_by_nombre": {
            "input": {
                "conn": "sqlite3.Connection",
                "entity": "Literal['grado', 'familia', 'ciclo', 'modulo']",
                "nombre": "str",
                "parent_id": "int | None",
            },
            "output": "sqlite3.Row | None",
        },
        "list_catalog_entities": {
            "input": {
                "conn": "sqlite3.Connection",
                "entity": "Literal['grado', 'familia', 'ciclo', 'modulo']",
                "parent_id": "int | None",
                "search": "str | None",
                "limit": "int",
                "offset": "int",
            },
            "output": "Sequence[sqlite3.Row]",
        },
        "update_catalog_entity": {
            "input": {
                "conn": "sqlite3.Connection",
                "entity": "Literal['grado', 'familia', 'ciclo', 'modulo']",
                "entity_id": "int",
                "nombre": "str",
                "parent_id": "int | None",
                "titulo": "str | None",
                "id_oficial": "str | None",
                "normativa": "str | None",
            },
            "output": "bool",
        },
        "delete_catalog_entity": {
            "input": {
                "conn": "sqlite3.Connection",
                "entity": "Literal['grado', 'familia', 'ciclo', 'modulo']",
                "entity_id": "int",
            },
            "output": "bool",
        },
        "get_or_create_catalog_entity": {
            "input": {
                "conn": "sqlite3.Connection",
                "entity": "Literal['grado', 'familia', 'ciclo', 'modulo']",
                "nombre": "str",
                "parent_id": "int | None",
                "titulo": "str | None",
                "id_oficial": "str | None",
                "normativa": "str | None",
            },
            "output": "int",
        },
    },
    "convalidaciones": {
        "clear_convalidaciones": {"input": {"conn": "sqlite3.Connection"}, "output": "None"},
        "create_convalidacion": {
            "input": {
                "conn": "sqlite3.Connection",
                "id_modulo_destino": "int",
                "source_link": "str | None",
                "source_page": "int | None",
                "origen_modulos": "Iterable[int]",
                "rule_mode": "RuleMode",
                "source_doc": "str | None",
                "source_anexo": "int | None",
            },
            "output": "int",
        },
        "get_convalidacion": {
            "input": {"conn": "sqlite3.Connection", "conv_id": "int"},
            "output": "sqlite3.Row | None",
        },
        "list_convalidacion_origenes": {
            "input": {"conn": "sqlite3.Connection", "conv_id": "int"},
            "output": "Sequence[sqlite3.Row]",
        },
        "list_convalidaciones": {"input": {"conn": "sqlite3.Connection"}, "output": "Sequence[sqlite3.Row]"},
        "list_convalidaciones_for_destino": {
            "input": {"conn": "sqlite3.Connection", "id_modulo_destino": "int"},
            "output": "Sequence[sqlite3.Row]",
        },
        "update_convalidacion": {
            "input": {
                "conn": "sqlite3.Connection",
                "conv_id": "int",
                "id_modulo_destino": "int",
                "source_link": "str | None",
                "source_page": "int | None",
                "rule_mode": "RuleMode",
                "source_doc": "str | None",
                "source_anexo": "int | None",
            },
            "output": "bool",
        },
        "delete_convalidacion": {
            "input": {"conn": "sqlite3.Connection", "conv_id": "int"},
            "output": "bool",
        },
        "add_convalidacion_origen": {
            "input": {"conn": "sqlite3.Connection", "conv_id": "int", "id_modulo": "int"},
            "output": "bool",
        },
        "remove_convalidacion_origen": {
            "input": {"conn": "sqlite3.Connection", "conv_id": "int", "id_modulo": "int"},
            "output": "bool",
        },
        "replace_convalidacion_origenes": {
            "input": {"conn": "sqlite3.Connection", "conv_id": "int", "origen_modulos": "Iterable[int]"},
            "output": "None",
        },
    },
    "usuarios": {
        "create_usuario": {
            "input": {
                "conn": "sqlite3.Connection",
                "nombre": "str",
                "email": "str",
                "rol": "Literal['ALUMNO', 'ADMIN']",
            },
            "output": "int",
        },
        "get_usuario": {
            "input": {"conn": "sqlite3.Connection", "usuario_id": "int"},
            "output": "sqlite3.Row | None",
        },
        "get_usuario_by_email": {
            "input": {"conn": "sqlite3.Connection", "email": "str"},
            "output": "sqlite3.Row | None",
        },
        "list_usuarios": {"input": {"conn": "sqlite3.Connection"}, "output": "Sequence[sqlite3.Row]"},
    },
    "formularios": {
        "create_formulario": {
            "input": {
                "conn": "sqlite3.Connection",
                "id_alumno": "int",
                "estado": "FormularioEstado",
                "anotaciones": "str | None",
            },
            "output": "int",
        },
        "get_formulario": {
            "input": {"conn": "sqlite3.Connection", "formulario_id": "int"},
            "output": "sqlite3.Row | None",
        },
        "list_formularios": {
            "input": {
                "conn": "sqlite3.Connection",
                "id_alumno": "int | None",
                "estado": "FormularioEstado | None",
                "limit": "int",
                "offset": "int",
            },
            "output": "Sequence[sqlite3.Row]",
        },
        "update_formulario": {
            "input": {
                "conn": "sqlite3.Connection",
                "formulario_id": "int",
                "anotaciones": "str | None",
                "validado_por": "int | None",
            },
            "output": "bool",
        },
        "change_formulario_status": {
            "input": {
                "conn": "sqlite3.Connection",
                "formulario_id": "int",
                "new_estado": "FormularioEstado",
                "validado_por": "int | None",
                "anotaciones": "str | None",
            },
            "output": "bool",
        },
        "submit_formulario": {
            "input": {"conn": "sqlite3.Connection", "formulario_id": "int"},
            "output": "bool",
        },
        "review_formulario": {
            "input": {
                "conn": "sqlite3.Connection",
                "formulario_id": "int",
                "estado": 'Literal["A_REVISAR", "APROBADO", "RECHAZADO"]',
                "validado_por": "int",
                "anotaciones": "str | None",
            },
            "output": "bool",
        },
        "delete_formulario": {
            "input": {"conn": "sqlite3.Connection", "formulario_id": "int"},
            "output": "bool",
        },
        "create_formulario_solicitud": {
            "input": {
                "conn": "sqlite3.Connection",
                "id_formulario": "int",
                "id_modulo": "int | None",
                "id_convalidacion": "int | None",
                "descripcion": "str | None",
            },
            "output": "int",
        },
        "list_formulario_solicitudes": {
            "input": {"conn": "sqlite3.Connection", "id_formulario": "int"},
            "output": "Sequence[sqlite3.Row]",
        },
        "get_formulario_solicitud": {
            "input": {"conn": "sqlite3.Connection", "solicitud_id": "int"},
            "output": "sqlite3.Row | None",
        },
        "update_formulario_solicitud": {
            "input": {
                "conn": "sqlite3.Connection",
                "solicitud_id": "int",
                "id_modulo": "int | None | object",
                "id_convalidacion": "int | None | object",
                "descripcion": "str | None | object",
                "estado_evaluacion": "str | None | object",
            },
            "output": "bool",
        },
        "delete_formulario_solicitud": {
            "input": {"conn": "sqlite3.Connection", "solicitud_id": "int"},
            "output": "bool",
        },
        "create_formulario_modulo_aportado": {
            "input": {
                "conn": "sqlite3.Connection",
                "id_formulario": "int",
                "id_modulo": "int | None",
                "descripcion": "str | None",
            },
            "output": "int",
        },
        "list_formulario_modulos_aportados": {
            "input": {"conn": "sqlite3.Connection", "id_formulario": "int"},
            "output": "Sequence[sqlite3.Row]",
        },
        "update_formulario_modulo_aportado": {
            "input": {
                "conn": "sqlite3.Connection",
                "item_id": "int",
                "id_modulo": "int | None",
                "descripcion": "str | None",
            },
            "output": "bool",
        },
        "delete_formulario_modulo_aportado": {
            "input": {"conn": "sqlite3.Connection", "item_id": "int"},
            "output": "bool",
        },
        "create_formulario_archivo": {
            "input": {
                "conn": "sqlite3.Connection",
                "id_formulario": "int",
                "nombre_archivo": "str",
                "ruta_almacenamiento": "str",
                "descripcion": "str | None",
                "mime_type": "str | None",
                "size_bytes": "int | None",
            },
            "output": "int",
        },
        "list_formulario_archivos": {
            "input": {"conn": "sqlite3.Connection", "id_formulario": "int"},
            "output": "Sequence[sqlite3.Row]",
        },
        "delete_formulario_archivo": {
            "input": {"conn": "sqlite3.Connection", "archivo_id": "int"},
            "output": "bool",
        },
        "get_formulario_export_data": {
            "input": {"conn": "sqlite3.Connection", "formulario_id": "int"},
            "output": "FormularioExportOut",
        },
        "list_formularios_export_data": {
            "input": {
                "conn": "sqlite3.Connection",
                "id_alumno": "int | None",
                "estado": "FormularioEstado | None",
                "limit": "int",
                "offset": "int",
            },
            "output": "list[FormularioExportOut]",
        },
    },
    "motor_reglas": {
        "find_candidate_convalidaciones": {
            "input": {"conn": "sqlite3.Connection", "id_modulo_destino": "int"},
            "output": "list[dict[str, Any]]",
        },
        "evaluate_solicitud": {
            "input": {
                "conn": "sqlite3.Connection",
                "solicitud_id": "int",
                "auto_assign": "bool",
            },
            "output": "SolicitudEvaluationOut",
        },
        "evaluate_formulario": {
            "input": {
                "conn": "sqlite3.Connection",
                "formulario_id": "int",
                "auto_assign": "bool",
            },
            "output": "FormularioEvaluationOut",
        },
        "resolve_formulario_convalidaciones": {
            "input": {"conn": "sqlite3.Connection", "formulario_id": "int"},
            "output": "FormularioEvaluationOut",
        },
    },
}
