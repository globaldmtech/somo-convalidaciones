# somo-convalidaciones
Convalidaciones de modulos de CF Somorrostro.

## Estructura
- `backend/` Backend en Python
- `docs/` Documentacion del proyecto
- `data/` Datos locales y base de datos SQLite

## Variables de entorno
Se necesita que este el archivo `.env` con lo siguiente:

```.env
DB_PATH=data/somo.db
FORM_UPLOAD_DIR=/app/data/uploads
```

## Adjuntos de formularios
Los documentos que sube cada alumno se guardan en el contenedor en `FORM_UPLOAD_DIR`.
En `docker-compose.yml` ese directorio queda montado como `./data/uploads`, para que los adjuntos persistan fuera del contenedor.
