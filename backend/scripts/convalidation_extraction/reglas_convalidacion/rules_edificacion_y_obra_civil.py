"""
rules_edificacion_y_obra_civil.py
===================================
Reglas de convalidación cuyo MÓDULO DESTINO pertenece a la familia
"Edificación y Obra Civil".

Fuente: Tabla de convalidaciones entre títulos regulados por la Ley Orgánica 2/2006.
"""

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO MEDIO
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. Construcción (RD 1575/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Proyectos de Edificación (RD 690/2010) — Ciclo Completo
    # → 0996. Interpretación de planos de construcción
    {
        "familia_destino":       "Edificación y obra civil",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Construcción",
        "codigo_destino":        "0996",
        "nombre_destino":        "Interpretación de planos de construcción",
        "origenes": [
            {
                "familia_origen":        "Edificación y obra civil",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Proyectos de Edificación",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 131,
    },

    # Origen: TS Proyectos de Obra Civil (RD 386/2011) — Ciclo Completo
    # → 0996. Interpretación de planos de construcción
    {
        "familia_destino":       "Edificación y obra civil",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Construcción",
        "codigo_destino":        "0996",
        "nombre_destino":        "Interpretación de planos de construcción",
        "origenes": [
            {
                "familia_origen":        "Edificación y obra civil",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Proyectos de Obra Civil",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 131,
    },

    # DESTINO: T. Obras de Interior, Decoración y Rehabilitación (RD 1689/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Proyectos de Edificación (RD 690/2010) — Ciclo Completo
    # → 0996. Interpretación de planos de construcción
    {
        "familia_destino":       "Edificación y obra civil",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Obras de Interior, Decoración y Rehabilitación",
        "codigo_destino":        "0996",
        "nombre_destino":        "Interpretación de planos de construcción",
        "origenes": [
            {
                "familia_origen":        "Edificación y obra civil",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Proyectos de Edificación",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 131,
    },

    # Origen: TS Proyectos de Obra Civil (RD 386/2011) — Ciclo Completo
    # → 0996. Interpretación de planos de construcción
    {
        "familia_destino":       "Edificación y obra civil",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Obras de Interior, Decoración y Rehabilitación",
        "codigo_destino":        "0996",
        "nombre_destino":        "Interpretación de planos de construcción",
        "origenes": [
            {
                "familia_origen":        "Edificación y obra civil",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Proyectos de Obra Civil",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 131,
    },

    # ══════════════════════════════════════════════════════════════════
    # GRADO SUPERIOR
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: TS Organización y Control de Obras de Construcción (RD 636/2015)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Proyectos de Edificación — módulo específico
    # → 1287. Documentación de proyectos y obras de construcción
    {
        "familia_destino": "Edificación y obra civil",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Organización y Control de Obras de Construcción",
        "codigo_destino":  "1287",
        "nombre_destino":  "Documentación de proyectos y obras de construcción",
        "origenes": [
            {
                "familia_origen": "Edificación y obra civil",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Proyectos de Edificación",
                "codigo_origen":  "0563",
                "nombre_origen":  "Representación de construcción",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 132,
    },

    # Origen: TS Proyectos de Obra Civil — módulo específico
    # → 1287. Documentación de proyectos y obras de construcción
    {
        "familia_destino": "Edificación y obra civil",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Organización y Control de Obras de Construcción",
        "codigo_destino":  "1287",
        "nombre_destino":  "Documentación de proyectos y obras de construcción",
        "origenes": [
            {
                "familia_origen": "Edificación y obra civil",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Proyectos de Obra Civil",
                "codigo_origen":  "0563",
                "nombre_origen":  "Representación de construcción",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 132,
    },

    # DESTINO: TS Proyectos de Edificación (RD 690/2010)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Eficiencia Energética y Energía Solar Térmica (Energía y Agua) — módulo específico
    # → 0569. Eficiencia energética en edificación
    {
        "familia_destino": "Edificación y obra civil",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Proyectos de Edificación",
        "codigo_destino":  "0569",
        "nombre_destino":  "Eficiencia energética en edificación",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Eficiencia Energética y Energía Solar Térmica",
                "codigo_origen":  "0350",
                "nombre_origen":  "Certificación energética de edificios",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 132,
    },

]
