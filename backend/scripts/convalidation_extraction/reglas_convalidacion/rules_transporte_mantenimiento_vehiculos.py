# rules_transporte_mantenimiento_vehiculos.py
# Reglas de convalidación para la familia: Transporte y Mantenimiento de Vehículos

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # PÁGINA 124870
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. en Carrocería (RD 176/2008)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. en Redes y Estaciones de Tratamientos de Aguas (Energía y Agua) — módulo específico
    # → 0260. Mecanizado básico
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Carrocería",
        "codigo_destino":  "0260",
        "nombre_destino":  "Mecanizado básico",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Técnico en Redes y Estaciones de Tratamientos de Aguas",
                "codigo_origen":  "1562",
                "nombre_origen":  "Técnicas de mecanizado y unión",
            },
        ],
        "source_link": None,
        "source_page": 124870,
    },

    # Origen: TS en Gestión del Agua (Energía y Agua) — módulo específico
    # → 0260. Mecanizado básico
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Carrocería",
        "codigo_destino":  "0260",
        "nombre_destino":  "Mecanizado básico",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Técnico Superior en Gestión del Agua",
                "codigo_origen":  "1580",
                "nombre_origen":  "Técnicas de montaje en instalaciones de agua",
            },
        ],
        "source_link": None,
        "source_page": 124870,
    },

    # Origen: T. en Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones (Marítimo Pesquera) — módulo específico
    # → 0260. Mecanizado básico
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Carrocería",
        "codigo_destino":  "0260",
        "nombre_destino":  "Mecanizado básico",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Técnico en Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones",
                "codigo_origen":  "1173",
                "nombre_origen":  "Procedimientos de mecanizado y soldadura en buques y embarcaciones",
            },
        ],
        "source_link": None,
        "source_page": 124870,
    },

    # DESTINO: T. en Conducción de Vehículos de Transporte por Carretera (RD 555/2012)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. en Electromecánica de Maquinaria — Ciclo completo
    # → 1210. Mantenimiento básico de vehículos
    {
        "familia_destino":       "Transporte y mantenimiento de vehículos",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Técnico en Conducción de Vehículos de Transporte por Carretera",
        "codigo_destino":        "1210",
        "nombre_destino":        "Mantenimiento básico de vehículos",
        "origenes": [
            {
                "familia_origen":        "Transporte y mantenimiento de vehículos",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Técnico en Electromecánica de Maquinaria",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124870,
    },

    # Origen: T. en Electromecánica de Vehículos Automóviles — Ciclo completo
    # → 1210. Mantenimiento básico de vehículos
    {
        "familia_destino":       "Transporte y mantenimiento de vehículos",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Técnico en Conducción de Vehículos de Transporte por Carretera",
        "codigo_destino":        "1210",
        "nombre_destino":        "Mantenimiento básico de vehículos",
        "origenes": [
            {
                "familia_origen":        "Transporte y mantenimiento de vehículos",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Técnico en Electromecánica de Vehículos Automóviles",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124870,
    },

    # ══════════════════════════════════════════════════════════════════
    # PÁGINA 124871
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. en Conducción de Vehículos de Transporte por Carretera (RD 555/2012)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. en Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones (Marítimo Pesquera) — Ciclo completo
    # → 1210. Mantenimiento básico de vehículos
    {
        "familia_destino":       "Transporte y mantenimiento de vehículos",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Técnico en Conducción de Vehículos de Transporte por Carretera",
        "codigo_destino":        "1210",
        "nombre_destino":        "Mantenimiento básico de vehículos",
        "origenes": [
            {
                "familia_origen":        "Marítimo pesquera",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Técnico en Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124871,
    },

    # Origen: T. en Mantenimiento de Material Rodante Ferroviario — Ciclo completo
    # → 1210. Mantenimiento básico de vehículos
    {
        "familia_destino":       "Transporte y mantenimiento de vehículos",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Técnico en Conducción de Vehículos de Transporte por Carretera",
        "codigo_destino":        "1210",
        "nombre_destino":        "Mantenimiento básico de vehículos",
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
        "source_page": 124871,
    },

    # Origen: TS en Automoción — Ciclo completo
    # → 1210. Mantenimiento básico de vehículos
    {
        "familia_destino":       "Transporte y mantenimiento de vehículos",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Técnico en Conducción de Vehículos de Transporte por Carretera",
        "codigo_destino":        "1210",
        "nombre_destino":        "Mantenimiento básico de vehículos",
        "origenes": [
            {
                "familia_origen":        "Transporte y mantenimiento de vehículos",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Técnico Superior en Automoción",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124871,
    },

    # Origen: TS en Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones (Marítimo Pesquera) — Ciclo completo
    # → 1210. Mantenimiento básico de vehículos
    {
        "familia_destino":       "Transporte y mantenimiento de vehículos",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Técnico en Conducción de Vehículos de Transporte por Carretera",
        "codigo_destino":        "1210",
        "nombre_destino":        "Mantenimiento básico de vehículos",
        "origenes": [
            {
                "familia_origen":        "Marítimo pesquera",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Técnico Superior en Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124871,
    },

    # DESTINO: T. en Electromecánica de Maquinaria (RD 255/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. en Electromecánica de Vehículos Automóviles — módulo específico
    # → 0742 Sistemas auxiliares del motor Diésel
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Electromecánica de Maquinaria",
        "codigo_destino":  "0742",
        "nombre_destino":  "Sistemas auxiliares del motor Diésel",
        "origenes": [
            {
                "familia_origen": "Transporte y mantenimiento de vehículos",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Técnico en Electromecánica de Vehículos Automóviles",
                "codigo_origen":  "0453",
                "nombre_origen":  "Sistemas auxiliares del motor",
            },
        ],
        "source_link": None,
        "source_page": 124871,
    },

    # Origen: T. en Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones (Marítimo Pesquera) — módulo específico
    # → 0260. Mecanizado básico
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Electromecánica de Maquinaria",
        "codigo_destino":  "0260",
        "nombre_destino":  "Mecanizado básico",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Técnico en Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones",
                "codigo_origen":  "1173",
                "nombre_origen":  "Procedimientos de mecanizado y soldadura en buques y embarcaciones",
            },
        ],
        "source_link": None,
        "source_page": 124871,
    },

    # Origen: T. en Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones (Marítimo Pesquera) — módulo específico
    # → 0452. Motores
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Electromecánica de Maquinaria",
        "codigo_destino":  "0452",
        "nombre_destino":  "Motores",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Técnico en Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones",
                "codigo_origen":  "1172",
                "nombre_origen":  "Mantenimiento de la planta propulsora y maquinaria auxiliar",
            },
        ],
        "source_link": None,
        "source_page": 124871,
    },

    # Origen: T. en Redes y Estaciones de Tratamiento de Aguas (Energía y Agua) — módulo específico
    # → 0260. Mecanizado básico
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Electromecánica de Maquinaria",
        "codigo_destino":  "0260",
        "nombre_destino":  "Mecanizado básico",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Técnico en Redes y Estaciones de Tratamientos de Aguas",
                "codigo_origen":  "1562",
                "nombre_origen":  "Técnicas de mecanizado y unión",
            },
        ],
        "source_link": None,
        "source_page": 124871,
    },

    # Origen: TS en Gestión del Agua (Energía y Agua) — módulo específico
    # → 0260. Mecanizado básico
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Electromecánica de Maquinaria",
        "codigo_destino":  "0260",
        "nombre_destino":  "Mecanizado básico",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Técnico Superior en Gestión del Agua",
                "codigo_origen":  "1580",
                "nombre_origen":  "Técnicas de montaje en instalaciones de agua",
            },
        ],
        "source_link": None,
        "source_page": 124871,
    },

    # Origen: TS en Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones (Marítimo Pesquera) — módulo específico
    # → 0452. Motores
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Electromecánica de Maquinaria",
        "codigo_destino":  "0452",
        "nombre_destino":  "Motores",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Técnico Superior en Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones",
                "codigo_origen":  "1308",
                "nombre_origen":  "Organización del mantenimiento de planta propulsora y maquinaria auxiliar de buques",
            },
        ],
        "source_link": None,
        "source_page": 124871,
    },

    # ══════════════════════════════════════════════════════════════════
    # PÁGINA 124872
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. en Electromecánica de Vehículos Automóviles (RD 453/2010)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. en Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones (Marítimo Pesquera) — módulo específico
    # → 0260. Mecanizado básico
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Electromecánica de Vehículos Automóviles",
        "codigo_destino":  "0260",
        "nombre_destino":  "Mecanizado básico",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Técnico en Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones",
                "codigo_origen":  "1173",
                "nombre_origen":  "Procedimientos de mecanizado y soldadura en buques y embarcaciones",
            },
        ],
        "source_link": None,
        "source_page": 124872,
    },

    # Origen: T. en Mantenimiento de Material Rodante Ferroviario — módulo específico
    # → 0457. Circuitos eléctricos auxiliares del vehículo
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Electromecánica de Vehículos Automóviles",
        "codigo_destino":  "0457",
        "nombre_destino":  "Circuitos eléctricos auxiliares del vehículo",
        "origenes": [
            {
                "familia_origen": "Transporte y mantenimiento de vehículos",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Técnico en Mantenimiento de Material Rodante Ferroviario",
                "codigo_origen":  "0975",
                "nombre_origen":  "Circuitos auxiliares",
            },
        ],
        "source_link": None,
        "source_page": 124872,
    },

    # Origen: T. en Redes y Estaciones de Tratamiento de Aguas (Energía y Agua) — módulo específico
    # → 0260. Mecanizado básico
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Electromecánica de Vehículos Automóviles",
        "codigo_destino":  "0260",
        "nombre_destino":  "Mecanizado básico",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Técnico en Redes y Estaciones de Tratamientos de Aguas",
                "codigo_origen":  "1562",
                "nombre_origen":  "Técnicas de mecanizado y unión",
            },
        ],
        "source_link": None,
        "source_page": 124872,
    },

    # Origen: TS en Gestión del Agua (Energía y Agua) — módulo específico
    # → 0260. Mecanizado básico
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Electromecánica de Vehículos Automóviles",
        "codigo_destino":  "0260",
        "nombre_destino":  "Mecanizado básico",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Técnico Superior en Gestión del Agua",
                "codigo_origen":  "1580",
                "nombre_origen":  "Técnicas de montaje en instalaciones de agua",
            },
        ],
        "source_link": None,
        "source_page": 124872,
    },

    # Origen: T. en Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones (Marítimo Pesquera) — módulo específico
    # → 0452. Motores
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Electromecánica de Vehículos Automóviles",
        "codigo_destino":  "0452",
        "nombre_destino":  "Motores",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Técnico en Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones",
                "codigo_origen":  "1172",
                "nombre_origen":  "Mantenimiento de la planta propulsora y maquinaria auxiliar",
            },
        ],
        "source_link": None,
        "source_page": 124872,
    },

    # Origen: TS en Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones (Marítimo Pesquera) — módulo específico
    # → 0452. Motores
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Electromecánica de Vehículos Automóviles",
        "codigo_destino":  "0452",
        "nombre_destino":  "Motores",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Técnico Superior en Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones",
                "codigo_origen":  "1308",
                "nombre_origen":  "Organización del mantenimiento de planta propulsora y maquinaria auxiliar de buques",
            },
        ],
        "source_link": None,
        "source_page": 124872,
    },

    # DESTINO: T. en Mantenimiento de Material Rodante Ferroviario (RD 1145/2012)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. en Electromecánica de Vehículos Automóviles — módulo específico
    # → 0742 Sistemas auxiliares del motor Diésel
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Mantenimiento de Material Rodante Ferroviario",
        "codigo_destino":  "0742",
        "nombre_destino":  "Sistemas auxiliares del motor Diésel",
        "origenes": [
            {
                "familia_origen": "Transporte y mantenimiento de vehículos",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Técnico en Electromecánica de Vehículos Automóviles",
                "codigo_origen":  "0453",
                "nombre_origen":  "Sistemas auxiliares del motor",
            },
        ],
        "source_link": None,
        "source_page": 124872,
    },

    # Origen: T. en Electromecánica de Vehículos Automóviles — módulo específico
    # → 0975. Circuitos auxiliares
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Mantenimiento de Material Rodante Ferroviario",
        "codigo_destino":  "0975",
        "nombre_destino":  "Circuitos auxiliares",
        "origenes": [
            {
                "familia_origen": "Transporte y mantenimiento de vehículos",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Técnico en Electromecánica de Vehículos Automóviles",
                "codigo_origen":  "0457",
                "nombre_origen":  "Circuitos eléctricos auxiliares del vehículo",
            },
        ],
        "source_link": None,
        "source_page": 124872,
    },

    # Origen: T. en Redes y Estaciones de Tratamiento de Aguas (Energía y Agua) — módulo específico
    # → 0260. Mecanizado básico
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Mantenimiento de Material Rodante Ferroviario",
        "codigo_destino":  "0260",
        "nombre_destino":  "Mecanizado básico",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Técnico en Redes y Estaciones de Tratamientos de Aguas",
                "codigo_origen":  "1562",
                "nombre_origen":  "Técnicas de mecanizado y unión",
            },
        ],
        "source_link": None,
        "source_page": 124872,
    },

    # Origen: TS en Gestión del Agua (Energía y Agua) — módulo específico
    # → 0260. Mecanizado básico
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Mantenimiento de Material Rodante Ferroviario",
        "codigo_destino":  "0260",
        "nombre_destino":  "Mecanizado básico",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Técnico Superior en Gestión del Agua",
                "codigo_origen":  "1580",
                "nombre_origen":  "Técnicas de montaje en instalaciones de agua",
            },
        ],
        "source_link": None,
        "source_page": 124872,
    },

    # ══════════════════════════════════════════════════════════════════
    # PÁGINA 124873
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. en Mantenimiento de Material Rodante Ferroviario (RD 1145/2012)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS en Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones (Marítimo Pesquera) — módulo específico
    # → 0452. Motores
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Mantenimiento de Material Rodante Ferroviario",
        "codigo_destino":  "0452",
        "nombre_destino":  "Motores",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Técnico Superior en Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones",
                "codigo_origen":  "1308",
                "nombre_origen":  "Organización del mantenimiento de planta propulsora y maquinaria auxiliar de buques",
            },
        ],
        "source_link": None,
        "source_page": 124873,
    },

    # Origen: T. en Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones (Marítimo Pesquera) — módulo específico
    # → 0260. Mecanizado básico
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Mantenimiento de Material Rodante Ferroviario",
        "codigo_destino":  "0260",
        "nombre_destino":  "Mecanizado básico",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Técnico en Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones",
                "codigo_origen":  "1173",
                "nombre_origen":  "Procedimientos de mecanizado y soldadura en buques y embarcaciones",
            },
        ],
        "source_link": None,
        "source_page": 124873,
    },

    # Origen: T. en Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones (Marítimo Pesquera) — módulo específico
    # → 0452. Motores
    {
        "familia_destino": "Transporte y mantenimiento de vehículos",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico en Mantenimiento de Material Rodante Ferroviario",
        "codigo_destino":  "0452",
        "nombre_destino":  "Motores",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Técnico en Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones",
                "codigo_origen":  "1172",
                "nombre_origen":  "Mantenimiento de la planta propulsora y maquinaria auxiliar",
            },
        ],
        "source_link": None,
        "source_page": 124873,
    },

    # ══════════════════════════════════════════════════════════════════
    # GRADO SUPERIOR
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: Técnico Superior en Automoción (RD 1796/2008)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS en Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones (Marítimo Pesquera) — Ciclo completo
    # → 0293. Motores térmicos y sus sistemas auxiliares
    {
        "familia_destino":       "Transporte y mantenimiento de vehículos",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Técnico Superior en Automoción",
        "codigo_destino":        "0293",
        "nombre_destino":        "Motores térmicos y sus sistemas auxiliares",
        "origenes": [
            {
                "familia_origen":        "Marítimo pesquera",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Técnico Superior en Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124873,
    },

]
