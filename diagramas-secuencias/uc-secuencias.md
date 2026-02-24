# Diagramas de Secuencia (UC1, UC2, UC3, UC4 y UC5)

## UC1 - Rellenar formulario

```mermaid
sequenceDiagram
autonumber
actor U as Alumno
participant UI as Formulario Oficial (Frontend)
participant API as Backend (API)
participant DB as DB Module (app.db.database)
participant FS as Almacenamiento de Archivos

note over U,UI: PASO 0/8 - Inicio de formulario en backend (borrador en DB)
U->>UI: Accede a "Rellenar formulario"
UI->>API: POST /formularios/iniciar
API->>DB: transaction(conn)
API->>DB: create_usuario(nombre, email, rol="ALUMNO")
DB-->>API: id_alumno
API->>DB: create_formulario(id_alumno, estado="BORRADOR", anotaciones=None)
DB-->>API: id_formulario
API-->>UI: id_formulario + estado BORRADOR

note over U,UI: PASO 1/8 - Paso 2: buscador de estudios
loop Cada cambio en input "Buscar estudio"
  U->>UI: Escribe grado/familia/ciclo
  UI->>API: GET /catalogo?search=texto&limit=...&offset=...
  API->>DB: get_catalog_entity(search, limit, offset)
  DB-->>API: coincidencias de catalogo academico
  API-->>UI: resultados
end
U->>UI: Selecciona uno o varios estudios aportados

note over U,UI: PASO 2/8 - Paso 2: selección de módulos aportados y cálculo de destinos
U->>UI: Marca módulos origen del estudio aportado
loop Por cada módulo origen seleccionado
  UI->>API: GET /catalogo?id_modulo_origen={id_modulo_origen}
  API->>DB: get_catalog_entity(search=None, id_modulo_origen, limit, offset)
  DB-->>API: módulos destino posibles (entity=modulo_destino)
  API-->>UI: destinos candidatos para convalidar

  loop Por cada destino candidato mostrado
    UI->>API: GET /convalidaciones?origen={id_modulo_origen}&destino={id_modulo_destino}
    API->>DB: list_convalidaciones_by_origen_destino(id_modulo_origen, id_modulo_destino)
    DB-->>API: reglas aplicables (0..n)
    API-->>UI: reglas y metadatos de convalidación
  end
end

note over U,UI: PASO 3/8 - Paso 3: mostrar solicitudes y persistir selección
UI-->>U: Muestra "Módulos solicitados" (sugeridos + manuales)
U->>UI: Confirma solicitudes a registrar
UI->>API: POST /formularios/{id}/modulos-aportados (batch)

loop Por cada módulo origen aportado confirmado
  API->>DB: create_formulario_modulo_aportado(id_formulario, id_modulo|None, descripcion|None)
end

UI->>API: POST /formularios/{id}/solicitudes (batch)
loop Por cada solicitud destino confirmada
  API->>DB: create_formulario_solicitud(id_formulario, id_modulo_destino|None, id_convalidacion|None, descripcion|None)
end
DB-->>API: ids de registros creados
API-->>UI: paso 3 persistido

note over U,UI: PASO 4/8 - Paso 4: documentación
loop Por cada archivo adjunto (DNI + adicionales)
  U->>UI: Adjunta archivo
  UI->>API: POST /formularios/{id}/archivos
  API->>FS: Guarda binario
  FS-->>API: ruta_almacenamiento
  API->>DB: create_formulario_archivo(id_formulario, nombre_archivo, ruta_almacenamiento, descripcion, mime_type, size_bytes)
  DB-->>API: archivo_id
  API-->>UI: archivo registrado
end

note over U,UI: PASO 5/8 - Previsualización
U->>UI: Pulsa "Finalizar" en paso 4
UI->>API: GET /formularios/{id}/resumen
API->>DB: get_formulario_detalle(formulario_id)
DB-->>API: resumen consolidado (formulario + solicitudes + modulos + archivos)
API-->>UI: resumen para verificación

note over U,UI: PASO 6/8 - Envío final por el alumno
U->>UI: Pulsa "Enviar solicitud"
UI->>API: PATCH /formularios/{id}/estado { new_estado: ENVIADO }
API->>DB: change_formulario_status(id_formulario, new_estado="ENVIADO")
DB-->>API: ok=True

note over API,DB: PASO 7/8 - Commit / rollback
alt Todo correcto
  API-->>UI: 200 OK (estado=ENVIADO)
  UI-->>U: Confirmación de envío
else Error en validación o persistencia
  API-->>UI: 4xx/5xx
  UI-->>U: Error y opción de reintento
end
```

Funciones backend citadas:

- `get_catalog_entity(...)` en `backend/app/db/database.py:349`
- `transaction(...)` en `backend/app/db/database.py:210`
- `create_usuario(...)` en `backend/app/db/database.py:619`
- `create_formulario(...)` en `backend/app/db/database.py:689`
- `create_formulario_modulo_aportado(...)` en `backend/app/db/database.py:982`
- `list_convalidaciones_by_origen_destino(...)` en `backend/app/db/database.py:573`
- `create_formulario_solicitud(...)` en `backend/app/db/database.py:941`
- `create_formulario_archivo(...)` en `backend/app/db/database.py:1022`
- `get_formulario_detalle(...)` en `backend/app/db/database.py`
- `change_formulario_status(...)` en `backend/app/db/database.py:902`

## UC2 - Ver formulario

```mermaid
sequenceDiagram
autonumber
actor A as Admin
participant UI as Web/App (Frontend)
participant API as Backend (API)
participant DB as DB Module (app.db.database)

note over A,UI: PASO 0/4 - Autenticación admin
A->>UI: Inicia sesión
UI->>API: POST /auth/admin/login
API->>DB: login_admin(email, password)
DB-->>API: admin | None
API-->>UI: sesión iniciada | error

note over A,UI: PASO 1/4 - Listado de formularios rellenados
A->>UI: Accede a "Ver formularios"
UI->>API: GET /formularios?estado=ENVIADO|A_REVISAR|APROBADO|RECHAZADO&limit&offset
API->>DB: list_formularios(id_alumno=None, estado, limit, offset)
DB-->>API: listado con datos base del formulario y alumno
API-->>UI: listado paginado

note over A,UI: PASO 2/4 - Ver detalle de un formulario
A->>UI: Selecciona formulario en el listado
UI->>API: GET /formularios/{id}/detalle
API->>DB: get_formulario_detalle(formulario_id)
DB-->>API: detalle consolidado
API-->>UI: detalle consolidado

opt Inspección de regla aplicada a una solicitud
  A->>UI: Pide ver regla para un origen/destino concreto
  UI->>API: GET /convalidaciones?origen={id_modulo_origen}&destino={id_modulo_destino}
  API->>DB: list_convalidaciones_by_origen_destino(id_modulo_origen, id_modulo_destino)
  DB-->>API: reglas del par origen+destino
  API-->>UI: detalle de reglas
end

note over A,UI: PASO 3/4 - Filtros de navegación
A->>UI: Ajusta filtros y paginación
UI->>API: GET /formularios?estado=...&limit=...&offset=...
API->>DB: list_formularios(id_alumno=None, estado, limit, offset)
DB-->>API: nueva página de resultados
API-->>UI: resultados filtrados
```

Funciones backend citadas:

- `login_admin(...)` en `backend/app/db/database.py:648`
- `list_formularios(...)` en `backend/app/db/database.py:710`
- `get_formulario_detalle(...)` en `backend/app/db/database.py`
- `list_convalidaciones_by_origen_destino(...)` en `backend/app/db/database.py:573`

## UC3 - Validar formulario

```mermaid
sequenceDiagram
autonumber
actor A as Admin
participant UI as Web/App (Frontend)
participant API as Backend (API)
participant DB as DB Module (app.db.database)

note over A,UI: PASO 0/4 - Autenticación admin
A->>UI: Inicia sesión
UI->>API: POST /auth/admin/login
API->>DB: login_admin(email, password)
DB-->>API: admin | None
API-->>UI: sesión iniciada | error

note over A,UI: PASO 1/4 - Listado de formularios pendientes
A->>UI: Accede a "Validar formularios"
UI->>API: GET /formularios?estado=ENVIADO|A_REVISAR&limit&offset
API->>DB: list_formularios(id_alumno=None, estado, limit, offset)
DB-->>API: lista de pendientes
API-->>UI: lista de pendientes

note over A,UI: PASO 2/4 - Revisión del formulario
A->>UI: Abre formulario a validar
UI->>API: GET /formularios/{id}/detalle
API->>DB: get_formulario_detalle(formulario_id)
DB-->>API: detalle consolidado
API-->>UI: detalle consolidado

loop Para cada solicitud a revisar
  A->>UI: Selecciona línea de solicitud
  UI->>API: GET /convalidaciones?origen={id_modulo_origen}&destino={id_modulo_destino}
  API->>DB: list_convalidaciones_by_origen_destino(id_modulo_origen, id_modulo_destino)
  DB-->>API: reglas aplicables
  API-->>UI: soporte de decisión para el admin
end

opt Requiere revisión previa
  A->>UI: Manda formulario a revisión
  UI->>API: PATCH /formularios/{id}/estado { new_estado: A_REVISAR }
  API->>DB: change_formulario_status(formulario_id, "A_REVISAR", validado_por, anotaciones)
  DB-->>API: OK
  API-->>UI: estado actualizado
end

note over A,UI: PASO 3/4 - Resolución final
A->>UI: Marca formulario como APROBADO o RECHAZADO
UI->>API: PATCH /formularios/{id}/estado { new_estado: APROBADO|RECHAZADO }
API->>DB: change_formulario_status(formulario_id, new_estado, validado_por, anotaciones)
DB-->>API: OK
API-->>UI: resultado final
```

Funciones backend citadas:

- `login_admin(...)` en `backend/app/db/database.py:648`
- `list_formularios(...)` en `backend/app/db/database.py:710`
- `get_formulario_detalle(...)` en `backend/app/db/database.py`
- `list_convalidaciones_by_origen_destino(...)` en `backend/app/db/database.py:573`
- `change_formulario_status(...)` en `backend/app/db/database.py:902`

Nota de alcance:

- No existe función pública para aprobar/rechazar cada solicitud de forma individual.
- La validación actual se aplica al formulario completo mediante `change_formulario_status(...)`.

## UC4 - Exportar formularios

```mermaid
sequenceDiagram
autonumber
actor A as Admin
participant UI as Web/App (Frontend)
participant API as Backend (API)
participant DB as DB Module (app.db.database)
participant FS as Sistema de archivos

note over A,UI: PASO 0/3 - Autenticación admin
A->>UI: Inicia sesión
UI->>API: POST /auth/admin/login
API->>DB: login_admin(email, password)
DB-->>API: admin | None
API-->>UI: sesión iniciada | error

note over A,UI: PASO 1/3 - Selección de filtros de exportación
A->>UI: Define estado/id_alumno/limit/offset
UI->>API: GET /formularios?filtros...
API->>DB: list_formularios(conn, id_alumno, estado, limit, offset)
DB-->>API: items a exportar
API-->>UI: previsualización y total

note over A,UI: PASO 2/3 - Generación y descarga
A->>UI: Pulsa "Exportar"
UI->>API: POST /formularios/export
API->>DB: list_formularios(conn, id_alumno, estado, limit, offset)
DB-->>API: rows
API->>FS: Genera archivo (JSON/CSV)
FS-->>API: ruta/stream
API-->>UI: archivo exportado
UI-->>A: Descarga completada
```

Funciones backend citadas:

- `login_admin(...)` en `backend/app/db/database.py:648`
- `list_formularios(...)` en `backend/app/db/database.py:710`

## UC5 - Administrar convalidaciones

```mermaid
sequenceDiagram
autonumber
actor A as Admin
participant UI as Web/App (Frontend)
participant API as Backend (API)
participant DB as DB Module (app.db.database)

note over A,UI: PASO 0/4 - Autenticación admin
A->>UI: Inicia sesión
UI->>API: POST /auth/admin/login
API->>DB: login_admin(email, password)
DB-->>API: admin | None
API-->>UI: sesión iniciada | error

note over A,UI: PASO 1/4 - Búsqueda de catálogos para definir reglas
loop Búsqueda por texto (grado/familia/ciclo)
  A->>UI: Escribe criterio en buscador
  UI->>API: GET /catalogo?search=texto
  API->>DB: get_catalog_entity(search, limit, offset)
  DB-->>API: coincidencias de catálogo
  API-->>UI: resultados
end

A->>UI: Selecciona módulo origen
UI->>API: GET /catalogo?id_modulo_origen={id_modulo_origen}
API->>DB: get_catalog_entity(search=None, id_modulo_origen, limit, offset)
DB-->>API: destinos posibles para ese origen
API-->>UI: módulos destino candidatos

note over A,UI: PASO 2/4 - Consulta de reglas existentes para un par
A->>UI: Selecciona origen + destino
UI->>API: GET /convalidaciones?origen={id_modulo_origen}&destino={id_modulo_destino}
API->>DB: list_convalidaciones_by_origen_destino(id_modulo_origen, id_modulo_destino)
DB-->>API: reglas vigentes para el par
API-->>UI: listado de reglas

note over A,UI: PASO 3/4 - Crear nueva convalidación
A->>UI: Introduce destino + orígenes + fuente
UI->>API: POST /convalidaciones
API->>DB: create_convalidacion(id_modulo_destino, source_link, source_page, origen_modulos, rule_mode, source_doc, source_anexo)
DB-->>API: conv_id
API-->>UI: creada

note over A,UI: PASO 4/4 - Consultar convalidación concreta
A->>UI: Abre una regla por id
UI->>API: GET /convalidaciones/{id}
API->>DB: get_convalidacion(conv_id)
DB-->>API: convalidación
API-->>UI: detalle

opt Mantenimiento global (operación de administración)
  A->>UI: Solicita limpieza total de reglas
  UI->>API: POST /convalidaciones/clear
  API->>DB: clear_convalidaciones()
  DB-->>API: OK
  API-->>UI: reglas eliminadas
end
```

Funciones backend citadas:

- `login_admin(...)` en `backend/app/db/database.py:648`
- `get_catalog_entity(...)` en `backend/app/db/database.py:349`
- `list_convalidaciones_by_origen_destino(...)` en `backend/app/db/database.py:573`
- `create_convalidacion(...)` en `backend/app/db/database.py:528`
- `get_convalidacion(...)` en `backend/app/db/database.py:565`
- `clear_convalidaciones(...)` en `backend/app/db/database.py:521`

Nota de alcance:

- No existen funciones públicas activas para `update` o `delete` de convalidaciones.
- El flujo actual es alta + consulta, y búsqueda dirigida por origen/destino.
