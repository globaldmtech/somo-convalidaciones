# rules_imagen_y_sonido.py
# Reglas de convalidación para la familia: Imagen y Sonido

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO MEDIO
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. Vídeo Disc-jockey y Sonido (RD 556/2012)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Iluminación, Captación y Tratamiento de Imagen — Ciclo Completo
    # → 1304. Toma y edición digital de imagen
    {
        "familia_destino":       "Imagen y sonido",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Vídeo Disc-jockey y Sonido",
        "codigo_destino":        "1304",
        "nombre_destino":        "Toma y edición digital de imagen",
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
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124854,
    },

    # Origen: TS Sonido para Audiovisuales y Espectáculos — Ciclo Completo
    # → 1298. Instalación y montaje de equipos de sonido
    {
        "familia_destino":       "Imagen y sonido",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Vídeo Disc-jockey y Sonido",
        "codigo_destino":        "1298",
        "nombre_destino":        "Instalación y montaje de equipos de sonido",
        "origenes": [
            {
                "familia_origen":        "Imagen y sonido",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Sonido para Audiovisuales y Espectáculos",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124855,
    },

    # Origen: TS Sonido para Audiovisuales y Espectáculos — Ciclo Completo
    # → 1299. Captación y grabación de sonido
    {
        "familia_destino":       "Imagen y sonido",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Vídeo Disc-jockey y Sonido",
        "codigo_destino":        "1299",
        "nombre_destino":        "Captación y grabación de sonido",
        "origenes": [
            {
                "familia_origen":        "Imagen y sonido",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Sonido para Audiovisuales y Espectáculos",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124855,
    },

    # Origen: TS Sonido para Audiovisuales y Espectáculos — Ciclo Completo
    # → 1300. Control, edición y mezcla de sonido
    {
        "familia_destino":       "Imagen y sonido",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Vídeo Disc-jockey y Sonido",
        "codigo_destino":        "1300",
        "nombre_destino":        "Control, edición y mezcla de sonido",
        "origenes": [
            {
                "familia_origen":        "Imagen y sonido",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Sonido para Audiovisuales y Espectáculos",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124855,
    },

    # ══════════════════════════════════════════════════════════════════
    # GRADO SUPERIOR
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: TS Iluminación, Captación y Tratamiento de Imagen (RD 1686/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Realización de Proyectos Audiovisuales y Espectáculos — Ciclo Completo
    # → 1158. Planificación de cámara en audiovisuales
    {
        "familia_destino":       "Imagen y sonido",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Iluminación, Captación y Tratamiento de Imagen",
        "codigo_destino":        "1158",
        "nombre_destino":        "Planificación de cámara en audiovisuales",
        "origenes": [
            {
                "familia_origen":        "Imagen y sonido",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Realización de Proyectos Audiovisuales y Espectáculos",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124855,
    },

    # DESTINO: TS Producción de Audiovisuales y Espectáculos (RD 1681/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Iluminación, Captación y Tratamiento de Imagen — Ciclo Completo
    # → 0910. Medios técnicos audiovisuales y escénicos
    {
        "familia_destino":       "Imagen y sonido",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Producción de Audiovisuales y Espectáculos",
        "codigo_destino":        "0910",
        "nombre_destino":        "Medios técnicos audiovisuales y escénicos",
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
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124855,
    },

    # Origen: TS Realización de Proyectos Audiovisuales y Espectáculos — Ciclo Completo
    # → 0920. Recursos expresivos audiovisuales y escénicos
    {
        "familia_destino":       "Imagen y sonido",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Producción de Audiovisuales y Espectáculos",
        "codigo_destino":        "0920",
        "nombre_destino":        "Recursos expresivos audiovisuales y escénicos",
        "origenes": [
            {
                "familia_origen":        "Imagen y sonido",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Realización de Proyectos Audiovisuales y Espectáculos",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124855,
    },

    # Origen: TS Realización de Proyectos Audiovisuales y Espectáculos — Ciclo Completo
    # → 0910. Medios técnicos audiovisuales y escénicos
    {
        "familia_destino":       "Imagen y sonido",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Producción de Audiovisuales y Espectáculos",
        "codigo_destino":        "0910",
        "nombre_destino":        "Medios técnicos audiovisuales y escénicos",
        "origenes": [
            {
                "familia_origen":        "Imagen y sonido",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Realización de Proyectos Audiovisuales y Espectáculos",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124855,
    },

]
