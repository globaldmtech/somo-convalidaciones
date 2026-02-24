"""I/O contracts for DB module functions.

This file is the explicit design inventory requested before implementation:
- Function list by use case
- Exact input/output format for each public operation
"""
from __future__ import annotations

from typing import Any, Literal, TypedDict


# Estados permitidos para el ciclo de vida de un formulario.
FormularioEstado = Literal["BORRADOR", "ENVIADO", "A_REVISAR", "APROBADO", "RECHAZADO"]
# Modos de evaluacion de reglas de convalidacion (todos o alguno de los origenes).
RuleMode = Literal["ALL", "ANY"]


# Salida estandar para verificar el estado de la conexion SQLite.
class HealthcheckOut(TypedDict):
    ok: bool
    sqlite_version: str
    database_file: str | None


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
        "create_grado": {
            "input": {
                "conn": "sqlite3.Connection",
                "nombre": "str",
            },
            "output": "int",
        },
        "create_familia": {
            "input": {
                "conn": "sqlite3.Connection",
                "nombre": "str",
                "id_grado": "int",
            },
            "output": "int",
        },
        "create_ciclo": {
            "input": {
                "conn": "sqlite3.Connection",
                "nombre": "str",
                "id_familia": "int",
                "titulo": "str | None",
                "id_oficial": "str | None",
                "normativa": "str | None",
            },
            "output": "int",
        },
        "create_modulo": {
            "input": {
                "conn": "sqlite3.Connection",
                "nombre": "str",
                "id_ciclo": "int",
                "id_oficial": "str | None",
            },
            "output": "int",
        },
        "get_catalog_entity": {
            "input": {
                "conn": "sqlite3.Connection",
                "search": "str | None",
                "id_modulo_origen": "int | None",
                "limit": "int",
                "offset": "int",
            },
            "output": "Sequence[sqlite3.Row]",
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
        "list_convalidaciones_by_origen_destino": {
            "input": {
                "conn": "sqlite3.Connection",
                "id_modulo_origen": "int",
                "id_modulo_destino": "int",
            },
            "output": "Sequence[sqlite3.Row]",
        },
        # TODO: definir contrato de `update_convalidacion` cuando se confirme el caso de uso.
    },
    "usuarios": {
        "create_usuario": {
            "input": {
                "conn": "sqlite3.Connection",
                "nombre": "str",
                "email": "str",
                "rol": "Literal['ALUMNO', 'ADMIN']",
                "password": "str | None",
            },
            "output": "int",
        },
        "login_admin": {
            "input": {
                "conn": "sqlite3.Connection",
                "email": "str",
                "password": "str",
            },
            "output": "sqlite3.Row | None",
        },
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
        "get_formulario_detalle": {
            "input": {
                "conn": "sqlite3.Connection",
                "formulario_id": "int",
            },
            "output": (
                "dict[str, Any] | None  # {"
                "formulario: dict, solicitudes: list[dict], "
                "modulos_aportados: list[dict], archivos: list[dict]}"
            ),
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
    },
}
