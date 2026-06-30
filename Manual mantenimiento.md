## Manual técnico

## 1. Objetivo

Este documento describe la versión actual de `SOMO Convalidaciones` desde el punto de vista técnico: arquitectura, configuración, despliegue, estructura del código y flujos principales.

Su propósito es servir como referencia para:

- mantenimiento del sistema;
- incorporación de nuevas personas al proyecto;
- soporte técnico;
- despliegue en servidor;
- evolución funcional del backend y frontend.

## 2. Visión general

La aplicación gestiona solicitudes de convalidación de módulos de FP y está compuesta por:

- un `frontend` en Angular;
- un `backend` en FastAPI;
- una base de datos `SQLite`;
- un directorio de archivos adjuntos;

El backend sirve tanto la API como el frontend compilado en producción.

## 3. Stack tecnológico

## 3.1. Backend

- `Python 3.11`
- `FastAPI`
- `Uvicorn`
- `SQLite`
- `Pydantic v2`
- `PyJWT`
- `openpyxl`
- `python-dotenv`
- `python-multipart`

## 3.2. Frontend

- `Angular 21`
- `TypeScript 5.9`
- `RxJS 7`
- `Tailwind CSS 3`

## 3.3. Infraestructura

- `Docker`
- `docker compose`
- proxy inverso externo opcional en red Docker compartida

## 4. Estructura actual del proyecto

```text
somo-convalidaciones/
├── Dockerfile
├── docker-compose.yml
├── README.md
├── requirements.txt
├── Manual de uso.md
├── Manual técnico.md
├── backend/
│   ├── .env
│   ├── endpoints.md
│   ├── app/
│   │   ├── main.py
│   │   ├── api/routers/
│   │   ├── auth/
│   │   ├── db/database.py
│   │   └── model/
│   └── scripts/
│       ├── 1_load_schema.sql
│       ├── 2_load_catalog.sql
│       ├── 2b_mark_somorrostro.sql
│       ├── 3_load_convalidations.sql
│       ├── 4_load_convalidations_global.sql
│       ├── 5_load_convalidations_ciclo_global.sql
│       ├── 6_load_convalidations_externa.sql
│       ├── 7_load_estados.sql
│       ├── 8_insert_admins.sql
│       └── db.sqlite
└── frontend/
    ├── angular.json
    ├── package.json
    ├── proxy.conf.json
    ├── public/
    ├── src/
    │   └── app/
    │       ├── components/
    │       ├── config/
    │       ├── models/
    │       ├── pages/
    │       └── services/
    └── dist/
```

## 5. Configuración

## 5.1. Variables de entorno usadas por el backend

Variables observadas en código y documentación:

- `DB_PATH`: ruta del fichero SQLite relativa al backend.
- `FORM_UPLOAD_DIR`: directorio donde se guardan los adjuntos.
- `FRONTEND_DIST_DIR`: ruta del frontend compilado.
- `CORS_ALLOWED_ORIGINS`: lista de orígenes permitidos para CORS.
- `APP_BASE_PATH`: subruta pública de despliegue, por ejemplo `/convalidaciones`.
- `TENANT_ID`: tenant de Microsoft Entra ID.
- `CLIENT_ID`: identificador de la aplicación en Entra ID.
- `CLIENT_SECRET`: secreto usado por el servicio de autenticación compartida.
- `AUTH_SESSION_SECRET`: secreto con el que se valida la cookie de sesión compartida.
- `AUTH_SESSION_COOKIE_NAME`: nombre de la cookie compartida.
- `AUTH_SESSION_ISSUER`: issuer esperado del JWT.
- `AUTH_SESSION_TTL_SECONDS`: vida útil del token compartido.
- `ADMIN_AUTH_SECRET`: fallback legacy si no existe `AUTH_SESSION_SECRET`.

En el despliegue actual, el fichero de entorno está ubicado en:

- `/etc/somo-convalidaciones.env`

La configuración esperada para persistencia es:

```env
DB_PATH=/srv/convalidaciones/data/db.sqlite
FORM_UPLOAD_DIR=/srv/convalidaciones/data/uploads
```

En el despliegue actual del servidor, la persistencia está ubicada en:

- base de datos SQLite: `/srv/convalidaciones/data/db.sqlite`
- adjuntos: `/srv/convalidaciones/data/uploads`

## 6. Arquitectura del backend

## 6.1. Punto de entrada

`backend/app/main.py` es el punto de entrada principal y asume estas responsabilidades:

- crear la instancia `FastAPI`;
- normalizar `APP_BASE_PATH`;
- configurar `root_path`;
- configurar `CORS`;
- registrar routers;
- servir el frontend compilado;
- hacer fallback SPA para rutas no API;
- devolver errores 404 para assets inexistentes;
- registrar un manejador global de excepciones.

## 6.2. Routers activos

La API se organiza en dos routers:

- `backend/app/api/routers/convalidaciones.py`
- `backend/app/api/routers/admin.py`

### Router público `convalidaciones.py`

Endpoints consumidos por la aplicación:

- `GET /grados_existentes`
- `GET /ciclos_existentes`
- `GET /modulos_existentes`
- `GET /acreditaciones_externas`
- `POST /calcular`
- `POST /insertar_formulario_completo`
- `GET /session`

Funciones principales:

- exponer catálogo para el formulario;
- calcular convalidaciones automáticas;
- insertar formularios completos en una sola transacción;
- guardar archivos adjuntos;
- resolver la sesión del usuario autenticado.

### Router privado `admin.py`

Endpoints consumidos por la aplicación:

- `GET /admin/session`
- `GET /admin/formularios`
- `GET /admin/documentos/abrir`
- `GET /admin/exportar_solicitudes_convalidacion`
- `PUT /admin/formularios/{id_formulario}/estado`
- `DELETE /admin/formularios/{id_formulario}`
- `PUT /admin/solicitudes/{id_solicitud}/estado`
- `GET /admin/ciclos-modulos`
- `POST /admin/ciclos`
- `PUT /admin/ciclos/{id_ciclo}`
- `DELETE /admin/ciclos/{id_ciclo}`
- `POST /admin/ciclos/{id_ciclo}/modulos`
- `DELETE /admin/modulos/{id_modulo}`
- `GET /admin/convalidaciones`
- `POST /admin/crear_convalidaciones`
- `POST /admin/crear_convalidaciones_masivas`
- `DELETE /admin/convalidaciones_masivas`
- `POST /admin/crear_convalidaciones_ciclo`
- `POST /admin/crear_convalidaciones_ciclo_masivas`
- `DELETE /admin/convalidaciones_ciclo_masivas`
- `DELETE /admin/convalidaciones/{id_convalidacion}`
- `DELETE /admin/convalidaciones-ciclo/{id_convalidacion_ciclo}`
- `DELETE /admin/convalidaciones/{id_convalidacion}/origenes/{id_modulo_origen}`
- `GET /admin/usuarios`
- `PUT /admin/usuarios/{id_usuario}/rol`

## 6.3. Autenticación y autorización

La autenticación ya no vive dentro de la SPA.

Flujo actual:

1. El frontend redirige a `/auth/login`.
2. El servicio `somo_auth` completa el login con Microsoft Entra ID.
3. `somo_auth` emite una cookie `HttpOnly` compartida.
4. `backend/app/auth/shared_session.py` valida el JWT.
5. `backend/app/auth/session_user.py` resuelve el usuario y exige rol admin cuando procede.

Piezas relevantes:

- `backend/app/auth/microsoft.py`: utilidades de configuración Microsoft.
- `backend/app/auth/shared_session.py`: codificación y validación del token compartido.
- `backend/app/auth/session_user.py`: lectura de cookie y resolución del usuario.

`admin.py` utiliza una clase `AdminAuthRoute` para proteger casi todo el router.

## 6.4. Acceso a datos

`backend/app/db/database.py` concentra:

- apertura de conexión SQLite;
- pequeñas migraciones defensivas al arrancar;
- consultas de catálogo;
- consultas y mutaciones de usuarios;
- cálculo de convalidaciones;
- inserción del formulario completo;
- consultas del panel admin.

Además de exponer dependencias para FastAPI, el módulo contiene varias clases lógicas como:

- `CatalogQueries`
- `ConvalidationQueries`
- `FormularioQueries`
- `AdminQueries`
- `UserQueries`

## 7. Modelo de datos

## 7.1. Tablas principales

Según `backend/scripts/1_load_schema.sql`, el núcleo del modelo contiene:

- `grados`
- `familias`
- `ciclos`
- `modulos`
- `convalidacion`
- `convalidacion_origen`
- `convalidacion_ciclo`
- `usuarios`
- `estados_formularios`
- `estados_modulos_destino`
- `formularios`
- `formulario_solicitudes`
- `formulario_modulos_aportados`
- `formulario_ciclos_aportados`
- `formulario_archivos`

## 7.2. Estados

Estados de formulario cargados por `7_load_estados.sql`:

- `0`: `revision`
- `1`: `validado`
- `2`: `rechazado`
- `3`: `archivado_validado`
- `4`: `archivado_rechazado`

Estados de solicitud o módulo destino:

- `0`: `revision`
- `1`: `validado`
- `2`: `rechazado`

## 7.3. Rasgos del catálogo

El catálogo actual contempla:

- ciclos marcados con `es_somorrostro`;
- módulos con flag `deprecated`;
- módulos numéricos y no numéricos;
- reglas de convalidación por módulos o por ciclo completo.

## 8. Flujo técnico del formulario

## 8.1. Sesión del usuario

`/formulario` llama a `GET /session`.

Si la sesión es válida:

- el frontend precarga nombre, apellidos, documento y correo desde el usuario autenticado.

Si devuelve `401`:

- el usuario vuelve a la ruta de entrada para reiniciar autenticación.

## 8.2. Carga de catálogo

Durante el uso del formulario se consumen:

- `GET /grados_existentes`
- `GET /ciclos_existentes`
- `GET /modulos_existentes`
- `GET /acreditaciones_externas`

## 8.3. Cálculo de convalidaciones

El paso 3 envía `POST /calcular` con:

- módulos aportados y sus notas;
- acreditaciones externas;
- ciclos completos aportados;
- ciclo destino.

La respuesta devuelve una lista de propuestas de convalidación con información de:

- módulo destino;
- tipo de origen;
- módulo o ciclo origen;
- ids asociados;
- nota media;
- observaciones.

## 8.4. Envío transaccional del formulario

`POST /insertar_formulario_completo` recibe:

- un JSON serializado en el campo `payload`;
- archivos multipart para DNI, certificados y otros documentos;
- nombres visibles de certificados y otros documentos.

Orden lógico del backend:

1. validar sesión;
2. actualizar el perfil del usuario autenticado;
3. crear el formulario;
4. guardar módulos y ciclos aportados;
5. guardar solicitudes registradas y no registradas;
6. persistir archivos;
7. registrar metadatos de archivos;
8. hacer `commit`.

Si algo falla:

- se hace `rollback` de base de datos;
- se borran del disco los archivos ya escritos;
- se devuelve un error HTTP.

## 8.5. Persistencia de adjuntos

Los adjuntos se almacenan en el directorio configurado por `FORM_UPLOAD_DIR`.

El nombre interno del archivo se genera a partir de:

- DNI saneado;
- `id_formulario`;
- descripción del documento;
- extensión original.

Medidas observadas:

- saneado de caracteres del nombre;
- validación de ruta para evitar path traversal;
- rechazo de nombres duplicados dentro del mismo envío.

## 9. Flujo técnico del panel admin

## 9.1. Entrada al panel

`/admin` primero valida la sesión admin con `GET /admin/session`.

Si falla por permisos:

- el frontend intenta distinguir entre falta de sesión y falta de rol admin para mostrar el mensaje adecuado.

## 9.2. Formularios

El panel obtiene formularios mediante `GET /admin/formularios`.

Desde ahí puede:

- cambiar estado global del formulario;
- cambiar estado de solicitudes individuales;
- asignar nota manual;
- exportar validadas a Excel;
- abrir documentos;
- archivar o desarchivar;
- eliminar formularios.

La exportación usa `openpyxl` y genera el fichero:

- `solicitudes_convalidacion_validadas.xlsx`

## 9.3. Catálogo

El mantenimiento del catálogo se apoya en:

- `GET /admin/ciclos-modulos`
- `POST /admin/ciclos`
- `PUT /admin/ciclos/{id}`
- `DELETE /admin/ciclos/{id}`
- `POST /admin/ciclos/{id}/modulos`
- `DELETE /admin/modulos/{id}`

La interfaz también separa módulos activos y obsoletos mediante el campo `deprecated`.

## 9.4. Reglas de convalidación

Las reglas pueden ser:

- módulo a módulo;
- por ciclo completo.

El panel soporta:

- alta individual;
- baja individual;
- alta masiva;
- baja masiva;
- eliminación de un origen concreto dentro de una regla existente.

## 9.5. Roles de usuario

La gestión de administradores ya no depende de una tabla separada.

El sistema trabaja sobre `usuarios.rol`, con valores:

- `admin`
- `alumno`

## 10. Frontend

## 10.1. Rutas

Definidas en `frontend/src/app/app.routes.ts`:

- `''`
- `'formulario'`
- `'admin'`
- wildcard a `''`

## 10.2. Páginas principales

- `entry-page.component.ts`: decide redirección según sesión y rol.
- `formulario-page.component.ts`: orquesta los 5 pasos del formulario.
- `admin-page.component.ts`: concentra todo el panel de administración.

## 10.3. Componentes del formulario

- `datos-personales`
- `estudios-cursados`
- `convalidaciones-solicitadas`
- `documentacion-aportar`
- `resumen-formulario`

## 10.4. Servicios

- `ConvalidacionesService`: sesión, formulario, admin y auth URLs.
- `CatalogService`: lectura de catálogo.

## 10.5. Base path y despliegue bajo subruta

`frontend/src/app/config/api-paths.ts` calcula rutas API a partir de `document.baseURI`.

Esto permite desplegar la SPA bajo subrutas como:

- `/convalidaciones`

Sin embargo, la base de autenticación compartida se mantiene en:

- `/auth`

## 11. Despliegue actual

El despliegue actual de `SOMO Convalidaciones` funciona así:

- Ruta pública: `/convalidaciones/`
- Servicio systemd: `somo-convalidaciones.service`
- Socket Unix: `/run/somo-convalidaciones/app.sock`
- Código: `/srv/convalidaciones/app`
- Entorno virtual: `/srv/convalidaciones/venv`
- Variables de entorno: `/etc/somo-convalidaciones.env`
- Datos: `/srv/convalidaciones/data`
- Base de datos SQLite: `/srv/convalidaciones/data/db.sqlite`
- Adjuntos: `/srv/convalidaciones/data/uploads`

El backend se publica con `uvicorn` sobre socket Unix y `nginx` expone la aplicación bajo la subruta `/convalidaciones/`. Además, el propio backend sirve el frontend Angular ya compilado.

Para revisar la configuración cargada en el servidor:

- `cat /etc/somo-convalidaciones.env`

### 11.1. Variables de entorno mínimas

El fichero `/etc/somo-convalidaciones.env` debe contener al menos las variables de persistencia y de publicación. A nivel de código, las variables relevantes son:

- `DB_PATH`
- `FORM_UPLOAD_DIR`
- `FRONTEND_DIST_DIR`
- `APP_BASE_PATH`
- `CORS_ALLOWED_ORIGINS`
- `TENANT_ID`
- `CLIENT_ID`
- `CLIENT_SECRET`
- `AUTH_SESSION_SECRET`
- `AUTH_SESSION_COOKIE_NAME`
- `AUTH_SESSION_ISSUER`
- `ADMIN_AUTH_SECRET`

Valores esperados en despliegue:

- `APP_BASE_PATH=/convalidaciones`
- `DB_PATH=/srv/convalidaciones/data/db.sqlite`
- `FORM_UPLOAD_DIR=/srv/convalidaciones/data/uploads`
- `FRONTEND_DIST_DIR=/srv/convalidaciones/app/frontend/dist/frontend/browser`

### 11.2. Particularidad importante del frontend

El servidor no compila el frontend. El build debe generarse y dejarse disponible en:

- `/srv/convalidaciones/app/frontend/dist/frontend/browser`

Esto implica que un despliegue completo normalmente incluye:

1. Actualizar código backend.
2. Generar `frontend/dist/frontend/browser` si ha habido cambios en frontend.
3. Subir o actualizar el resultado en servidor.
4. Reiniciar el servicio.
5. Validar acceso web.

### 11.3. Servicio systemd

El servicio definido en `/etc/systemd/system/somo-convalidaciones.service`:

- usa `WorkingDirectory=/srv/convalidaciones/app`
- carga variables desde `/etc/somo-convalidaciones.env`
- arranca `uvicorn backend.app.main:app --uds /run/somo-convalidaciones/app.sock`
- elimina antes cualquier socket anterior en `ExecStartPre`

### 11.4. Proxy inverso

`nginx` publica la aplicación en `webapps.somorrostro.com` bajo la subruta `/convalidaciones/`.

Puntos relevantes de esa configuración:

- redirección de `/convalidaciones` a `/convalidaciones/`
- `proxy_pass` al socket Unix `/run/somo-convalidaciones/app.sock`
- envío de `X-Forwarded-Prefix: /convalidaciones`

Si cambia la subruta pública, hay que revisar `APP_BASE_PATH`, `nginx` y las rutas generadas por el frontend.
