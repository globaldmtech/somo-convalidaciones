"""
rules_agraria.py
================
Reglas de convalidación cuyo MÓDULO DESTINO pertenece a la familia "Agraria".

Fuente: Tabla de convalidaciones entre títulos regulados por la Ley Orgánica 2/2006.

NOTA sobre "Ciclo Completo":
  Cuando el origen es "Ciclo Completo" significa que el ciclo de origen al completo
  convalida el módulo destino. En esos casos codigo_origen y nombre_origen son None
  y el campo ciclo_completo_origen = True lo indica explícitamente.
  El generador actual los marcará como pendientes de revisión manual hasta que se
  implemente soporte específico para este tipo de regla.
"""

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO MEDIO
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. Jardinería y Floristería (RD 1129/2010)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Actividades Comerciales (Comercio y Marketing) — Ciclo Completo
    {
        "familia_destino":       "Agraria",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Jardinería y Floristería",
        "codigo_destino":        "0581",
        "nombre_destino":        "Técnicas de venta en jardinería y floristería",
        "origenes": [
            {
                "familia_origen":        "Comercio y marketing",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Actividades Comerciales",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,   # el ciclo completo convalida este módulo
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124841,
    },

    # Origen: T. Electromecánica de Maquinaria (Transporte y Mantenimiento de Vehículos) — Ciclo Completo
    {
        "familia_destino":       "Agraria",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Jardinería y Floristería",
        "codigo_destino":        "0407",
        "nombre_destino":        "Taller y equipos de tracción",
        "origenes": [
            {
                "familia_origen":        "Transporte y mantenimiento de vehículos",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Electromecánica de Maquinaria",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124841,
    },

    # DESTINO: T. Producción Agroecológica (RD 1633/2009)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Actividades Comerciales (Comercio y Marketing) — Ciclo Completo
    {
        "familia_destino":       "Agraria",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Producción Agroecológica",
        "codigo_destino":        "0413",
        "nombre_destino":        "Comercialización de productos agroecológicos",
        "origenes": [
            {
                "familia_origen":        "Comercio y marketing",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Actividades Comerciales",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124841,
    },

    # Origen: T. Electromecánica de Maquinaria (Transporte y Mantenimiento de Vehículos) — Ciclo Completo
    {
        "familia_destino":       "Agraria",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Producción Agroecológica",
        "codigo_destino":        "0407",
        "nombre_destino":        "Taller y equipos de tracción",
        "origenes": [
            {
                "familia_origen":        "Transporte y mantenimiento de vehículos",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Electromecánica de Maquinaria",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124842,
    },

    # ══════════════════════════════════════════════════════════════════
    # GRADO SUPERIOR
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: TS Gestión Forestal y del Medio Natural (RD 260/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Paisajismo y Medio Rural (Agraria) — módulo específico
    {
        "familia_destino": "Agraria",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Gestión Forestal y del Medio Natural",
        "codigo_destino":  "0811",
        "nombre_destino":  "Gestión y organización del vivero forestal",
        "origenes": [
            {
                "familia_origen": "Agraria",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Paisajismo y Medio Rural",
                "codigo_origen":  "0691",
                "nombre_origen":  "Gestión y organización del vivero",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124842,
    },

    # Origen: TS Educación y Control Ambiental (Seguridad y Medio Ambiente) — Ciclo Completo
    # → 0693. Topografía agraria
    {
        "familia_destino":       "Agraria",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Gestión Forestal y del Medio Natural",
        "codigo_destino":        "0693",
        "nombre_destino":        "Topografía agraria",
        "origenes": [
            {
                "familia_origen":        "Seguridad y medio ambiente",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Educación y Control Ambiental",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124842,
    },

    # Origen: TS Educación y Control Ambiental (Seguridad y Medio Ambiente) — Ciclo Completo
    # → 0815. Gestión de la conservación del medio natural
    {
        "familia_destino":       "Agraria",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Gestión Forestal y del Medio Natural",
        "codigo_destino":        "0815",
        "nombre_destino":        "Gestión de la conservación del medio natural",
        "origenes": [
            {
                "familia_origen":        "Seguridad y medio ambiente",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Educación y Control Ambiental",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124842,
    },

]
