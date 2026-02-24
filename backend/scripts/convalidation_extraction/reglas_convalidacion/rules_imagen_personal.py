# rules_imagen_personal.py
# Reglas de convalidación para la familia: Imagen Personal

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO MEDIO
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. Estética y Belleza (RD 256/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Gestión de Ventas y Espacios Comerciales (Comercio y Marketing) — Ciclo Completo
    # → 0643. Marketing y venta en imagen personal
    {
        "familia_destino":       "Imagen personal",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Estética y Belleza",
        "codigo_destino":        "0643",
        "nombre_destino":        "Marketing y venta en imagen personal",
        "origenes": [
            {
                "familia_origen":        "Comercio y marketing",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Gestión de Ventas y Espacios Comerciales",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124854,
    },

    # Origen: T. Actividades Comerciales (Comercio y Marketing) — Ciclo Completo
    # → 0643. Marketing y venta en imagen personal
    {
        "familia_destino":       "Imagen personal",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Estética y Belleza",
        "codigo_destino":        "0643",
        "nombre_destino":        "Marketing y venta en imagen personal",
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
        "source_link": None,
        "source_page": 124854,
    },

    # Origen: TS Marketing y Publicidad (Comercio y Marketing) — Ciclo Completo
    # → 0643. Marketing y venta en imagen personal
    {
        "familia_destino":       "Imagen personal",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Estética y Belleza",
        "codigo_destino":        "0643",
        "nombre_destino":        "Marketing y venta en imagen personal",
        "origenes": [
            {
                "familia_origen":        "Comercio y marketing",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Marketing y Publicidad",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124854,
    },

    # DESTINO: T. Peluquería y Cosmética Capilar (RD 1588/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Actividades Comerciales (Comercio y Marketing) — Ciclo Completo
    # → 0643. Marketing y venta en imagen personal
    {
        "familia_destino":       "Imagen personal",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Peluquería y Cosmética Capilar",
        "codigo_destino":        "0643",
        "nombre_destino":        "Marketing y venta en imagen personal",
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
        "source_link": None,
        "source_page": 124854,
    },

    # Origen: TS Gestión de Ventas y Espacios Comerciales (Comercio y Marketing) — Ciclo Completo
    # → 0643. Marketing y venta en imagen personal
    {
        "familia_destino":       "Imagen personal",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Peluquería y Cosmética Capilar",
        "codigo_destino":        "0643",
        "nombre_destino":        "Marketing y venta en imagen personal",
        "origenes": [
            {
                "familia_origen":        "Comercio y marketing",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Gestión de Ventas y Espacios Comerciales",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124854,
    },

    # Origen: TS Marketing y Publicidad (Comercio y Marketing) — Ciclo Completo
    # → 0643. Marketing y venta en imagen personal
    {
        "familia_destino":       "Imagen personal",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Peluquería y Cosmética Capilar",
        "codigo_destino":        "0643",
        "nombre_destino":        "Marketing y venta en imagen personal",
        "origenes": [
            {
                "familia_origen":        "Comercio y marketing",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Marketing y Publicidad",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124854,
    },

    # ══════════════════════════════════════════════════════════════════
    # GRADO SUPERIOR
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: TS Caracterización y Maquillaje Profesional (RD 553/2012)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Animaciones 3D, Juegos y Entornos Interactivos (Imagen y Sonido) — Ciclo Completo
    # → 1267. Diseño digital de personajes 2D 3D
    {
        "familia_destino":       "Imagen personal",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Caracterización y Maquillaje Profesional",
        "codigo_destino":        "1267",
        "nombre_destino":        "Diseño digital de personajes 2D 3D",
        "origenes": [
            {
                "familia_origen":        "Imagen y sonido",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Animaciones 3D, Juegos y Entornos Interactivos",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124854,
    },

]
