# Pasos para scrapear desde cero

1) Abrir una terminal en `C:\Users\Admin\convalid_prueba`.

2) Verificar dependencias de Python (si faltan):

```powershell
python -m pip install requests beautifulsoup4
```

3) Ejecutar el scraper completo (genera JSON y llena la DB):

```powershell
python scrapers\build_fp_data.py --reset
```

4) (Opcional) Ejecutar un grado específico y generar su JSON:

```powershell
python scrapers\scrape_fp_basico.py
python scrapers\scrape_grado_medio.py
python scrapers\scrape_grado_superior.py
python scrapers\scrape_cursos_especializacion.py
```

5) Archivos generados:

- JSON unificado: `fp_grados.json` (si ejecutas el paso 3).
- JSONs individuales: `output\fp_grado_basico.json`, `output\fp_grado_medio.json`, `output\fp_grado_superior.json`, `output\fp_cursos_especializacion.json` (solo si ejecutas el paso 4).
- DB: `grados-familias-ciclos-modulos.db` (si ejecutas el paso 3).

6) Qué hace cada script:

- `scrapers\scrape_utils.py`: funciones comunes de scraping y parsing (descarga HTML, extracción de familias/ciclos/módulos, normalización de textos) y utilidades para escribir JSON. No crea DB ni inserta datos.
- `scrapers\scrape_fp_basico.py`: scrappea solo Grado Básico y genera su JSON individual. No crea DB ni tablas, no inserta en DB.
- `scrapers\scrape_grado_medio.py`: scrappea solo Grado Medio y genera su JSON individual. No crea DB ni tablas, no inserta en DB.
- `scrapers\scrape_grado_superior.py`: scrappea solo Grado Superior y genera su JSON individual. No crea DB ni tablas, no inserta en DB.
- `scrapers\scrape_cursos_especializacion.py`: scrappea solo Cursos de Especialización y genera su JSON individual. No crea DB ni tablas, no inserta en DB.
- `scrapers\build_fp_data.py`: scrappea todos los grados, crea/ajusta la DB (tablas y columnas si no existen), inserta los datos en la DB y genera el JSON unificado `fp_grados.json`.
