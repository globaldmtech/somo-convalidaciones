# Inventario de funciones

## Inventario de funciones por caso de uso

### UC1 - Rellenar formulario (Alumno)

```python
get_catalog_entity(conn, search=None, *, id_modulo_origen=None, limit=100, offset=0) -> Sequence[CatalogEntity]
create_usuario(conn, nombre, email, rol="ALUMNO", *, password=None) -> int
create_formulario(conn, id_alumno, estado="BORRADOR", anotaciones=None) -> int
create_formulario_modulo_aportado(conn, id_formulario, id_modulo=None, descripcion=None) -> int
create_formulario_solicitud(conn, id_formulario, id_modulo, id_convalidacion=None, descripcion=None) -> int
create_formulario_archivo(conn, id_formulario, nombre_archivo, ruta_almacenamiento, *, descripcion=None, mime_type=None, size_bytes=None) -> int
get_formulario_detalle(conn, formulario_id) -> FormularioDetalle | None
change_formulario_status(conn, formulario_id, new_estado, *, validado_por=None, anotaciones=None) -> bool
```

### UC2 - Ver formularios rellenados (Admin)

```python
login_admin(conn, email, password) -> Usuario | None
list_formularios(conn, id_alumno=None, estado=None, limit=100, offset=0) -> Sequence[FormularioListItem]
get_formulario_detalle(conn, formulario_id) -> FormularioDetalle | None
list_convalidaciones_by_origen_destino(conn, id_modulo_origen, id_modulo_destino) -> Sequence[ConvalidacionRegla]
```

### UC3 - Validar formularios (Admin)

```python
login_admin(conn, email, password) -> Usuario | None
list_formularios(conn, id_alumno=None, estado=None, limit=100, offset=0) -> Sequence[FormularioListItem]
get_formulario_detalle(conn, formulario_id) -> FormularioDetalle | None
list_convalidaciones_by_origen_destino(conn, id_modulo_origen, id_modulo_destino) -> Sequence[ConvalidacionRegla]
change_formulario_status(conn, formulario_id, new_estado, *, validado_por=None, anotaciones=None) -> bool
```

### UC4 - Exportar formularios (Admin)

```python
login_admin(conn, email, password) -> Usuario | None
list_formularios(conn, id_alumno=None, estado=None, limit=100, offset=0) -> Sequence[FormularioListItem]
get_formulario_detalle(conn, formulario_id) -> FormularioDetalle | None
```

### UC5 - Administrar convalidaciones (Admin)

```python
get_catalog_entity(conn, search=None, *, id_modulo_origen=None, limit=100, offset=0) -> Sequence[CatalogEntity]
list_convalidaciones_by_origen_destino(conn, id_modulo_origen, id_modulo_destino) -> Sequence[ConvalidacionRegla]
create_convalidacion(conn, id_modulo_destino, source_link, source_page, origen_modulos, *, rule_mode="ALL", source_doc=None, source_anexo=None) -> int
get_convalidacion(conn, conv_id) -> Convalidacion | None
clear_convalidaciones(conn) -> None
```

## Funciones de soporte transversales

```python
transaction(conn)
connect(config) -> sqlite3.Connection
close(conn) -> None
init_db(config) -> None
healthcheck(conn) -> dict[str, Any]
```

Soporte de carga de catálogo académico:

```python
clear_catalog(conn) -> None
create_grado(conn, nombre) -> int
create_familia(conn, nombre, id_grado) -> int
create_ciclo(conn, nombre, id_familia, *, titulo=None, id_oficial=None, normativa=None) -> int
create_modulo(conn, nombre, id_ciclo, *, id_oficial=None) -> int
```
