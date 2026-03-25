# rules_hosteleria_y_turismo.py
# Reglas de convalidación para la familia: Hostelería y Turismo

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO SUPERIOR
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: TS Agencias de Viajes y Gestión de Eventos (RD 1254/2009)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Asistencia a la Dirección (Administración y Gestión) — módulo específico
    # → 0172. Protocolo y relaciones públicas
    {
        "familia_destino": "Hostelería y turismo",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Agencias de Viajes y Gestión de Eventos",
        "codigo_destino":  "0172",
        "nombre_destino":  "Protocolo y relaciones públicas",
        "origenes": [
            {
                "familia_origen": "Administración y gestión",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Asistencia a la Dirección",
                "codigo_origen":  "0661",
                "nombre_origen":  "Protocolo empresarial",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 139,
    },

    # Origen: TS Gestión de Ventas y Espacios Comerciales (Comercio y Marketing) — módulo específico
    # → 0173. Marketing turístico
    {
        "familia_destino": "Hostelería y turismo",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Agencias de Viajes y Gestión de Eventos",
        "codigo_destino":  "0173",
        "nombre_destino":  "Marketing turístico",
        "origenes": [
            {
                "familia_origen": "Comercio y marketing",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Gestión de Ventas y Espacios Comerciales",
                "codigo_origen":  "0930",
                "nombre_origen":  "Políticas de marketing",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 139,
    },

    # Origen: TS Marketing y Publicidad (Comercio y Marketing) — módulo específico
    # → 0173. Marketing turístico
    {
        "familia_destino": "Hostelería y turismo",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Agencias de Viajes y Gestión de Eventos",
        "codigo_destino":  "0173",
        "nombre_destino":  "Marketing turístico",
        "origenes": [
            {
                "familia_origen": "Comercio y marketing",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Marketing y Publicidad",
                "codigo_origen":  "0930",
                "nombre_origen":  "Políticas de marketing",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 140,
    },

    # DESTINO: TS Dirección de Cocina (RD 687/2010)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Procesos y Calidad en la Industria Alimentaria (Industrias Alimentarias) — dos módulos específicos
    # → 0501. Gestión de la calidad y de la seguridad e higiene alimentaria
    {
        "familia_destino": "Hostelería y turismo",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Dirección de Cocina",
        "codigo_destino":  "0501",
        "nombre_destino":  "Gestión de la calidad y de la seguridad e higiene alimentaria",
        "origenes": [
            {
                "familia_origen": "Industrias alimentarias",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Procesos y Calidad en la Industria Alimentaria",
                "codigo_origen":  "0086",
                "nombre_origen":  "Gestión de calidad y ambiental en la industria alimentaria",
            },
            {
                "familia_origen": "Industrias alimentarias",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Procesos y Calidad en la Industria Alimentaria",
                "codigo_origen":  "0468",
                "nombre_origen":  "Nutrición y seguridad alimentaria",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 140,
    },

    # Origen: TS Vitivinicultura (Industrias Alimentarias) — dos módulos específicos
    # → 0501. Gestión de la calidad y de la seguridad e higiene alimentaria
    {
        "familia_destino": "Hostelería y turismo",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Dirección de Cocina",
        "codigo_destino":  "0501",
        "nombre_destino":  "Gestión de la calidad y de la seguridad e higiene alimentaria",
        "origenes": [
            {
                "familia_origen": "Industrias alimentarias",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Vitivinicultura",
                "codigo_origen":  "0085",
                "nombre_origen":  "Legislación vitivinícola y seguridad alimentaria",
            },
            {
                "familia_origen": "Industrias alimentarias",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Vitivinicultura",
                "codigo_origen":  "0086",
                "nombre_origen":  "Gestión de calidad y ambiental en la industria alimentaria",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 140,
    },

    # DESTINO: TS Gestión de Alojamientos Turísticos (RD 1686/2007)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Asistencia a la Dirección (Administración y Gestión) — módulo específico
    # → 0172. Protocolo y relaciones públicas
    {
        "familia_destino": "Hostelería y turismo",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Gestión de Alojamientos Turísticos",
        "codigo_destino":  "0172",
        "nombre_destino":  "Protocolo y relaciones públicas",
        "origenes": [
            {
                "familia_origen": "Administración y gestión",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Asistencia a la Dirección",
                "codigo_origen":  "0661",
                "nombre_origen":  "Protocolo empresarial",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 140,
    },

    # Origen: TS Gestión de Ventas y Espacios Comerciales (Comercio y Marketing) — módulo específico
    # → 0173. Marketing turístico
    {
        "familia_destino": "Hostelería y turismo",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Gestión de Alojamientos Turísticos",
        "codigo_destino":  "0173",
        "nombre_destino":  "Marketing turístico",
        "origenes": [
            {
                "familia_origen": "Comercio y marketing",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Gestión de Ventas y Espacios Comerciales",
                "codigo_origen":  "0930",
                "nombre_origen":  "Políticas de marketing",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 140,
    },

    # Origen: TS Marketing y Publicidad (Comercio y Marketing) — módulo específico
    # → 0173. Marketing turístico
    {
        "familia_destino": "Hostelería y turismo",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Gestión de Alojamientos Turísticos",
        "codigo_destino":  "0173",
        "nombre_destino":  "Marketing turístico",
        "origenes": [
            {
                "familia_origen": "Comercio y marketing",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Marketing y Publicidad",
                "codigo_origen":  "0930",
                "nombre_origen":  "Políticas de marketing",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 140,
    },

    # DESTINO: TS Guía, Información y Asistencias Turísticas (RD 1255/2009)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Marketing y Publicidad (Comercio y Marketing) — módulo específico
    # → 0173. Marketing turístico
    {
        "familia_destino": "Hostelería y turismo",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Guía, Información y Asistencias Turísticas",
        "codigo_destino":  "0173",
        "nombre_destino":  "Marketing turístico",
        "origenes": [
            {
                "familia_origen": "Comercio y marketing",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Marketing y Publicidad",
                "codigo_origen":  "0930",
                "nombre_origen":  "Políticas de marketing",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 140,
    },

    # Origen: TS Asistencia a la Dirección (Administración y Gestión) — módulo específico
    # → 0172. Protocolo y relaciones públicas
    {
        "familia_destino": "Hostelería y turismo",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Guía, Información y Asistencias Turísticas",
        "codigo_destino":  "0172",
        "nombre_destino":  "Protocolo y relaciones públicas",
        "origenes": [
            {
                "familia_origen": "Administración y gestión",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Asistencia a la Dirección",
                "codigo_origen":  "0661",
                "nombre_origen":  "Protocolo empresarial",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 140,
    },

    # Origen: TS Gestión de Ventas y Espacios Comerciales (Comercio y Marketing) — módulo específico
    # → 0173. Marketing turístico
    {
        "familia_destino": "Hostelería y turismo",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Guía, Información y Asistencias Turísticas",
        "codigo_destino":  "0173",
        "nombre_destino":  "Marketing turístico",
        "origenes": [
            {
                "familia_origen": "Comercio y marketing",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Gestión de Ventas y Espacios Comerciales",
                "codigo_origen":  "0930",
                "nombre_origen":  "Políticas de marketing",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 140,
    },

]
