# somo-convalidaciones

Aplicación para gestionar convalidaciones de módulos de FP de Somorrostro.

El proyecto está compuesto por:

- `backend/`: API en FastAPI y acceso a SQLite
- `frontend/`: cliente Angular
- `backend/scripts/`: scripts SQL y utilidades para cargar catálogo y reglas

## Requisitos

Para desplegar el proyecto completo con Docker necesitas:

- `git`
- `Docker`
- `Docker Compose`

## Clonar el proyecto

```bash
git clone https://github.com/globaldmtech/somo-convalidaciones.git
cd somo-convalidaciones
```

## Configurar variables de entorno

El backend carga variables desde `backend/.env`. El contenido mínimo es:


Variables útiles:

- `DB_PATH`: ruta de la base de datos SQLite relativa a `backend/`
- `FORM_UPLOAD_DIR`: carpeta donde se guardan los adjuntos. Por defecto `/app/data/uploads`
- `CORS_ALLOWED_ORIGINS`: orígenes permitidos para el frontend en desarrollo. Por defecto `http://localhost:4200`
- `FRONTEND_DIST_DIR`: ruta del frontend compilado cuando se sirve desde FastAPI.

Ejemplo para Docker:

```env
DB_PATH=scripts/db.sqlite
FORM_UPLOAD_DIR=/app/data/uploads
```

## Inicializar la base de datos

La aplicación usa SQLite y el repositorio ya incluye una base de datos en `backend/scripts/db.sqlite`.

No hace falta generarla para levantar el proyecto con Docker si vas a usar esa base ya preparada.

Si en algún momento quisieras reconstruirla desde cero, entonces tendrías que volver a crear `backend/scripts/db.sqlite` y cargar el esquema y los datos base con estos ficheros SQL:

Linux/macOS:

```bash
cd backend/scripts
rm -f db.sqlite
sqlite3 db.sqlite < 1_load_schema.sql
sqlite3 db.sqlite < 2_load_catalog.sql
sqlite3 db.sqlite < 3_load_convalidations.sql
sqlite3 db.sqlite < 4_load_convalidations_global.sql
sqlite3 db.sqlite < 5_load_convalidations_ciclo_global.sql
sqlite3 db.sqlite < 6_load_convalidations_externa.sql
sqlite3 db.sqlite < 7_load_estados.sql
sqlite3 db.sqlite < 8_insert_admins.sql
cd ../..
```

Si no tienes `sqlite3` instalado, puedes ejecutar esos mismos ficheros SQL desde cualquier cliente SQLite compatible.

## Despliegue con Docker

El repositorio ya incluye `Dockerfile` y `docker-compose.yml`. La imagen:

- instala dependencias Python
- compila el frontend Angular
- sirve todo desde FastAPI en el puerto `8000`

Antes de levantar los contenedores, asegúrate de tener:

- `backend/.env` configurado
- `backend/scripts/db.sqlite` creado con los scripts SQL
- `data/uploads/` creada si quieres persistir adjuntos

Construimos y levantamos el servicio:

```bash
docker compose up --build -d
```

La aplicación quedará disponible en:

```text
http://localhost:8000
```

Para analizar los logs del contenedor:

```bash
docker compose logs -f
```

Para parar el servicio:

```bash
docker compose down
```

