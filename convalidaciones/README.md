# Convalidaciones — Arquitectura y lógica de extracción

Este directorio contiene la lógica de extracción de convalidaciones desde el PDF **BOE-A-2020-17274** y la creación de las tablas `Convalidacion` y `Convalidacion_links` en la base de datos `grados-familias-ciclos-modulos.db`.

## Estructura de la carpeta

- `build_convalidaciones.py`  
  Punto de entrada (CLI). Recorre el PDF, detecta anexos, delega el parseo por tipo de tabla y escribe los resultados en BD.

- `constants.py`  
  Constantes compartidas: rutas por defecto, regex, settings de `pdfplumber`, mapa de anexos y anexos válidos.

- `types.py`  
  Modelo `Item` (módulo / ciclo / familia / grado) para normalizar entradas extraídas de las celdas.

- `normalize.py`  
  Normalización y parsing de texto: limpieza de nombres, detección de códigos de módulos, extracción de RDs, y parsing de celdas a `Item`.

- `parsing.py`  
  Parsing de tablas por tipo/anexo: detección de cabeceras, títulos, grados, ciclos, y construcción de convalidaciones.

- `db.py`  
  DDL de tablas, resolución de IDs contra catálogo, e inserción de convalidaciones y links.

## Lógica general del proceso

1. **Carga del PDF** con `pdfplumber`.
2. **Detección del anexo** por texto de página y/o contenido de la tabla.
3. **Normalización de tablas** (eliminar columnas vacías, limpiar celdas).
4. **Parseo por anexo** (cada anexo tiene reglas propias).
5. **Inserción en BD**:
   - `Convalidacion`: ID estable, `source_doc`, `source_anexo`, `source_page`.
   - `Convalidacion_links`: vínculos origen/destino (módulo/ciclo/familia/grado) con su RD y resolución opcional a catálogo.

## Identificación de anexos

La función `detect_anexo_for_table` revisa:
- Presencia de “Ley Orgánica 1/1990” / “Ley Orgánica 2/2006”.
- Encabezados de familia (“Familia: …”).
- Contexto de página (cuando hay páginas mixtas con “ANEXO IV” y tablas LOE previas).

## Tipos de tabla y estrategia de parsing

### Anexo I (LOGSE)
Parser: `parse_anexo_I_table`
- Tipo A: 5 columnas (familia, formación aportada, grado, formación a convalidar, grado).
- Tipo B: 3 columnas (familia, aportada, convalidar).
- Tipo C: 2 columnas (aportada, convalidar) y bloques “Para todos…”.
- Herencia de celdas vacías (`rowspan`).
- `Ciclo completo.` implica convalidación global.
- Grados `GM/GS` se añaden como contexto.

### Anexo II (LOGSE ↔ LOE)
Parser: `parse_cycle_mapping_table`
- Filas con **pareja de ciclos** (título origen ↔ título destino) definen el contexto.
- Filas posteriores mapean **módulos** entre esos ciclos.
- `Ciclo completo.` → convalidación por ciclo completo.
- Códigos de módulo `####.` se normalizan (3→4 dígitos).

### Anexo III (LOE ↔ LOE)
Parser: `parse_cycle_mapping_table`
- Misma lógica que Anexo II.
- Incluye:
  - Tablas universales (FOL, EIE, Inglés, Segunda lengua).
  - “Para determinados ciclos formativos”.
- Extrae **familia profesional** desde paréntesis en el título del ciclo.

### Anexo IV (LOE, títulos posteriores a 2017)
Parser mixto:
- `parse_anexo_IV_cualquier` para la tabla “Cualquier ciclo formativo ↔ Cualquier ciclo formativo”.
- `parse_cycle_mapping_table` para el resto (incluye epígrafes a/b/c y tablas LOE).
- Si un módulo incluye “aplicable en cualquier ciclo”, se conserva como condición textual dentro de la celda.

## Ejecución

```bash
python -m convalidaciones.build_convalidaciones --reset
```

Parámetros opcionales:
- `--db` ruta a la BD.
- `--pdf` ruta al PDF.

