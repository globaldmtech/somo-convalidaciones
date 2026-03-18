"""
rules_administracion_y_gestion.py
==================================
Reglas de convalidación cuyo MÓDULO DESTINO pertenece a la familia
"Administración y Gestión".

Fuente: Tabla de convalidaciones entre títulos regulados por la Ley Orgánica 2/2006.
"""

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # DESTINO: TS Administración y Finanzas (RD 1584/2011)
    # ══════════════════════════════════════════════════════════════════

    # Origen: TS Gestión de Ventas y Espacios Comerciales (Comercio y Marketing)
    {
        "familia_destino": "Administración y gestión",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Administración y Finanzas",
        "codigo_destino":  "0655",
        "nombre_destino":  "Gestión logística y comercial",
        "origenes": [
            {
                "familia_origen": "Comercio y marketing",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Gestión de Ventas y Espacios Comerciales",
                "codigo_origen":  "0626",
                "nombre_origen":  "Logística de aprovisionamiento",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124841,
    },

    # Origen: TS Transporte y Logística (Comercio y Marketing)
    {
        "familia_destino": "Administración y gestión",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Administración y Finanzas",
        "codigo_destino":  "0655",
        "nombre_destino":  "Gestión logística y comercial",
        "origenes": [
            {
                "familia_origen": "Comercio y marketing",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Transporte y Logística",
                "codigo_origen":  "0626",
                "nombre_origen":  "Logística de aprovisionamiento",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124841,
    },

    # ══════════════════════════════════════════════════════════════════
    # DESTINO: TS Asistencia a la Dirección (RD 1582/2011)
    # ══════════════════════════════════════════════════════════════════

    # Origen: TS Agencias de Viaje y Gestión de Eventos (Hostelería y Turismo)
    {
        "familia_destino": "Administración y gestión",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Asistencia a la Dirección",
        "codigo_destino":  "0661",
        "nombre_destino":  "Protocolo empresarial",
        "origenes": [
            {
                "familia_origen": "Hostelería y turismo",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Agencias de Viajes y Gestión de Eventos",
                "codigo_origen":  "0172",
                "nombre_origen":  "Protocolo y relaciones públicas",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124841,
    },

    # Origen: TS Gestión de Alojamientos Turísticos (Hostelería y Turismo)
    {
        "familia_destino": "Administración y gestión",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Asistencia a la Dirección",
        "codigo_destino":  "0661",
        "nombre_destino":  "Protocolo empresarial",
        "origenes": [
            {
                "familia_origen": "Hostelería y turismo",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Gestión de Alojamientos Turísticos",
                "codigo_origen":  "0172",
                "nombre_origen":  "Protocolo y relaciones públicas",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124841,
    },

    # Origen: TS Guía, Información y Asistencia Turística (Hostelería y Turismo)
    {
        "familia_destino": "Administración y gestión",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Asistencia a la Dirección",
        "codigo_destino":  "0661",
        "nombre_destino":  "Protocolo empresarial",
        "origenes": [
            {
                "familia_origen": "Hostelería y turismo",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Guía, Información y Asistencias Turísticas",
                "codigo_origen":  "0172",
                "nombre_origen":  "Protocolo y relaciones públicas",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 124841,
    },

]
