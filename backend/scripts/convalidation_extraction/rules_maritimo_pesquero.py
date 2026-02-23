# rules_maritimo_pesquero.py
# Reglas de convalidación para la familia: Marítimo Pesquera

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO MEDIO
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. Cultivos Acuícolas (RD 254/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones — Ciclo Completo
    # → 0706. Instalaciones y equipos de cultivo
    {
        "familia_destino":       "Marítimo pesquera",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Cultivos Acuícolas",
        "codigo_destino":        "0706",
        "nombre_destino":        "Instalaciones y equipos de cultivo",
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
        "source_link": None,
        "source_page": 124866,
    },

    # Origen: TS Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones — Ciclo Completo
    # → 0706. Instalaciones y equipos de cultivo
    {
        "familia_destino":       "Marítimo pesquera",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Cultivos Acuícolas",
        "codigo_destino":        "0706",
        "nombre_destino":        "Instalaciones y equipos de cultivo",
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
        "source_page": 124866,
    },

    # DESTINO: T. Navegación y Pesca de Litoral (RD 1144/2012)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones — Ciclo Completo
    # → 1034. Instalaciones y servicios
    {
        "familia_destino":       "Marítimo pesquera",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Navegación y Pesca de Litoral",
        "codigo_destino":        "1034",
        "nombre_destino":        "Instalaciones y servicios",
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
        "source_link": None,
        "source_page": 124866,
    },

    # Origen: TS Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones — Ciclo Completo
    # → 1034. Instalaciones y servicios
    {
        "familia_destino":       "Marítimo pesquera",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Navegación y Pesca de Litoral",
        "codigo_destino":        "1034",
        "nombre_destino":        "Instalaciones y servicios",
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
        "source_page": 124866,
    },

    # DESTINO: T. Operaciones Subacuáticas e Hiperbáricas (RD 1073/2012)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Navegación y Pesca de Litoral — Ciclo Completo
    # → 0764. Navegación
    # → 0765. Maniobra y propulsión
    {
        "familia_destino":       "Marítimo pesquera",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Operaciones Subacuáticas e Hiperbáricas",
        "codigo_destino":        "0764",
        "nombre_destino":        "Navegación",
        "origenes": [
            {
                "familia_origen":        "Marítimo pesquera",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Navegación y Pesca de Litoral",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124866,
    },
    {
        "familia_destino":       "Marítimo pesquera",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Operaciones Subacuáticas e Hiperbáricas",
        "codigo_destino":        "0765",
        "nombre_destino":        "Maniobra y propulsión",
        "origenes": [
            {
                "familia_origen":        "Marítimo pesquera",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Navegación y Pesca de Litoral",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124866,
    },

    # Origen: TS Transporte Marítimo y Pesca de Altura — Ciclo Completo
    # → 0764. Navegación
    # → 0765. Maniobra y propulsión
    {
        "familia_destino":       "Marítimo pesquera",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Operaciones Subacuáticas e Hiperbáricas",
        "codigo_destino":        "0764",
        "nombre_destino":        "Navegación",
        "origenes": [
            {
                "familia_origen":        "Marítimo pesquera",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Transporte Marítimo y Pesca de Altura",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124866,
    },
    {
        "familia_destino":       "Marítimo pesquera",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Operaciones Subacuáticas e Hiperbáricas",
        "codigo_destino":        "0765",
        "nombre_destino":        "Maniobra y propulsión",
        "origenes": [
            {
                "familia_origen":        "Marítimo pesquera",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Transporte Marítimo y Pesca de Altura",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124866,
    },

    # ══════════════════════════════════════════════════════════════════
    # GRADO SUPERIOR
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: TS Acuicultura (RD 1585/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Diseño y Producción de Calzado y Complementos (Textil, Confección y Piel) — módulo específico
    # → 1021. Gestión medioambiental de los procesos acuícolas
    {
        "familia_destino": "Marítimo pesquera",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Acuicultura",
        "codigo_destino":  "1021",
        "nombre_destino":  "Gestión medioambiental de los procesos acuícolas",
        "origenes": [
            {
                "familia_origen": "Textil, confección y piel",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Diseño y Producción de Calzado y Complementos",
                "codigo_origen":  "0165",
                "nombre_origen":  "Gestión de la calidad, prevención de riesgos laborales y protección ambiental",
            },
        ],
        "source_link": None,
        "source_page": 124866,
    },

    # Origen: TS Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones — Ciclo Completo
    # → 1019. Instalaciones, innovación y sistemas de automatización en acuicultura
    {
        "familia_destino":       "Marítimo pesquera",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Acuicultura",
        "codigo_destino":        "1019",
        "nombre_destino":        "Instalaciones, innovación y sistemas de automatización en acuicultura",
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
        "source_page": 124866,
    },

    # Origen: TS Patronaje y Moda (Textil, Confección y Piel) — módulo específico
    # → 1021. Gestión medioambiental de los procesos acuícolas
    {
        "familia_destino": "Marítimo pesquera",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Acuicultura",
        "codigo_destino":  "1021",
        "nombre_destino":  "Gestión medioambiental de los procesos acuícolas",
        "origenes": [
            {
                "familia_origen": "Textil, confección y piel",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Patronaje y Moda",
                "codigo_origen":  "0165",
                "nombre_origen":  "Gestión de la calidad, prevención de riesgos laborales y protección ambiental",
            },
        ],
        "source_link": None,
        "source_page": 124866,
    },

]
