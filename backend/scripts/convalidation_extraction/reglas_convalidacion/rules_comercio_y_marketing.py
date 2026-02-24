"""
rules_comercio_y_marketing.py
==============================
Reglas de convalidación cuyo MÓDULO DESTINO pertenece a la familia
"Comercio y Marketing".

Fuente: Tabla de convalidaciones entre títulos regulados por la Ley Orgánica 2/2006.
"""

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO MEDIO
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. Actividades Comerciales (RD 1688/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Gestión de Ventas y Espacios Comerciales — módulo específico
    # → 1231. Dinamización del punto de venta
    {
        "familia_destino": "Comercio y marketing",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Actividades Comerciales",
        "codigo_destino":  "1231",
        "nombre_destino":  "Dinamización del punto de venta",
        "origenes": [
            {
                "familia_origen": "Comercio y marketing",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Gestión de Ventas y Espacios Comerciales",
                "codigo_origen":  "0927",
                "nombre_origen":  "Gestión de productos y promociones en el punto de venta",
            },
        ],
        "source_link": None,
        "source_page": 124843,
    },

    # Origen: T. Gestión Administrativa (Administración y Gestión) — Ciclo Completo
    # → 1234. Servicios de atención comercial
    {
        "familia_destino":       "Comercio y marketing",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Actividades Comerciales",
        "codigo_destino":        "1234",
        "nombre_destino":        "Servicios de atención comercial",
        "origenes": [
            {
                "familia_origen":        "Administración y gestión",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Gestión Administrativa",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124843,
    },

    # Origen: TS Diseño y Gestión de la Producción Gráfica (Artes Gráficas) — módulo específico
    # → 1234. Servicios de atención comercial
    {
        "familia_destino": "Comercio y marketing",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Actividades Comerciales",
        "codigo_destino":  "1234",
        "nombre_destino":  "Servicios de atención comercial",
        "origenes": [
            {
                "familia_origen": "Artes gráficas",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Diseño y Gestión de la Producción Gráfica",
                "codigo_origen":  "1480",
                "nombre_origen":  "Comercialización de productos gráficos y atención al cliente",
            },
        ],
        "source_link": None,
        "source_page": 124843,
    },

    # Origen: TS Diseño y Edición de Publicaciones Impresas y Multimedia (Artes Gráficas) — módulo específico
    # → 1234. Servicios de atención comercial
    {
        "familia_destino": "Comercio y marketing",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Actividades Comerciales",
        "codigo_destino":  "1234",
        "nombre_destino":  "Servicios de atención comercial",
        "origenes": [
            {
                "familia_origen": "Artes gráficas",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Diseño y Edición de Publicaciones Impresas y Multimedia",
                "codigo_origen":  "1480",
                "nombre_origen":  "Comercialización de productos gráficos y atención al cliente",
            },
        ],
        "source_link": None,
        "source_page": 124843,
    },

    # ══════════════════════════════════════════════════════════════════
    # GRADO SUPERIOR
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: TS Comercio Internacional (RD 1574/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Administración y Finanzas (Administración y Gestión) — Ciclo Completo
    # → 0623. Gestión económica y financiera de la empresa
    {
        "familia_destino":       "Comercio y marketing",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Comercio Internacional",
        "codigo_destino":        "0623",
        "nombre_destino":        "Gestión económica y financiera de la empresa",
        "origenes": [
            {
                "familia_origen":        "Administración y gestión",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Administración y Finanzas",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124843,
    },

    # Origen: TS Asistencia a la Dirección (Administración y Gestión) — Ciclo Completo
    # → 0623. Gestión económica y financiera de la empresa
    {
        "familia_destino":       "Comercio y marketing",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Comercio Internacional",
        "codigo_destino":        "0623",
        "nombre_destino":        "Gestión económica y financiera de la empresa",
        "origenes": [
            {
                "familia_origen":        "Administración y gestión",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Asistencia a la Dirección",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124843,
    },

    # DESTINO: TS Gestión de Ventas y Espacios Comerciales (RD 1573/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Administración y Finanzas (Administración y Gestión) — Ciclo Completo
    # → 0623. Gestión económica y financiera de la empresa
    {
        "familia_destino":       "Comercio y marketing",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Gestión de Ventas y Espacios Comerciales",
        "codigo_destino":        "0623",
        "nombre_destino":        "Gestión económica y financiera de la empresa",
        "origenes": [
            {
                "familia_origen":        "Administración y gestión",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Administración y Finanzas",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124843,
    },

    # Origen: TS Administración y Finanzas (Administración y Gestión) — Ciclo Completo
    # → 0626. Logística de aprovisionamiento
    {
        "familia_destino":       "Comercio y marketing",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Gestión de Ventas y Espacios Comerciales",
        "codigo_destino":        "0626",
        "nombre_destino":        "Logística de aprovisionamiento",
        "origenes": [
            {
                "familia_origen":        "Administración y gestión",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Administración y Finanzas",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124843,
    },

    # Origen: TS Asistencia a la Dirección (Administración y Gestión) — Ciclo Completo
    # → 0623. Gestión económica y financiera de la empresa
    {
        "familia_destino":       "Comercio y marketing",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Gestión de Ventas y Espacios Comerciales",
        "codigo_destino":        "0623",
        "nombre_destino":        "Gestión económica y financiera de la empresa",
        "origenes": [
            {
                "familia_origen":        "Administración y gestión",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Asistencia a la Dirección",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124843,
    },

    # DESTINO: TS Marketing y Publicidad (RD 1571/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Administración y Finanzas (Administración y Gestión) — Ciclo Completo
    # → 1110. Atención al cliente, consumidor y usuario
    {
        "familia_destino":       "Comercio y marketing",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Marketing y Publicidad",
        "codigo_destino":        "1110",
        "nombre_destino":        "Atención al cliente, consumidor y usuario",
        "origenes": [
            {
                "familia_origen":        "Administración y gestión",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Administración y Finanzas",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124843,
    },

    # Origen: TS Administración y Finanzas (Administración y Gestión) — Ciclo Completo
    # → 0623. Gestión económica y financiera de la empresa
    {
        "familia_destino":       "Comercio y marketing",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Marketing y Publicidad",
        "codigo_destino":        "0623",
        "nombre_destino":        "Gestión económica y financiera de la empresa",
        "origenes": [
            {
                "familia_origen":        "Administración y gestión",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Administración y Finanzas",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124843,
    },

    # Origen: TS Asistencia a la Dirección (Administración y Gestión) — Ciclo Completo
    # → 0623. Gestión económica y financiera de la empresa
    {
        "familia_destino":       "Comercio y marketing",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Marketing y Publicidad",
        "codigo_destino":        "0623",
        "nombre_destino":        "Gestión económica y financiera de la empresa",
        "origenes": [
            {
                "familia_origen":        "Administración y gestión",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Asistencia a la Dirección",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124844,
    },

    # Origen: TS Producción de Audiovisuales y Espectáculos (Imagen y Sonido) — Ciclo Completo
    # → 1008. Medios y soportes de comunicación
    {
        "familia_destino":       "Comercio y marketing",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Marketing y Publicidad",
        "codigo_destino":        "1008",
        "nombre_destino":        "Medios y soportes de comunicación",
        "origenes": [
            {
                "familia_origen":        "Imagen y sonido",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Producción de Audiovisuales y Espectáculos",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124844,
    },

    # Origen: TS Producción de Audiovisuales y Espectáculos (Imagen y Sonido) — Ciclo Completo
    # → 1109. Lanzamiento de productos y servicios
    {
        "familia_destino":       "Comercio y marketing",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Marketing y Publicidad",
        "codigo_destino":        "1109",
        "nombre_destino":        "Lanzamiento de productos y servicios",
        "origenes": [
            {
                "familia_origen":        "Imagen y sonido",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Producción de Audiovisuales y Espectáculos",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124844,
    },

    # DESTINO: TS Transporte y Logística (RD 1572/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Administración y Finanzas (Administración y Gestión) — Ciclo Completo
    # → 0623. Gestión económica y financiera de la empresa
    {
        "familia_destino":       "Comercio y marketing",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Transporte y Logística",
        "codigo_destino":        "0623",
        "nombre_destino":        "Gestión económica y financiera de la empresa",
        "origenes": [
            {
                "familia_origen":        "Administración y gestión",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Administración y Finanzas",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124844,
    },

    # Origen: TS Administración y Finanzas (Administración y Gestión) — Ciclo Completo
    # → 0626. Logística de aprovisionamiento
    {
        "familia_destino":       "Comercio y marketing",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Transporte y Logística",
        "codigo_destino":        "0626",
        "nombre_destino":        "Logística de aprovisionamiento",
        "origenes": [
            {
                "familia_origen":        "Administración y gestión",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Administración y Finanzas",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124844,
    },

    # Origen: TS Asistencia a la Dirección (Administración y Gestión) — Ciclo Completo
    # → 0623. Gestión económica y financiera de la empresa
    {
        "familia_destino":       "Comercio y marketing",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Transporte y Logística",
        "codigo_destino":        "0623",
        "nombre_destino":        "Gestión económica y financiera de la empresa",
        "origenes": [
            {
                "familia_origen":        "Administración y gestión",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Asistencia a la Dirección",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124844,
    },

]
