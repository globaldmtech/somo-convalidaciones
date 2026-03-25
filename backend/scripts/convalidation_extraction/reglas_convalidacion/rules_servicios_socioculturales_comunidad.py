# rules_servicios_socioculturales_comunidad.py
# Reglas de convalidación para la familia: Servicios Socioculturales y a la Comunidad

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO MEDIO
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. de Atención a Personas en Situación de Dependencia (RD 1593/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Animación Sociocultural y Turística — módulo específico
    # → 0211. Destrezas sociales
    {
        "familia_destino": "Servicios socioculturales y a la comunidad",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico de Atención a Personas en Situación de Dependencia",
        "codigo_destino":  "0211",
        "nombre_destino":  "Destrezas sociales",
        "origenes": [
            {
                "familia_origen": "Servicios socioculturales y a la comunidad",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Animación Sociocultural y Turística",
                "codigo_origen":  "1124",
                "nombre_origen":  "Dinamización grupal",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 156,
    },

    # Origen: TS Mediación Comunicativa — módulo específico
    # → 0211. Destrezas sociales
    {
        "familia_destino": "Servicios socioculturales y a la comunidad",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico de Atención a Personas en Situación de Dependencia",
        "codigo_destino":  "0211",
        "nombre_destino":  "Destrezas sociales",
        "origenes": [
            {
                "familia_origen": "Servicios socioculturales y a la comunidad",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Mediación Comunicativa",
                "codigo_origen":  "0017",
                "nombre_origen":  "Habilidades sociales",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 156,
    },

    # Origen: TS Educación Infantil — módulo específico
    # → 0211. Destrezas sociales
    {
        "familia_destino": "Servicios socioculturales y a la comunidad",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico de Atención a Personas en Situación de Dependencia",
        "codigo_destino":  "0211",
        "nombre_destino":  "Destrezas sociales",
        "origenes": [
            {
                "familia_origen": "Servicios socioculturales y a la comunidad",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Educación Infantil",
                "codigo_origen":  "0017",
                "nombre_origen":  "Habilidades sociales",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 156,
    },

    # Origen: TS Integración Social — módulo específico
    # → 0211. Destrezas sociales
    {
        "familia_destino": "Servicios socioculturales y a la comunidad",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico de Atención a Personas en Situación de Dependencia",
        "codigo_destino":  "0211",
        "nombre_destino":  "Destrezas sociales",
        "origenes": [
            {
                "familia_origen": "Servicios socioculturales y a la comunidad",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Integración Social",
                "codigo_origen":  "0017",
                "nombre_origen":  "Habilidades sociales",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 156,
    },

    # Origen: TS Integración Social — módulo específico
    # → 0214. Apoyo a la comunicación
    {
        "familia_destino": "Servicios socioculturales y a la comunidad",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico de Atención a Personas en Situación de Dependencia",
        "codigo_destino":  "0214",
        "nombre_destino":  "Apoyo a la comunicación",
        "origenes": [
            {
                "familia_origen": "Servicios socioculturales y a la comunidad",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Integración Social",
                "codigo_origen":  "0343",
                "nombre_origen":  "Sistemas aumentativos y alternativos de comunicación",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 156,
    },

    # Origen: TS Mediación Comunicativa — módulo específico
    # → 0214. Apoyo a la comunicación
    {
        "familia_destino": "Servicios socioculturales y a la comunidad",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico de Atención a Personas en Situación de Dependencia",
        "codigo_destino":  "0214",
        "nombre_destino":  "Apoyo a la comunicación",
        "origenes": [
            {
                "familia_origen": "Servicios socioculturales y a la comunidad",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Mediación Comunicativa",
                "codigo_origen":  "0343",
                "nombre_origen":  "Sistemas aumentativos y alternativos de comunicación",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 156,
    },

    # Origen: TS Promoción de Igualdad de Género — módulo específico
    # → 0211. Destrezas sociales
    {
        "familia_destino": "Servicios socioculturales y a la comunidad",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico de Atención a Personas en Situación de Dependencia",
        "codigo_destino":  "0211",
        "nombre_destino":  "Destrezas sociales",
        "origenes": [
            {
                "familia_origen": "Servicios socioculturales y a la comunidad",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Promoción de Igualdad de Género",
                "codigo_origen":  "0017",
                "nombre_origen":  "Habilidades sociales",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 156,
    },

    # Origen: TS Educación y Control Ambiental (Seguridad y Medio Ambiente) — módulo específico
    # → 0211. Destrezas sociales
    {
        "familia_destino": "Servicios socioculturales y a la comunidad",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Técnico de Atención a Personas en Situación de Dependencia",
        "codigo_destino":  "0211",
        "nombre_destino":  "Destrezas sociales",
        "origenes": [
            {
                "familia_origen": "Seguridad y medio ambiente",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Educación y Control Ambiental",
                "codigo_origen":  "0017",
                "nombre_origen":  "Habilidades sociales",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 156,
    },

    # ══════════════════════════════════════════════════════════════════
    # GRADO SUPERIOR
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: TS Animación Sociocultural y Turística (RD 1684/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Educación Infantil — módulo específico
    # → 1124. Dinamización grupal
    {
        "familia_destino": "Servicios socioculturales y a la comunidad",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Animación Sociocultural y Turística",
        "codigo_destino":  "1124",
        "nombre_destino":  "Dinamización grupal",
        "origenes": [
            {
                "familia_origen": "Servicios socioculturales y a la comunidad",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Educación Infantil",
                "codigo_origen":  "0017",
                "nombre_origen":  "Habilidades sociales",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 156,
    },

    # Origen: TS Integración Social — módulo específico
    # → 1124. Dinamización grupal
    {
        "familia_destino": "Servicios socioculturales y a la comunidad",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Animación Sociocultural y Turística",
        "codigo_destino":  "1124",
        "nombre_destino":  "Dinamización grupal",
        "origenes": [
            {
                "familia_origen": "Servicios socioculturales y a la comunidad",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Integración Social",
                "codigo_origen":  "0017",
                "nombre_origen":  "Habilidades sociales",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 156,
    },

    # Origen: TS Promoción de Igualdad de Género — módulo específico
    # → 1124. Dinamización grupal
    {
        "familia_destino": "Servicios socioculturales y a la comunidad",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Animación Sociocultural y Turística",
        "codigo_destino":  "1124",
        "nombre_destino":  "Dinamización grupal",
        "origenes": [
            {
                "familia_origen": "Servicios socioculturales y a la comunidad",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Promoción de Igualdad de Género",
                "codigo_origen":  "0017",
                "nombre_origen":  "Habilidades sociales",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 156,
    },

]
