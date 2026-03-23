# Convalidation Extraction Scripts

Carpeta de herramientas para insertar **reglas de convalidación** en la base de datos SQLite del proyecto.

---

## Archivos

| Archivo | Descripción |
|---|---|
| `rules.py` | ✏️ **Aquí defines las reglas** en formato legible, sin usar IDs |
| `generate_convalidations.py` | ⚙️ Lee `rules.py`, resuelve los IDs y genera los INSERTs |
| `db_helper.py` | 🔍 Funciones auxiliares para buscar módulos/ciclos en la BD |

---

## Flujo de trabajo

### 1. Definir la regla en `rules.py`

Abre `rules.py` y añade un diccionario al array `CONVALIDACIONES`:

```python
{
    "ciclo_destino": "Administración y Finanzas",   # nombre parcial del ciclo destino
    "codigo_destino": "0655",                        # código oficial del módulo destino
    "origenes": [
        {
            "ciclo_origen": "Gestión de Ventas y Espacios Comerciales",
            "codigo_origen": "0626",                 # código oficial del módulo origen
        },
    ],
    "source_link": "https://www.boe.es/...",         # opcional
    "source_page": 5,                                # opcional
},
```

> Puedes usar `modulo_destino` / `modulo_origen` (nombre parcial) en lugar de `codigo_destino` / `codigo_origen`.

### 2. Verificar (dry-run)

```bash
python generate_convalidations.py --dry-run
```

Muestra qué IDs se resolverían y qué se insertaría, **sin escribir nada**.

### 3. Generar el SQL

```bash
python generate_convalidations.py --sql
```

Crea el fichero `../convalidaciones.sql` con los INSERTs generados.

### 4. Insertar directamente en la BD

```bash
python generate_convalidations.py --db
```

Aplica los INSERTs al fichero `db.sqlite` directamente.

### 5. SQL + BD a la vez

```bash
python generate_convalidations.py --sql --db
```
