# rules_informatica_y_comunicaciones.py
# Reglas de convalidación para la familia: Informática y Comunicaciones

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO MEDIO
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. Sistemas Microinformáticos y Redes (RD 1691/2007)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Gestión Administrativa (Administración y Gestión) — módulo específico
    # → 0223. Aplicaciones ofimáticas
    {
        "familia_destino": "Informática y comunicaciones",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Sistemas Microinformáticos y Redes",
        "codigo_destino":  "0223",
        "nombre_destino":  "Aplicaciones ofimáticas",
        "origenes": [
            {
                "familia_origen": "Administración y gestión",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Gestión Administrativa",
                "codigo_origen":  "0440",
                "nombre_origen":  "Tratamiento informático de la información",
            },
        ],
        "source_link": None,
        "source_page": 124860,
    },

    # Origen: TS Mantenimiento Electrónico (Electricidad y Electrónica) — Ciclo Completo
    # → 0221. Montaje y mantenimiento de equipo
    {
        "familia_destino":       "Informática y comunicaciones",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Sistemas Microinformáticos y Redes",
        "codigo_destino":        "0221",
        "nombre_destino":        "Montaje y mantenimiento de equipo",
        "origenes": [
            {
                "familia_origen":        "Electricidad y electrónica",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Mantenimiento Electrónico",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124861,
    },

    # Origen: TS Mantenimiento Electrónico (Electricidad y Electrónica) — Ciclo Completo
    # → 0222. Sistemas operativos monopuesto
    {
        "familia_destino":       "Informática y comunicaciones",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Sistemas Microinformáticos y Redes",
        "codigo_destino":        "0222",
        "nombre_destino":        "Sistemas operativos monopuesto",
        "origenes": [
            {
                "familia_origen":        "Electricidad y electrónica",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Mantenimiento Electrónico",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124861,
    },

    # ══════════════════════════════════════════════════════════════════
    # GRADO SUPERIOR
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: TS Administración de Sistemas Informáticos en Red (RD 1629/2009)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Mantenimiento Electrónico (Electricidad y Electrónica) — Ciclo Completo
    # → 0371. Fundamentos de hardware
    {
        "familia_destino":       "Informática y comunicaciones",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Administración de Sistemas Informáticos en Red",
        "codigo_destino":        "0371",
        "nombre_destino":        "Fundamentos de hardware",
        "origenes": [
            {
                "familia_origen":        "Electricidad y electrónica",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Mantenimiento Electrónico",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124860,
    },

    # DESTINO: TS Desarrollo de Aplicaciones Multiplataforma (RD 450/2010)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Administración de Sistemas Informáticos en Red — Ciclo Completo
    # → 0483. Sistemas informáticos
    {
        "familia_destino":       "Informática y comunicaciones",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Desarrollo de Aplicaciones Multiplataforma",
        "codigo_destino":        "0483",
        "nombre_destino":        "Sistemas informáticos",
        "origenes": [
            {
                "familia_origen":        "Informática y comunicaciones",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Administración de Sistemas Informáticos en Red",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124860,
    },

    # Origen: TS Administración de Sistemas Informáticos en Red — Ciclo Completo
    # → 0484. Bases de datos
    {
        "familia_destino":       "Informática y comunicaciones",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Desarrollo de Aplicaciones Multiplataforma",
        "codigo_destino":        "0484",
        "nombre_destino":        "Bases de datos",
        "origenes": [
            {
                "familia_origen":        "Informática y comunicaciones",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Administración de Sistemas Informáticos en Red",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124860,
    },

    # Origen: TS Animaciones 3D, Juegos y Entornos Interactivos (Imagen y Sonido) — Ciclo Completo
    # → 0489. Programación multimedia y dispositivos móviles
    {
        "familia_destino":       "Informática y comunicaciones",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Desarrollo de Aplicaciones Multiplataforma",
        "codigo_destino":        "0489",
        "nombre_destino":        "Programación multimedia y dispositivos móviles",
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
        "source_page": 124860,
    },

    # DESTINO: TS Desarrollo de Aplicaciones Web (RD 686/2010)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Administración de Sistemas Informáticos en Red — Ciclo Completo
    # → 0483. Sistemas informáticos
    {
        "familia_destino":       "Informática y comunicaciones",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Desarrollo de Aplicaciones Web",
        "codigo_destino":        "0483",
        "nombre_destino":        "Sistemas informáticos",
        "origenes": [
            {
                "familia_origen":        "Informática y comunicaciones",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Administración de Sistemas Informáticos en Red",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124860,
    },

    # Origen: TS Administración de Sistemas Informáticos en Red — Ciclo Completo
    # → 0484. Bases de datos
    {
        "familia_destino":       "Informática y comunicaciones",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Desarrollo de Aplicaciones Web",
        "codigo_destino":        "0484",
        "nombre_destino":        "Bases de datos",
        "origenes": [
            {
                "familia_origen":        "Informática y comunicaciones",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Administración de Sistemas Informáticos en Red",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124860,
    },

]
