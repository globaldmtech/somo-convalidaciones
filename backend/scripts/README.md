# Scripts

Scripts disponibles:
- `init_db.py`: crear BD y aplicar esquema (`schema.sql`).
- `load_catalog.py`: cargar `GRADOS/FAMILIAS/CICLOS/MODULOS` desde JSON.
- `load_convalidaciones.py`: cargar reglas de convalidación desde JSON o desde una SQLite fuente con tablas `Convalidacion` + `Convalidacion_links`.
- `export_formularios.py`: exportar formularios a JSON (uno o varios) con sus subentidades.

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

Exportar un formulario por id:

```bash
python backend/scripts/export_formularios.py --db data/somo.db --formulario-id 1 --out data/formulario_1.json
```

Exportar lote de formularios:

```bash
python backend/scripts/export_formularios.py --db data/somo.db --estado ENVIADO --limit 200 --offset 0 --out data/formularios_enviados.json
```
