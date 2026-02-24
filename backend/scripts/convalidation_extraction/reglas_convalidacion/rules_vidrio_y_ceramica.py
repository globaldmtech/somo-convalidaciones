# rules_vidrio_y_ceramica.py
# Reglas de convalidación para la familia: Vidrio y Cerámica

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # PÁGINA 124873
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. en Fabricación de Productos Cerámicos (RD 454/2010)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. en Mantenimiento de Material Rodante Ferroviario (Transporte y Mantenimiento de Vehículos) — Ciclo completo
    # → 0116. Principios de mantenimiento electromecánico
    {
        "familia_destino":       "Vidrio y cerámica",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Técnico en Fabricación de Productos Cerámicos",
        "codigo_destino":        "0116",
        "nombre_destino":        "Principios de mantenimiento electromecánico",
        "origenes": [
            {
                "familia_origen":        "Transporte y mantenimiento de vehículos",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Técnico en Mantenimiento de Material Rodante Ferroviario",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124873,
    },
]
