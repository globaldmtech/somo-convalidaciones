# Modelos

Define aqui las clases de dominio (dataclasses o modelos Pydantic).

Objetivos iniciales (desde `Roadmap interno`):
- Catalogo: Grado, Familia, Ciclo, Modulo
- Convalidaciones: Convalidacion, ConvalidacionOrigen
- Formularios: Usuario, Formulario, FormularioSolicitud, FormularioModuloAportado, FormularioArchivo

Guia:
- Mantener modelos simples y serializables. No es necesario una clase por tabla, hay que pensar en la estructura más adecuada para nuestros casos de uso.

Modelos Pydantic usados por la capa de base de datos.

- Archivo principal: `entities.py`.
- Uso actual: salidas de lectura de `app.db.database` (`list_*` y `get_*`).
- Objetivo: acceso por atributos (por ejemplo, `item.nombre`) y validación simple de datos.
