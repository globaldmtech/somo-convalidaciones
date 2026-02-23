"""
rules_artes_graficas.py
========================
Reglas de convalidación cuyo MÓDULO DESTINO pertenece a la familia "Artes Gráficas".

Fuente: Tabla de convalidaciones entre títulos regulados por la Ley Orgánica 2/2006.
"""

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO MEDIO
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. Preimpresión Digital (RD 1586/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Iluminación, Captación y Tratamiento de Imagen (Imagen y Sonido) — Ciclo Completo
    # → 0873. Ilustración vectorial
    {
        "familia_destino":       "Artes gráficas",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Preimpresión Digital",
        "codigo_destino":        "0873",
        "nombre_destino":        "Ilustración vectorial",
        "origenes": [
            {
                "familia_origen":        "Imagen y sonido",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Iluminación, Captación y Tratamiento de Imagen",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124842,
    },

    # Origen: TS Iluminación, Captación y Tratamiento de Imagen (Imagen y Sonido) — Ciclo Completo
    # → 0867. Tratamiento de imagen en mapa de bits
    {
        "familia_destino":       "Artes gráficas",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Preimpresión Digital",
        "codigo_destino":        "0867",
        "nombre_destino":        "Tratamiento de imagen en mapa de bits",
        "origenes": [
            {
                "familia_origen":        "Imagen y sonido",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Iluminación, Captación y Tratamiento de Imagen",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124842,
    },

    # ══════════════════════════════════════════════════════════════════
    # GRADO SUPERIOR
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: TS Diseño y Edición de Publicaciones Impresas y Multimedia (RD 174/2013)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Gestión de Ventas y Espacios Comerciales (Comercio y Marketing) — Ciclo Completo
    # → 1480. Comercialización de productos gráficos y atención al cliente
    {
        "familia_destino":       "Artes gráficas",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Diseño y Edición de Publicaciones Impresas y Multimedia",
        "codigo_destino":        "1480",
        "nombre_destino":        "Comercialización de productos gráficos y atención al cliente",
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
        "source_page": 124842,
    },

    # Origen: TS Animaciones 3D, Juegos y Entornos Interactivos (Imagen y Sonido) — Ciclo Completo
    # → 1485. Desarrollo y publicación de productos editoriales multimedia
    {
        "familia_destino":       "Artes gráficas",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Diseño y Edición de Publicaciones Impresas y Multimedia",
        "codigo_destino":        "1485",
        "nombre_destino":        "Desarrollo y publicación de productos editoriales multimedia",
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
        "source_page": 124842,
    },

    # DESTINO: TS Diseño y Gestión de la Producción Gráfica (RD 175/2013)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Gestión de Ventas y Espacios Comerciales (Comercio y Marketing) — Ciclo Completo
    # → 1480. Comercialización de productos gráficos y atención al cliente
    {
        "familia_destino":       "Artes gráficas",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Diseño y Gestión de la Producción Gráfica",
        "codigo_destino":        "1480",
        "nombre_destino":        "Comercialización de productos gráficos y atención al cliente",
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
        "source_page": 124842,
    },

    # Origen: TS Iluminación, Captación y Tratamiento de Imagen (Imagen y Sonido) — Ciclo Completo
    # → 1539. Gestión del color
    {
        "familia_destino":       "Artes gráficas",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Diseño y Gestión de la Producción Gráfica",
        "codigo_destino":        "1539",
        "nombre_destino":        "Gestión del color",
        "origenes": [
            {
                "familia_origen":        "Imagen y sonido",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Iluminación, Captación y Tratamiento de Imagen",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124842,
    },

]
