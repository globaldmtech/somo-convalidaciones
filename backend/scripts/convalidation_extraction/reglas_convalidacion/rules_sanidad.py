# rules_sanidad.py
# Reglas de convalidación para la familia: Sanidad

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO MEDIO
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. Emergencias Sanitarias (RD 1397/2007)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Electromecánica de Maquinaria (Transporte y Mantenimiento de Vehículos) — Ciclo completo
    # → 0052. Mantenimiento mecánico preventivo del vehículo
    {
        "familia_destino":       "Sanidad",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Emergencias Sanitarias",
        "codigo_destino":        "0052",
        "nombre_destino":        "Mantenimiento mecánico preventivo del vehículo",
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
        "source_page": 155,
    },

    # Origen: T. Electromecánica de Vehículos Automóviles (Transporte y Mantenimiento de Vehículos) — Ciclo completo
    # → 0052. Mantenimiento mecánico preventivo del vehículo
    {
        "familia_destino":       "Sanidad",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Emergencias Sanitarias",
        "codigo_destino":        "0052",
        "nombre_destino":        "Mantenimiento mecánico preventivo del vehículo",
        "origenes": [
            {
                "familia_origen":        "Transporte y mantenimiento de vehículos",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Electromecánica de Vehículos Automóviles",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 155,
    },

    # Origen: T. Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones (Marítimo Pesquera) — Ciclo completo
    # → 0052. Mantenimiento mecánico preventivo del vehículo
    {
        "familia_destino":       "Sanidad",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Emergencias Sanitarias",
        "codigo_destino":        "0052",
        "nombre_destino":        "Mantenimiento mecánico preventivo del vehículo",
        "origenes": [
            {
                "familia_origen":        "Marítimo pesquera",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 155,
    },

    # Origen: T. Mantenimiento de Material Rodante Ferroviario (Transporte y Mantenimiento de Vehículos) — Ciclo completo
    # → 0052. Mantenimiento mecánico preventivo del vehículo
    {
        "familia_destino":       "Sanidad",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Emergencias Sanitarias",
        "codigo_destino":        "0052",
        "nombre_destino":        "Mantenimiento mecánico preventivo del vehículo",
        "origenes": [
            {
                "familia_origen":        "Transporte y mantenimiento de vehículos",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Mantenimiento de Material Rodante Ferroviario",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 155,
    },

    # Origen: TS Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones (Marítimo Pesquera) — Ciclo completo
    # → 0052. Mantenimiento mecánico preventivo del vehículo
    {
        "familia_destino":       "Sanidad",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Emergencias Sanitarias",
        "codigo_destino":        "0052",
        "nombre_destino":        "Mantenimiento mecánico preventivo del vehículo",
        "origenes": [
            {
                "familia_origen":        "Marítimo pesquera",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 155,
    },

    # Origen: TS Automoción (Transporte y Mantenimiento de Vehículos) — Ciclo completo
    # → 0052. Mantenimiento mecánico preventivo del vehículo
    {
        "familia_destino":       "Sanidad",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Emergencias Sanitarias",
        "codigo_destino":        "0052",
        "nombre_destino":        "Mantenimiento mecánico preventivo del vehículo",
        "origenes": [
            {
                "familia_origen":        "Transporte y mantenimiento de vehículos",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Automoción",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 155,
    },

    # DESTINO: T. Farmacia y Parafarmacia (RD 1689/2007)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Emergencias Sanitarias — Ciclo completo
    # → 0020. Primeros auxilios
    {
        "familia_destino":       "Sanidad",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Farmacia y Parafarmacia",
        "codigo_destino":        "0020",
        "nombre_destino":        "Primeros auxilios",
        "origenes": [
            {
                "familia_origen":        "Sanidad",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Emergencias Sanitarias",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 155,
    },

    # Origen: TS Laboratorio de Análisis y de Control de Calidad (Química) — Ciclo completo
    # → 0103. Operaciones básicas de laboratorio
    {
        "familia_destino":       "Sanidad",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Farmacia y Parafarmacia",
        "codigo_destino":        "0103",
        "nombre_destino":        "Operaciones básicas de laboratorio",
        "origenes": [
            {
                "familia_origen":        "Química",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Laboratorio de Análisis y de Control de Calidad",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 155,
    },

]
