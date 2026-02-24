# Scripts

Scripts disponibles:
- `init_db.py`: crear BD y aplicar esquema (`schema.sql`).
- `load_catalog.py`: cargar `GRADOS/FAMILIAS/CICLOS/MODULOS` desde JSON.
- `load_convalidaciones.py`: cargar reglas de convalidación desde JSON o desde una SQLite fuente con tablas `Convalidacion` + `Convalidacion_links`.
- `export_formularios.py`: listar formularios y guardarlos como JSON.

## Uso rapido

Inicializar la base:

```bash
python backend/scripts/init_db.py --db data/somo.db
```

Cargar catalogo FP:

```bash
python backend/scripts/load_catalog.py --db data/somo.db --json fp_grados.json --truncate
```

Cargar convalidaciones desde DB fuente existente:

```bash
python backend/scripts/load_convalidaciones.py --db data/somo.db --source-db grados-familias-ciclos-modulos.db --reset
```

Cargar convalidaciones desde JSON:

```bash
python backend/scripts/load_convalidaciones.py --db data/somo.db --json data/convalidaciones.json --reset
```

Listar formularios:

```bash
python backend/scripts/export_formularios.py --db data/somo.db --estado ENVIADO --limit 200 --offset 0 --out data/formularios_enviados.json
```
