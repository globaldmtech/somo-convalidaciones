from pydantic import BaseModel


class CambiarEstadoFormularioRequest(BaseModel):
    estado_id: int
    admin_id: int | None = None


class CambiarEstadoSolicitudRequest(BaseModel):
    estado_modulo_id: int
    admin_id: int | None = None
    nota_manual: float | None = None


class AdminLoginRequest(BaseModel):
    nombre: str
    password: str


class AdminMicrosoftLoginRequest(BaseModel):
    token: str


class CrearCicloRequest(BaseModel):
    nombre: str
    id_familia: int
    id_grado: int


class CrearModuloItemRequest(BaseModel):
    id_oficial: str | None = None
    nombre: str
    numerico: int = 1


class CrearModulosRequest(BaseModel):
    modulos: list[CrearModuloItemRequest]


class CrearConvalidacionRequest(BaseModel):
    id_modulo_destino: int
    id_modulos_origen: list[int]
    source_link: str | None = None
    source_page: int | None = None


class CrearAdministradorRequest(BaseModel):
    nombre: str
    password: str


class ActualizarAdministradorRequest(BaseModel):
    nombre: str | None = None
    password: str | None = None
