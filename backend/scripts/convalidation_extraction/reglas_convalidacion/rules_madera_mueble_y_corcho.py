# rules_madera_mueble_y_corcho.py
# Reglas de convalidación para la familia: Madera, Mueble y Corcho

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO MEDIO
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. Carpintería y Mueble (RD 1128/2010)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Programación de la Producción en Fabricación Mecánica — módulo específico
    # → 0545. Mecanizado por control numérico en carpintería y mueble
    {
        "familia_destino": "Madera, mueble y corcho",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Carpintería y Mueble",
        "codigo_destino":  "0545",
        "nombre_destino":  "Mecanizado por control numérico en carpintería y mueble",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Programación de la Producción en Fabricación Mecánica",
                "codigo_origen":  "0002",
                "nombre_origen":  "Mecanizado por control numérico",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 151,
    },

    # Origen: T. Actividades Comerciales (Comercio y Marketing) — módulo específico
    # → 0542. Control de almacén
    {
        "familia_destino": "Madera, mueble y corcho",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Carpintería y Mueble",
        "codigo_destino":  "0542",
        "nombre_destino":  "Control de almacén",
        "origenes": [
            {
                "familia_origen": "Comercio y marketing",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Actividades Comerciales",
                "codigo_origen":  "1228",
                "nombre_origen":  "Técnicas de almacén",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 151,
    },

    # Origen: T. Aceites de Oliva y Vinos (Industrias Alimentarias) — módulo específico
    # → 0542. Control de almacén
    {
        "familia_destino": "Madera, mueble y corcho",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Carpintería y Mueble",
        "codigo_destino":  "0542",
        "nombre_destino":  "Control de almacén",
        "origenes": [
            {
                "familia_origen": "Industrias alimentarias",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Aceites de Oliva y Vinos",
                "codigo_origen":  "0030",
                "nombre_origen":  "Operaciones y control de almacén en la industria alimentaria",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 151,
    },

    # Origen: T. Conducción de Vehículos de Transporte por Carretera (Transporte y Mantenimiento de Vehículos) — módulo específico
    # → 0542. Control de almacén
    {
        "familia_destino": "Madera, mueble y corcho",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Carpintería y Mueble",
        "codigo_destino":  "0542",
        "nombre_destino":  "Control de almacén",
        "origenes": [
            {
                "familia_origen": "Transporte y mantenimiento de vehículos",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Conducción de Vehículos de Transporte por Carretera",
                "codigo_origen":  "1209",
                "nombre_origen":  "Operaciones de Almacenaje",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 151,
    },

    # Origen: T. Elaboración de Productos Alimenticios (Industrias Alimentarias) — módulo específico
    # → 0542. Control de almacén
    {
        "familia_destino": "Madera, mueble y corcho",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Carpintería y Mueble",
        "codigo_destino":  "0542",
        "nombre_destino":  "Control de almacén",
        "origenes": [
            {
                "familia_origen": "Industrias alimentarias",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Elaboración de Productos Alimenticios",
                "codigo_origen":  "0030",
                "nombre_origen":  "Operaciones y control de almacén en la industria alimentaria",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 151,
    },

    # Origen: T. Mecanizado (Fabricación Mecánica) — módulo específico
    # → 0545. Mecanizado por control numérico en carpintería y mueble
    {
        "familia_destino": "Madera, mueble y corcho",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Carpintería y Mueble",
        "codigo_destino":  "0545",
        "nombre_destino":  "Mecanizado por control numérico en carpintería y mueble",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Técnico en Mecanizado",
                "codigo_origen":  "0002",
                "nombre_origen":  "Mecanizado por control numérico",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 151,
    },

    # Origen: T. Piedra Natural (Industrias Extractivas) — módulo específico
    # → 0545. Mecanizado por control numérico en carpintería y mueble
    {
        "familia_destino": "Madera, mueble y corcho",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Carpintería y Mueble",
        "codigo_destino":  "0545",
        "nombre_destino":  "Mecanizado por control numérico en carpintería y mueble",
        "origenes": [
            {
                "familia_origen": "Industrias extractivas",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Piedra Natural",
                "codigo_origen":  "0895",
                "nombre_origen":  "Tecnología de mecanizado en piedra natural",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 152,
    },

    # Origen: T. Panadería, Repostería y Confitería (Industrias Alimentarias) — módulo específico
    # → 0542. Control de almacén
    {
        "familia_destino": "Madera, mueble y corcho",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Carpintería y Mueble",
        "codigo_destino":  "0542",
        "nombre_destino":  "Control de almacén",
        "origenes": [
            {
                "familia_origen": "Industrias alimentarias",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Panadería, Repostería y Confitería",
                "codigo_origen":  "0030",
                "nombre_origen":  "Operaciones y control de almacén en la industria alimentaria",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 152,
    },

    # Origen: TS Diseño y Amueblamiento — Ciclo Completo
    # → 0538. Materiales en carpintería y mueble
    # → 0539. Soluciones constructivas
    # → 0543. Documentación técnica
    {
        "familia_destino":       "Madera, mueble y corcho",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Carpintería y Mueble",
        "codigo_destino":        "0538",
        "nombre_destino":        "Materiales en carpintería y mueble",
        "origenes": [
            {
                "familia_origen":        "Madera, mueble y corcho",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Diseño y Amueblamiento",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 152,
    },
    {
        "familia_destino":       "Madera, mueble y corcho",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Carpintería y Mueble",
        "codigo_destino":        "0539",
        "nombre_destino":        "Soluciones constructivas",
        "origenes": [
            {
                "familia_origen":        "Madera, mueble y corcho",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Diseño y Amueblamiento",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 152,
    },
    {
        "familia_destino":       "Madera, mueble y corcho",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Carpintería y Mueble",
        "codigo_destino":        "0543",
        "nombre_destino":        "Documentación técnica",
        "origenes": [
            {
                "familia_origen":        "Madera, mueble y corcho",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Diseño y Amueblamiento",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 152,
    },

    # DESTINO: T. Instalación y Amueblamiento (RD 1128/2010?)
    # ─────────────────────────────────────────────────────────────────
    # Nota: El PDF muestra "Técnico en Instalación y A" (truncado), asumimos Instalación y Amueblamiento (RD 1128/2010 o similar)
    # según el SQL es ID 136: Técnico en Instalación y Amueblamiento (RD 880/2011)

    # Origen: T. Actividades Comerciales (Comercio y Marketing) — módulo específico
    # → 0542. Control de almacén
    {
        "familia_destino": "Madera, mueble y corcho",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Instalación y Amueblamiento",
        "codigo_destino":  "0542",
        "nombre_destino":  "Control de almacén",
        "origenes": [
            {
                "familia_origen": "Comercio y marketing",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Actividades Comerciales",
                "codigo_origen":  "1228",
                "nombre_origen":  "Técnicas de almacén",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 152,
    },

    # Origen: T. Aceites de Oliva y Vinos (Industrias Alimentarias) — módulo específico
    # → 0542. Control de almacén
    {
        "familia_destino": "Madera, mueble y corcho",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Instalación y Amueblamiento",
        "codigo_destino":  "0542",
        "nombre_destino":  "Control de almacén",
        "origenes": [
            {
                "familia_origen": "Industrias alimentarias",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Aceites de Oliva y Vinos",
                "codigo_origen":  "0030",
                "nombre_origen":  "Operaciones y control de almacén en la industria alimentaria",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 152,
    },

    # Origen: T. Conducción de Vehículos de Transporte por Carretera (Transporte y Mantenimiento de Vehículos) — módulo específico
    # → 0542. Control de almacén
    {
        "familia_destino": "Madera, mueble y corcho",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Instalación y Amueblamiento",
        "codigo_destino":  "0542",
        "nombre_destino":  "Control de almacén",
        "origenes": [
            {
                "familia_origen": "Transporte y mantenimiento de vehículos",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Conducción de Vehículos de Transporte por Carretera",
                "codigo_origen":  "1209",
                "nombre_origen":  "Operaciones de Almacenaje",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 152,
    },

    # Origen: T. Elaboración de Productos Alimenticios (Industrias Alimentarias) — módulo específico
    # → 0542. Control de almacén
    {
        "familia_destino": "Madera, mueble y corcho",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Instalación y Amueblamiento",
        "codigo_destino":  "0542",
        "nombre_destino":  "Control de almacén",
        "origenes": [
            {
                "familia_origen": "Industrias alimentarias",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Elaboración de Productos Alimenticios",
                "codigo_origen":  "0030",
                "nombre_origen":  "Operaciones y control de almacén en la industria alimentaria",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 152,
    },

    # Origen: T. Panadería, Repostería y Confitería (Industrias Alimentarias) — módulo específico
    # → 0542. Control de almacén
    {
        "familia_destino": "Madera, mueble y corcho",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Instalación y Amueblamiento",
        "codigo_destino":  "0542",
        "nombre_destino":  "Control de almacén",
        "origenes": [
            {
                "familia_origen": "Industrias alimentarias",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Panadería, Repostería y Confitería",
                "codigo_origen":  "0030",
                "nombre_origen":  "Operaciones y control de almacén en la industria alimentaria",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 152,
    },

    # Origen: TS Diseño y Amueblamiento — Ciclo Completo
    # → 0538. Materiales en carpintería y mueble
    # → 0539. Soluciones constructivas
    # → 0778. Planificación de la instalación
    {
        "familia_destino":       "Madera, mueble y corcho",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalación y Amueblamiento",
        "codigo_destino":        "0538",
        "nombre_destino":        "Materiales en carpintería y mueble",
        "origenes": [
            {
                "familia_origen":        "Madera, mueble y corcho",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Diseño y Amueblamiento",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 152,
    },
    {
        "familia_destino":       "Madera, mueble y corcho",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalación y Amueblamiento",
        "codigo_destino":        "0539",
        "nombre_destino":        "Soluciones constructivas",
        "origenes": [
            {
                "familia_origen":        "Madera, mueble y corcho",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Diseño y Amueblamiento",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 152,
    },
    {
        "familia_destino":       "Madera, mueble y corcho",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalación y Amueblamiento",
        "codigo_destino":        "0778",
        "nombre_destino":        "Planificación de la instalación",
        "origenes": [
            {
                "familia_origen":        "Madera, mueble y corcho",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Diseño y Amueblamiento",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 152,
    },

]
