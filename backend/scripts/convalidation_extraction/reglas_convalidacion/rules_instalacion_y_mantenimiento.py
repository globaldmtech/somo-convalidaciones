# rules_instalacion_y_mantenimiento.py
# Reglas de convalidación para la familia: Instalación y Mantenimiento

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO MEDIO
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. Instalaciones Frigoríficas y de Climatización (RD 1793/2010)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones — módulo específico
    # → 0042. Montaje y mantenimiento de instalaciones de climatización, ventilación y extracción
    {
        "familia_destino": "Instalación y mantenimiento",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Instalaciones Frigoríficas y de Climatización",
        "codigo_destino":  "0042",
        "nombre_destino":  "Montaje y mantenimiento de instalaciones de climatización, ventilación y extracción",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones",
                "codigo_origen":  "1176",
                "nombre_origen":  "Instalación y mantenimiento de maquinaria de frío y climatización en buques y embarcaciones",
            },
        ],
        "source_link": None,
        "source_page": 124861,
    },

    # Origen: T. Redes y Estaciones de Tratamientos de Aguas — módulo específico
    # → 0037. Técnicas de montaje de instalaciones
    {
        "familia_destino": "Instalación y mantenimiento",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Instalaciones Frigoríficas y de Climatización",
        "codigo_destino":  "0037",
        "nombre_destino":  "Técnicas de montaje de instalaciones",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Redes y Estaciones de Tratamientos de Aguas",
                "codigo_origen":  "1562",
                "nombre_origen":  "Técnicas de mecanizado y unión",
            },
        ],
        "source_link": None,
        "source_page": 124861,
    },

    # Origen: T. Instalaciones Eléctricas y Automáticas — Ciclo Completo
    # → 0038. Instalaciones eléctricas y automatismos
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalaciones Frigoríficas y de Climatización",
        "codigo_destino":        "0038",
        "nombre_destino":        "Instalaciones eléctricas y automatismos",
        "origenes": [
            {
                "familia_origen":        "Electricidad y electrónica",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Instalaciones Eléctricas y Automáticas",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124861,
    },

    # Origen: T. Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones — Ciclo Completo
    # → 0038. Instalaciones eléctricas y automatismos
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalaciones Frigoríficas y de Climatización",
        "codigo_destino":        "0038",
        "nombre_destino":        "Instalaciones eléctricas y automatismos",
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
        "source_page": 124861,
    },

    # Origen: TS Gestión del Agua — módulo específico
    # → 0037. Técnicas de montaje de instalaciones
    {
        "familia_destino": "Instalación y mantenimiento",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Instalaciones Frigoríficas y de Climatización",
        "codigo_destino":  "0037",
        "nombre_destino":  "Técnicas de montaje de instalaciones",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Gestión del Agua",
                "codigo_origen":  "1580",
                "nombre_origen":  "Técnicas de montaje en instalaciones de agua",
            },
        ],
        "source_link": None,
        "source_page": 124861,
    },

    # Origen: TS Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones — Ciclo Completo
    # → 0038. Instalaciones eléctricas y automatismos
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalaciones Frigoríficas y de Climatización",
        "codigo_destino":        "0038",
        "nombre_destino":        "Instalaciones eléctricas y automatismos",
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
        "source_page": 124861,
    },

    # DESTINO: T. Instalaciones de Producción de Calor (RD 1792/2010)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Instalaciones Eléctricas y Automáticas — Ciclo Completo
    # → 0038. Instalaciones eléctricas y automatismos
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalaciones de Producción de Calor",
        "codigo_destino":        "0038",
        "nombre_destino":        "Instalaciones eléctricas y automatismos",
        "origenes": [
            {
                "familia_origen":        "Electricidad y electrónica",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Instalaciones Eléctricas y Automáticas",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124861,
    },

    # Origen: T. Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones — Ciclo Completo
    # → 0038. Instalaciones eléctricas y automatismos
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalaciones de Producción de Calor",
        "codigo_destino":        "0038",
        "nombre_destino":        "Instalaciones eléctricas y automatismos",
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
        "source_page": 124862,
    },

    # Origen: T. Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones — Ciclo Completo
    # → 0302. Montaje y mantenimiento de instalaciones caloríficas
    # → 0310. Montaje y mantenimiento de instalaciones de agua
    # → 0393. Montaje y mantenimiento de instalaciones de gas y combustibles líquidos
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalaciones de Producción de Calor",
        "codigo_destino":        "0302",
        "nombre_destino":        "Montaje y mantenimiento de instalaciones caloríficas",
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
        "source_page": 124862,
    },
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalaciones de Producción de Calor",
        "codigo_destino":        "0310",
        "nombre_destino":        "Montaje y mantenimiento de instalaciones de agua",
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
        "source_page": 124862,
    },
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalaciones de Producción de Calor",
        "codigo_destino":        "0393",
        "nombre_destino":        "Montaje y mantenimiento de instalaciones de gas y combustibles líquidos",
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
        "source_page": 124862,
    },

    # Origen: T. Redes y Estaciones de Tratamientos de Aguas — módulo específico
    # → 0037. Técnicas de montaje de instalaciones
    {
        "familia_destino": "Instalación y mantenimiento",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Instalaciones de Producción de Calor",
        "codigo_destino":  "0037",
        "nombre_destino":  "Técnicas de montaje de instalaciones",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Redes y Estaciones de Tratamientos de Aguas",
                "codigo_origen":  "1562",
                "nombre_origen":  "Técnicas de mecanizado y unión",
            },
        ],
        "source_link": None,
        "source_page": 124862,
    },

    # Origen: TS Gestión del Agua — módulo específico
    # → 0037. Técnicas de montaje de instalaciones
    {
        "familia_destino": "Instalación y mantenimiento",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Instalaciones de Producción de Calor",
        "codigo_destino":  "0037",
        "nombre_destino":  "Técnicas de montaje de instalaciones",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Gestión del Agua",
                "codigo_origen":  "1580",
                "nombre_origen":  "Técnicas de montaje en instalaciones de agua",
            },
        ],
        "source_link": None,
        "source_page": 124862,
    },

    # Origen: TS Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones — Ciclo Completo
    # → 0038. Instalaciones eléctricas y automatismos
    # → 0302. Montaje y mantenimiento de instalaciones caloríficas
    # → 0310. Montaje y mantenimiento de instalaciones de agua
    # → 0393. Montaje y mantenimiento de instalaciones de gas y combustibles líquidos
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalaciones de Producción de Calor",
        "codigo_destino":        "0038",
        "nombre_destino":        "Instalaciones eléctricas y automatismos",
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
        "source_page": 124862,
    },
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalaciones de Producción de Calor",
        "codigo_destino":        "0302",
        "nombre_destino":        "Montaje y mantenimiento de instalaciones caloríficas",
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
        "source_page": 124862,
    },
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalaciones de Producción de Calor",
        "codigo_destino":        "0310",
        "nombre_destino":        "Montaje y mantenimiento de instalaciones de agua",
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
        "source_page": 124862,
    },
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalaciones de Producción de Calor",
        "codigo_destino":        "0393",
        "nombre_destino":        "Montaje y mantenimiento de instalaciones de gas y combustibles líquidos",
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
        "source_page": 124862,
    },

    # DESTINO: T. Mantenimiento Electromecánico (RD 1589/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Mecanizado (Fabricación Mecánica) — módulo específico
    # → 0949. Técnicas de fabricación
    {
        "familia_destino": "Instalación y mantenimiento",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Mantenimiento Electromecánico",
        "codigo_destino":  "0949",
        "nombre_destino":  "Técnicas de fabricación",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Técnico en Mecanizado",
                "codigo_origen":  "0004",
                "nombre_origen":  "Fabricación por arranque de viruta",
            },
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Técnico en Mecanizado",
                "codigo_origen":  "0007",
                "nombre_origen":  "Interpretación gráfica",
            },
        ],
        "source_link": None,
        "source_page": 124862,
    },

    # Origen: T. Redes y Estaciones de Tratamientos de Aguas — módulo específico
    # → 0950. Técnicas de unión y montaje
    {
        "familia_destino": "Instalación y mantenimiento",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Mantenimiento Electromecánico",
        "codigo_destino":  "0950",
        "nombre_destino":  "Técnicas de unión y montaje",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Redes y Estaciones de Tratamientos de Aguas",
                "codigo_origen":  "1562",
                "nombre_origen":  "Técnicas de mecanizado y unión",
            },
        ],
        "source_link": None,
        "source_page": 124862,
    },

    # Origen: TS Gestión del Agua — módulo específico
    # → 0950. Técnicas de unión y montaje
    {
        "familia_destino": "Instalación y mantenimiento",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Mantenimiento Electromecánico",
        "codigo_destino":  "0950",
        "nombre_destino":  "Técnicas de unión y montaje",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Gestión del Agua",
                "codigo_origen":  "1580",
                "nombre_origen":  "Técnicas de montaje en instalaciones de agua",
            },
        ],
        "source_link": None,
        "source_page": 124863,
    },

    # Origen: T. Instalaciones Eléctricas y Automáticas — Ciclo Completo
    # → 0951. Electricidad y automatismos eléctricos
    # → 0954. Montaje y mantenimiento eléctrico-electrónico
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Mantenimiento Electromecánico",
        "codigo_destino":        "0951",
        "nombre_destino":        "Electricidad y automatismos eléctricos",
        "origenes": [
            {
                "familia_origen":        "Electricidad y electrónica",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Instalaciones Eléctricas y Automáticas",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124863,
    },
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Mantenimiento Electromecánico",
        "codigo_destino":        "0954",
        "nombre_destino":        "Montaje y mantenimiento eléctrico-electrónico",
        "origenes": [
            {
                "familia_origen":        "Electricidad y electrónica",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Instalaciones Eléctricas y Automáticas",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124863,
    },

    # Origen: T. Soldadura y Calderería (Fabricación Mecánica) — Ciclo Completo
    # → 0949. Técnicas de fabricación
    # → 0950. Técnicas de unión y montaje
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Mantenimiento Electromecánico",
        "codigo_destino":        "0949",
        "nombre_destino":        "Técnicas de fabricación",
        "origenes": [
            {
                "familia_origen":        "Fabricación mecánica",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Soldadura y Calderería",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124863,
    },
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Mantenimiento Electromecánico",
        "codigo_destino":        "0950",
        "nombre_destino":        "Técnicas de unión y montaje",
        "origenes": [
            {
                "familia_origen":        "Fabricación mecánica",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Soldadura y Calderería",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124863,
    },

    # ══════════════════════════════════════════════════════════════════
    # GRADO SUPERIOR
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: TS Desarrollo de Proyectos de Instalaciones Térmicas y de Fluidos (RD 219/2008)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Mecatrónica Industrial — Ciclo Completo
    # → 0120. Sistemas eléctricos y automáticos
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Desarrollo de Proyectos de Instalaciones Térmicas y de Fluidos",
        "codigo_destino":        "0120",
        "nombre_destino":        "Sistemas eléctricos y automáticos",
        "origenes": [
            {
                "familia_origen":        "Instalación y mantenimiento",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Mecatrónica Industrial",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124863,
    },

    # Origen: TS Sistemas Electrotécnicos y Automatizados (Electricidad y Electrónica) — Ciclo Completo
    # → 0120. Sistemas eléctricos y automáticos
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Desarrollo de Proyectos de Instalaciones Térmicas y de Fluidos",
        "codigo_destino":        "0120",
        "nombre_destino":        "Sistemas eléctricos y automáticos",
        "origenes": [
            {
                "familia_origen":        "Electricidad y electrónica",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Sistemas Electrotécnicos y Automatizados",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124863,
    },

    # DESTINO: TS Mantenimiento de Instalaciones Térmicas y de Fluidos (RD 220/2008)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Eficiencia Energética y Energía Solar Térmica — módulo específico
    # → 0124. Energías renovables y eficiencia energética
    {
        "familia_destino": "Instalación y mantenimiento",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Mantenimiento de Instalaciones Térmicas y de Fluidos",
        "codigo_destino":  "0124",
        "nombre_destino":  "Energías renovables y eficiencia energética",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Eficiencia Energética y Energía Solar Térmica",
                "codigo_origen":  "0349",
                "nombre_origen":  "Eficiencia energética de instalaciones",
            },
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Eficiencia Energética y Energía Solar Térmica",
                "codigo_origen":  "0352",
                "nombre_origen":  "Configuración de instalaciones solares térmicas",
            },
        ],
        "source_link": None,
        "source_page": 124863,
    },

    # Origen: TS Desarrollo de Proyectos de Instalaciones Térmicas y de Fluidos — módulo específico
    # → 0134. Configuración de instalaciones térmicas y de fluidos
    {
        "familia_destino": "Instalación y mantenimiento",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Mantenimiento de Instalaciones Térmicas y de Fluidos",
        "codigo_destino":  "0134",
        "nombre_destino":  "Configuración de instalaciones térmicas y de fluidos",
        "origenes": [
            {
                "familia_origen": "Instalación y mantenimiento",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Desarrollo de Proyectos de Instalaciones Térmicas y de Fluidos",
                "codigo_origen":  "0125",
                "nombre_origen":  "Configuración de instalaciones de climatización, calefacción y ACS",
            },
            {
                "familia_origen": "Instalación y mantenimiento",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Desarrollo de Proyectos de Instalaciones Térmicas y de Fluidos",
                "codigo_origen":  "0126",
                "nombre_origen":  "Configuración de instalaciones frigoríficas",
            },
            {
                "familia_origen": "Instalación y mantenimiento",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Desarrollo de Proyectos de Instalaciones Térmicas y de Fluidos",
                "codigo_origen":  "0127",
                "nombre_origen":  "Configuración de instalaciones de fluidos",
            },
        ],
        "source_link": None,
        "source_page": 124863,
    },

    # Origen: TS Mecatrónica Industrial — Ciclo Completo
    # → 0120. Sistemas eléctricos y automáticos
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Mantenimiento de Instalaciones Térmicas y de Fluidos",
        "codigo_destino":        "0120",
        "nombre_destino":        "Sistemas eléctricos y automáticos",
        "origenes": [
            {
                "familia_origen":        "Instalación y mantenimiento",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Mecatrónica Industrial",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124863,
    },

    # Origen: TS Sistemas Electrotécnicos y Automatizados (Electricidad y Electrónica) — Ciclo Completo
    # → 0120. Sistemas eléctricos y automáticos
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Mantenimiento de Instalaciones Térmicas y de Fluidos",
        "codigo_destino":        "0120",
        "nombre_destino":        "Sistemas eléctricos y automáticos",
        "origenes": [
            {
                "familia_origen":        "Electricidad y electrónica",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Sistemas Electrotécnicos y Automatizados",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124863,
    },

    # DESTINO: TS Mecatrónica Industrial (RD 1576/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Automoción (Transporte y Mantenimiento de Vehículos) — módulo específico
    # → 0935. Sistemas mecánicos
    {
        "familia_destino": "Instalación y mantenimiento",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Mecatrónica Industrial",
        "codigo_destino":  "0935",
        "nombre_destino":  "Sistemas mecánicos",
        "origenes": [
            {
                "familia_origen": "Transporte y mantenimiento de vehículos",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Automoción",
                "codigo_origen":  "0292",
                "nombre_origen":  "Sistemas de transmisión de fuerzas y trenes de rodaje",
            },
            {
                "familia_origen": "Transporte y mantenimiento de vehículos",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Automoción",
                "codigo_origen":  "0293",
                "nombre_origen":  "Motores térmicos y sus sistemas auxiliares",
            },
            {
                "familia_origen": "Transporte y mantenimiento de vehículos",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Automoción",
                "codigo_origen":  "0294",
                "nombre_origen":  "Elementos amovibles y fijos no estructurales",
            },
        ],
        "source_link": None,
        "source_page": 124864,
    },

    # Origen: TS Sistemas Electrotécnicos y Automatizados (Electricidad y Electrónica) — Ciclo Completo
    # → 0937. Sistemas eléctricos y electrónicos
    {
        "familia_destino":       "Instalación y mantenimiento",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Mecatrónica Industrial",
        "codigo_destino":        "0937",
        "nombre_destino":        "Sistemas eléctricos y electrónicos",
        "origenes": [
            {
                "familia_origen":        "Electricidad y electrónica",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Sistemas Electrotécnicos y Automatizados",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124864,
    },

]
