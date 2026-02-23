# rules_quimica.py
# Reglas de convalidación para la familia: Química

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO MEDIO
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. Planta Química (RD 178/2008)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Operaciones de Laboratorio — módulo específico
    # → 0109. Parámetros químicos
    {
        "familia_destino": "Química",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Planta Química",
        "codigo_destino":  "0109",
        "nombre_destino":  "Parámetros químicos",
        "origenes": [
            {
                "familia_origen": "Química",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Operaciones de Laboratorio",
                "codigo_origen":  "1249",
                "nombre_origen":  "Química Aplicada",
            },
            {
                "familia_origen": "Química",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Operaciones de Laboratorio",
                "codigo_origen":  "1250",
                "nombre_origen":  "Muestreo y operaciones unitarias de Laboratorio",
            },
        ],
        "source_link": None,
        "source_page": 124867,
    },

    # Origen: T. Mantenimiento de Material Rodante Ferroviario — Ciclo Completo
    # → 0116. Principios de mantenimiento electromecánico
    {
        "familia_destino":       "Química",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Planta Química",
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
        "source_link": None,
        "source_page": 124867,
    },

    # Origen: T. Redes y Estaciones de Tratamientos de Aguas — módulo específico
    # → 0115. Tratamientos de aguas
    {
        "familia_destino": "Química",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Planta Química",
        "codigo_destino":  "0115",
        "nombre_destino":  "Tratamientos de aguas",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Redes y Estaciones de Tratamientos de Aguas",
                "codigo_origen":  "1564",
                "nombre_origen":  "Calidad del agua",
            },
        ],
        "source_link": None,
        "source_page": 124867,
    },

    # Origen: TS Gestión del Agua — módulo específico
    # → 0115. Tratamientos de aguas
    {
        "familia_destino": "Química",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Planta Química",
        "codigo_destino":  "0115",
        "nombre_destino":  "Tratamientos de aguas",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Gestión del Agua",
                "codigo_origen":  "1573",
                "nombre_origen":  "Calidad y tratamiento de aguas",
            },
        ],
        "source_link": None,
        "source_page": 124867,
    },

    # DESTINO: T. Operaciones de Laboratorio (RD 554/2012)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Planta Química — módulo específico
    # → 1249. Química Aplicada
    # → 1250. Muestreo y operaciones unitarias de Laboratorio
    {
        "familia_destino": "Química",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Operaciones de Laboratorio",
        "codigo_destino":  "1249",
        "nombre_destino":  "Química Aplicada",
        "origenes": [
            {
                "familia_origen": "Química",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Planta Química",
                "codigo_origen":  "0109",
                "nombre_origen":  "Parámetros químicos",
            },
        ],
        "source_link": None,
        "source_page": 124867,
    },
    {
        "familia_destino": "Química",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Operaciones de Laboratorio",
        "codigo_destino":  "1250",
        "nombre_destino":  "Muestreo y operaciones unitarias de Laboratorio",
        "origenes": [
            {
                "familia_origen": "Química",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Planta Química",
                "codigo_origen":  "0109",
                "nombre_origen":  "Parámetros químicos",
            },
        ],
        "source_link": None,
        "source_page": 124867,
    },

    # Origen: T. Mantenimiento de Material Rodante Ferroviario — Ciclo Completo
    # → 0116. Principios de mantenimiento electromecánico
    {
        "familia_destino":       "Química",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Operaciones de Laboratorio",
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
        "source_link": None,
        "source_page": 124867,
    },

    # Origen: TS Laboratorio de Análisis y de Control de Calidad — módulo específico
    # → 1250. Muestreo y operaciones unitarias de Laboratorio
    {
        "familia_destino": "Química",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Operaciones de Laboratorio",
        "codigo_destino":  "1250",
        "nombre_destino":  "Muestreo y operaciones unitarias de Laboratorio",
        "origenes": [
            {
                "familia_origen": "Química",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Laboratorio de Análisis y de Control de Calidad",
                "codigo_origen":  "0065",
                "nombre_origen":  "Muestreo y preparación de la muestra",
            },
        ],
        "source_link": None,
        "source_page": 124867,
    },

    # ══════════════════════════════════════════════════════════════════
    # GRADO SUPERIOR
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: TS Química Industrial (RD 175/2008)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones — Ciclo Completo
    # → 0191. Mantenimiento electromecánico en industrias de proceso
    {
        "familia_destino":       "Química",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Química Industrial",
        "codigo_destino":        "0191",
        "nombre_destino":        "Mantenimiento electromecánico en industrias de proceso",
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
        "source_link": None,
        "source_page": 124867,
    },

]
