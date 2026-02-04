# Estructura de la base de datos

## FP

Jerarquía: `Grados` → `Familias` → `Ciclos` → `Modulos`

## Tablas
- `Grados` (`id`, `nombre`)
- `Familias` (`id`, `nombre`, `id_grado`)
- `Ciclos` (`id`, `nombre`, `id_familia`, `titulo`)
- `Modulos` (`id`, `nombre`, `id_ciclo`)

## Relaciones
- `Familias.id_grado` → `Grados.id`
- `Ciclos.id_familia` → `Familias.id`
- `Modulos.id_ciclo` → `Ciclos.id`

## CONVALIDACIONES BOE

Jerarquía: `Convalidacion` → `Convalidacion_links`

## Tablas
- `Convalidacion` (`id`, `source_doc`, `source_anexo`, `source_page`)
- `Convalidacion_links` (`id`, `convalidacion_id`, `rd`, `link_id`, `link_item`, `origen_destino`)

## Relaciones
- `Convalidacion_links.convalidacion_id` → `Convalidacion.id`
- `Convalidacion_links.link_id` → `Modulos.id` (si `link_item = modulo`)
- `Convalidacion_links.link_id` → `Ciclos.id` (si `link_item = ciclo`)
- `Convalidacion_links.link_id` → `Familias.id` (si `link_item = familia`)
- `Convalidacion_links.link_id` → `Grados.id` (si `link_item = grado`)

---

# Documentación de la base de datos de ciclos y módulos (FP)

## Propósito
Esta base de datos consolida la estructura oficial de FP en España a partir de **todofp.es**, organizada por:
`Grado` → `Familia profesional` → `Ciclo` → `Módulo`.

El objetivo es disponer de un inventario consistente para análisis interno y para apoyar procesos de convalidación.

## Origen y composición de datos
La base de datos se genera con el scraper local:
- `scrapers/build_fp_data.py`

Fuentes consultadas (listas por grado):
- Grado Básico
- Grado Medio
- Grado Superior
- Curso de Especialización

El scraper:
1. Descarga los listados de ciclos por grado.
2. Extrae la familia profesional asociada a cada ciclo.
3. Entra al detalle de cada ciclo y extrae el **Plan de formación** para listar módulos.
4. Escribe los resultados en JSON y en SQLite.

Salida por defecto:
- `fp_grados.json`
- `grados-familias-ciclos-modulos.db`

## Esquema lógico (jerarquía)
Relación 1–N en todos los niveles:
- **Grados** (1) → **Familias** (N)
- **Familias** (1) → **Ciclos** (N)
- **Ciclos** (1) → **Modulos** (N)

Esto permite navegar desde el nivel macro (grado) al micro (módulo) sin duplicidades.

## Tablas y campos

### `Grados`
- `id` (INTEGER, PK)
- `nombre` (TEXT, UNIQUE, NOT NULL)

Representa el nivel educativo: Básico, Medio, Superior, Curso de Especialización.

### `Familias`
- `id` (INTEGER, PK)
- `nombre` (TEXT, NOT NULL)
- `id_grado` (INTEGER, FK → `Grados.id`, NOT NULL)
- UNIQUE (`nombre`, `id_grado`)

La familia profesional puede repetirse entre grados, por eso la unicidad es por grado.

### `Ciclos`
- `id` (INTEGER, PK)
- `nombre` (TEXT, NOT NULL)
- `titulo` (TEXT, nullable)
- `id_familia` (INTEGER, FK → `Familias.id`, NOT NULL)
- UNIQUE (`nombre`, `id_familia`)

`nombre` es un nombre **normalizado** del ciclo (sin prefijos formales).
`titulo` conserva el título oficial completo.

### `Modulos`
- `id` (INTEGER, PK)
- `nombre` (TEXT, NOT NULL)
- `id_ciclo` (INTEGER, FK → `Ciclos.id`, NOT NULL)
- UNIQUE (`nombre`, `id_ciclo`)

Listado de módulos del Plan de formación de cada ciclo.

## Integridad y reglas
Todas las relaciones usan **FK con `ON DELETE CASCADE`**, lo que garantiza que al borrar un grado o familia, se eliminan sus ciclos y módulos asociados.

Se activan claves foráneas con `PRAGMA foreign_keys = ON` en el proceso de carga.

## Decisiones de normalización y limpieza
Estas decisiones están codificadas en `scrapers/scrape_utils.py`:

- **Normalización de familia**: si el nombre viene de un `alt` tipo “Logotipo de …”, se elimina ese prefijo.
- **Derivación de `nombre` de ciclo**: se eliminan prefijos formales como:
  - “Técnico en …”
  - “Técnico Superior en …”
  - “Título Profesional Básico …”
  - “Curso de especialización en …”
- **Ciclos sin familia**: si no se detecta familia, se agrupan bajo `Sin familia`.
- **Módulos**: se extraen del bloque de “Plan de formación” en la ficha del ciclo.

Estas decisiones evitan duplicidades, mejoran la búsqueda y mantienen el título oficial intacto.

## Volumen actual de datos
Conteos en la base de datos:
- Grados: 4
- Familias: 81
- Ciclos: 218
- Modulos: 3272

## Cómo regenerar la base de datos
Ejemplo de uso:
```bash
python scrapers/build_fp_data.py --db grados-familias-ciclos-modulos.db --json fp_grados.json --sleep 0.2 --reset
```

Parámetros relevantes:
- `--db`: ruta del SQLite
- `--json`: ruta del JSON
- `--sleep`: pausa entre peticiones (evita bloqueo)
- `--reset`: limpia tablas antes de insertar

## Consideraciones y límites
- La DB no almacena orden de módulos ni metadatos de duración/curso.
- La estructura depende de los HTML de todofp.es; cambios en la web pueden requerir ajustes en el scraper.
- No se almacenan códigos oficiales de módulos ni ciclos, solo nombres y títulos.

---

# Convalidaciones BOE

## Propósito
Representar cada caso de convalidación (trazabilidad BOE) y sus enlaces a módulos/ciclos/familias/grados, con el RD asociado a cada enlace.

## Origen y composición de datos
Fuente principal: `docs/BOE-A-2020-17274.pdf` (anexos I–IV). La extracción recorre tablas del BOE y convierte cada fila en un caso de convalidación y sus enlaces.

## Esquema lógico
Relación 1–N: `Convalidacion` (1) → `Convalidacion_links` (N)

## Tablas y campos

### `Convalidacion`
- `id` (TEXT, PK)
- `source_doc` (TEXT, NOT NULL)
- `source_anexo` (INTEGER)
- `source_page` (INTEGER)

Representa el caso de convalidación y su trazabilidad en el BOE.

### `Convalidacion_links`
- `id` (INTEGER, PK autoincremental)
- `convalidacion_id` (TEXT, FK → `Convalidacion.id`)
- `rd` (TEXT)
- `link_id` (INTEGER, NULLABLE)
- `link_item` (TEXT)
- `origen_destino` (TEXT)

Guarda cada enlace del caso a un elemento del catálogo, indicando el RD y si es origen o destino.

## Relaciones
- `Convalidacion_links.convalidacion_id` → `Convalidacion.id`
- `Convalidacion_links.link_id` → `Modulos.id` (si `link_item = modulo`)
- `Convalidacion_links.link_id` → `Ciclos.id` (si `link_item = ciclo`)
- `Convalidacion_links.link_id` → `Familias.id` (si `link_item = familia`)
- `Convalidacion_links.link_id` → `Grados.id` (si `link_item = grado`)

## Integridad y reglas
- PK en `Convalidacion.id`.
- FK en `Convalidacion_links.convalidacion_id` con `ON DELETE CASCADE`.
- `link_item` restringido a `modulo|ciclo|familia|grado`.
- `origen_destino` restringido a `origen|destino`.
- `link_id` puede ser `NULL` si no hay match con la DB base.

## Decisiones de normalización y limpieza
- Normalización de texto para matching: eliminación de tildes, paréntesis y RD, y colapsado de espacios.
- Extracción de RD con patrón `RD nnnn/aaaa`.
- Resolución de `link_id` por prioridad: módulo → ciclo → familia → grado.

## Volumen actual de datos
- `Convalidacion`: 2546 filas
- `Convalidacion_links`: 5274 filas
- `Convalidacion_links` con `link_id` no nulo: 1147 filas
- Distribución por `link_item`: `modulo` 4096, `ciclo` 1176, `grado` 2

## Cómo regenerar las tablas en base de datos
```bash
python build_convalidacion_table.py --reset
```
Este comando elimina y recrea `Convalidacion` y `Convalidacion_links`, y vuelve a cargar los datos del BOE.

## Consideraciones y límites
- `link_id` puede ser `NULL` cuando el título/módulo LOGSE no existe en la DB base.
- La DB actual no carga contenido de `CONVALIDACIONES-25-26.pdf`. Si se requiere, habría que añadir `Regla_Convalidacion`, `Unidad_Competencia` y `UC_Modulo`.

## Consulta (flujo mínimo)
1. Buscar en `Convalidacion_links` los destinos (`origen_destino = destino`) por `link_id`.
2. Recuperar el `convalidacion_id` y los enlaces `origen` asociados.
3. Validar con reglas externas (RD 1085/2020 y, si se implementan, `CONVALIDACIONES-25-26.pdf`).

## Ejemplo conceptual
1. Una convalidación con un ciclo de origen y varios módulos destino genera 1 fila en `Convalidacion` y N+1 filas en `Convalidacion_links` (1 enlace `origen` y N enlaces `destino`).

---
