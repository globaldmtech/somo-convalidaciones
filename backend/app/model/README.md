# Modelos

Define aqui las clases de dominio (dataclasses o modelos Pydantic).

Objetivos iniciales (desde `Roadmap interno`):
- Catalogo: Grado, Familia, Ciclo, Modulo
- Convalidaciones: Convalidacion, ConvalidacionOrigen
- Formularios: Usuario, Formulario, FormularioSolicitud, FormularioModuloAportado, FormularioArchivo

Guia:
- Mantener modelos simples y serializables. No es necesario una clase por tabla, hay que pensar en la estructura más adecuada para nuestros casos de uso.
