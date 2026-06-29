# rules_textil_confeccion_y_piel.py
# Reglas de convalidación para la familia: Textil, Confección y Piel

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO MEDIO
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. en Confección y Moda (RD 955/2008)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS en Marketing y Publicidad (Comercio y Marketing) — módulo específico
    # → 0271. Información y atención al cliente
    {
        "familia_destino": "Textil, confección y piel",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Confección y Moda",
        "codigo_destino":  "0271",
        "nombre_destino":  "Información y atención al cliente",
        "origenes": [
            {
                "familia_origen": "Comercio y marketing",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Marketing y Publicidad",
                "codigo_origen":  "1110",
                "nombre_origen":  "Atención al cliente, consumidor y usuario",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 157,
    },

    # Origen: T. en Mantenimiento de Material Rodante Ferroviario (Transporte y Mantenimiento de Vehículos) — Ciclo completo
    # → 0116. Principios de mantenimiento electromecánico
    {
        "familia_destino":       "Textil, confección y piel",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Confección y Moda",
        "codigo_destino":        "0116",
        "nombre_destino":        "Principios de mantenimiento electromecánico",
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
        "source_page": 157,
    },

    # DESTINO: T. en Calzado y Complementos de Moda (RD 257/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. en Mantenimiento de Material Rodante Ferroviario — Ciclo completo
    # → 0116. Principios de mantenimiento electromecánico
    {
        "familia_destino":       "Textil, confección y piel",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Calzado y Complementos de Moda",
        "codigo_destino":        "0116",
        "nombre_destino":        "Principios de mantenimiento electromecánico",
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
        "source_page": 157,
    },

    # DESTINO: T. en Fabricación y Ennoblecimiento de Productos Textiles (RD 1591/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. en Mantenimiento de Material Rodante Ferroviario — Ciclo completo
    # → 0116. Principios de mantenimiento electromecánico
    {
        "familia_destino":       "Textil, confección y piel",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Fabricación y Ennoblecimiento de Productos Textiles",
        "codigo_destino":        "0116",
        "nombre_destino":        "Principios de mantenimiento electromecánico",
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
        "source_page": 157,
    },

]
