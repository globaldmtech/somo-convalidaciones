"""
rules_energia_y_agua.py
========================
Reglas de convalidación cuyo MÓDULO DESTINO pertenece a la familia
"Energía y Agua".

Fuente: Tabla de convalidaciones entre títulos regulados por la Ley Orgánica 2/2006.
"""

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO MEDIO
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. Redes y Estaciones de Tratamientos de Aguas (RD 114/2017)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Gestión del Agua — módulo específico
    # → 1564. Calidad del agua
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Redes y Estaciones de Tratamientos de Aguas",
        "codigo_destino":  "1564",
        "nombre_destino":  "Calidad del agua",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Gestión del Agua",
                "codigo_origen":  "1573",
                "nombre_origen":  "Calidad y tratamiento de aguas",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 134,
    },

    # Origen: TS Gestión del Agua — módulo específico
    # → 1562. Técnicas de mecanizado y unión
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Redes y Estaciones de Tratamientos de Aguas",
        "codigo_destino":  "1562",
        "nombre_destino":  "Técnicas de mecanizado y unión",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Gestión del Agua",
                "codigo_origen":  "1580",
                "nombre_origen":  "Técnicas de montaje en instalaciones de agua",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 134,
    },

    # Origen: TS Eficiencia Energética y Energía Solar Térmica — módulo específico
    # → 0310. Montaje y mantenimiento de Instalaciones de agua
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Redes y Estaciones de Tratamientos de Aguas",
        "codigo_destino":  "0310",
        "nombre_destino":  "Montaje y mantenimiento de Instalaciones de agua",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Eficiencia Energética y Energía Solar Térmica",
                "codigo_origen":  "0122",
                "nombre_origen":  "Procesos de Montaje de Instalaciones",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 134,
    },

    # Origen: T. Instalaciones Eléctricas y Automáticas (Electricidad y Electrónica) — módulo específico
    # → 1561. Instalaciones eléctricas en redes de agua
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Redes y Estaciones de Tratamientos de Aguas",
        "codigo_destino":  "1561",
        "nombre_destino":  "Instalaciones eléctricas en redes de agua",
        "origenes": [
            {
                "familia_origen": "Electricidad y electrónica",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Instalaciones Eléctricas y Automáticas",
                "codigo_origen":  "0232",
                "nombre_origen":  "Automatismos industriales",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 134,
    },

    # Origen: T. Instalaciones Eléctricas y Automáticas (Electricidad y Electrónica) — Ciclo Completo
    # → 1561. Instalaciones eléctricas en redes de agua
    {
        "familia_destino":       "Energía y agua",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Redes y Estaciones de Tratamientos de Aguas",
        "codigo_destino":        "1561",
        "nombre_destino":        "Instalaciones eléctricas en redes de agua",
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
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 134,
    },

    # Origen: T. Instalaciones de Producción de Calor (Instalación y Mantenimiento) — módulo específico
    # → 1561. Instalaciones eléctricas en redes de agua
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Redes y Estaciones de Tratamientos de Aguas",
        "codigo_destino":  "1561",
        "nombre_destino":  "Instalaciones eléctricas en redes de agua",
        "origenes": [
            {
                "familia_origen": "Instalación y mantenimiento",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Instalaciones de Producción de Calor",
                "codigo_origen":  "0038",
                "nombre_origen":  "Instalaciones eléctricas y automatismos",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 135,
    },

    # Origen: T. Instalaciones de Producción de Calor (Instalación y Mantenimiento) — módulo específico
    # → 1562. Técnicas de mecanizado y unión
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Redes y Estaciones de Tratamientos de Aguas",
        "codigo_destino":  "1562",
        "nombre_destino":  "Técnicas de mecanizado y unión",
        "origenes": [
            {
                "familia_origen": "Instalación y mantenimiento",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Instalaciones de Producción de Calor",
                "codigo_origen":  "0037",
                "nombre_origen":  "Técnicas de montaje de instalaciones",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 135,
    },

    # Origen: T. Instalaciones Frigoríficas y de Climatización (Instalación y Mantenimiento) — módulo específico
    # → 1561. Instalaciones eléctricas en redes de agua
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Redes y Estaciones de Tratamientos de Aguas",
        "codigo_destino":  "1561",
        "nombre_destino":  "Instalaciones eléctricas en redes de agua",
        "origenes": [
            {
                "familia_origen": "Instalación y mantenimiento",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Instalaciones Frigoríficas y de Climatización",
                "codigo_origen":  "0038",
                "nombre_origen":  "Instalaciones eléctricas y automatismos",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 135,
    },

    # Origen: T. Instalaciones Frigoríficas y de Climatización (Instalación y Mantenimiento) — módulo específico
    # → 1562. Técnicas de mecanizado y unión
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Redes y Estaciones de Tratamientos de Aguas",
        "codigo_destino":  "1562",
        "nombre_destino":  "Técnicas de mecanizado y unión",
        "origenes": [
            {
                "familia_origen": "Instalación y mantenimiento",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Instalaciones Frigoríficas y de Climatización",
                "codigo_origen":  "0037",
                "nombre_origen":  "Técnicas de montaje de instalaciones",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 135,
    },

    # Origen: TS Mantenimiento de Instalaciones Térmicas y de Fluidos (Instalación y Mantenimiento) — módulo específico
    # → 0310. Montaje y mantenimiento de Instalaciones de agua
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Redes y Estaciones de Tratamientos de Aguas",
        "codigo_destino":  "0310",
        "nombre_destino":  "Montaje y mantenimiento de Instalaciones de agua",
        "origenes": [
            {
                "familia_origen": "Instalación y mantenimiento",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Mantenimiento de Instalaciones Térmicas y de Fluidos",
                "codigo_origen":  "0122",
                "nombre_origen":  "Procesos de Montaje de Instalaciones",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 135,
    },

    # Origen: TS Desarrollo de Proyectos de Instalaciones Térmicas y de Fluidos (Inst. y Mant.) — módulo específico
    # → 0310. Montaje y mantenimiento de Instalaciones de agua
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Redes y Estaciones de Tratamientos de Aguas",
        "codigo_destino":  "0310",
        "nombre_destino":  "Montaje y mantenimiento de Instalaciones de agua",
        "origenes": [
            {
                "familia_origen": "Instalación y mantenimiento",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Desarrollo de Proyectos de Instalaciones Térmicas y de Fluidos",
                "codigo_origen":  "0122",
                "nombre_origen":  "Procesos de Montaje de Instalaciones",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 135,
    },

    # Origen: TS Proyectos de Edificación (Edificación y obra civil) — módulo específico
    # → 1559. Replanteo en redes de agua
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Redes y Estaciones de Tratamientos de Aguas",
        "codigo_destino":  "1559",
        "nombre_destino":  "Replanteo en redes de agua",
        "origenes": [
            {
                "familia_origen": "Edificación y obra civil",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Proyectos de Edificación",
                "codigo_origen":  "0568",
                "nombre_origen":  "Instalaciones en edificación",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 135,
    },

    # Origen: T. Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones
    #         (Marítimo Pesquera) — Ciclo Completo
    # → 0310. Montaje y mantenimiento de Instalaciones de agua
    {
        "familia_destino":       "Energía y agua",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Redes y Estaciones de Tratamientos de Aguas",
        "codigo_destino":        "0310",
        "nombre_destino":        "Montaje y mantenimiento de Instalaciones de agua",
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
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 135,
    },

    # Origen: T. Planta química (Química) — módulo específico
    # → 1564. Calidad del agua
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Redes y Estaciones de Tratamientos de Aguas",
        "codigo_destino":  "1564",
        "nombre_destino":  "Calidad del agua",
        "origenes": [
            {
                "familia_origen": "Química",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Planta Química",
                "codigo_origen":  "0115",
                "nombre_origen":  "Tratamientos de aguas",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 135,
    },

    # Origen: TS Mantenimiento de Instalaciones Térmicas y de Fluidos (Instalación y Mant.) — dos módulos específicos
    # → 1566. Mantenimiento de equipos e instalaciones
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Redes y Estaciones de Tratamientos de Aguas",
        "codigo_destino":  "1566",
        "nombre_destino":  "Mantenimiento de equipos e instalaciones",
        "origenes": [
            {
                "familia_origen": "Instalación y mantenimiento",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Mantenimiento de Instalaciones Térmicas y de Fluidos",
                "codigo_origen":  "0133",
                "nombre_origen":  "Gestión del montaje, de la calidad y del mantenimiento",
            },
            {
                "familia_origen": "Instalación y mantenimiento",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Mantenimiento de Instalaciones Térmicas y de Fluidos",
                "codigo_origen":  "0122",
                "nombre_origen":  "Procesos de Montaje de Instalaciones",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 135,
    },

    # ══════════════════════════════════════════════════════════════════
    # GRADO SUPERIOR
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: TS Eficiencia Energética y Energía Solar Térmica (RD 1177/2008)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Proyectos de Edificación (Edificación y Obra Civil) — dos módulos específicos
    # → 0123. Representación gráfica de instalaciones
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Eficiencia Energética y Energía Solar Térmica",
        "codigo_destino":  "0123",
        "nombre_destino":  "Representación gráfica de instalaciones",
        "origenes": [
            {
                "familia_origen": "Edificación y obra civil",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Proyectos de Edificación",
                "codigo_origen":  "0568",
                "nombre_origen":  "Instalaciones en edificación",
            },
            {
                "familia_origen": "Edificación y obra civil",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Proyectos de Edificación",
                "codigo_origen":  "0563",
                "nombre_origen":  "Representaciones de construcción",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 135,
    },

    # Origen: TS Proyectos de Edificación (Edificación y Obra Civil) — módulo específico
    # → 0350. Certificación energética de edificios
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Eficiencia Energética y Energía Solar Térmica",
        "codigo_destino":  "0350",
        "nombre_destino":  "Certificación energética de edificios",
        "origenes": [
            {
                "familia_origen": "Edificación y obra civil",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Proyectos de Edificación",
                "codigo_origen":  "0569",
                "nombre_origen":  "Eficiencia energética en edificación",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 136,
    },

    # DESTINO: TS Gestión del Agua (RD 113/2017)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Eficiencia Energética y Energía Solar Térmica — módulo específico
    # → 1580. Técnicas de montaje en instalaciones de agua
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Gestión del Agua",
        "codigo_destino":  "1580",
        "nombre_destino":  "Técnicas de montaje en instalaciones de agua",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Eficiencia Energética y Energía Solar Térmica",
                "codigo_origen":  "0122",
                "nombre_origen":  "Procesos de montaje de instalaciones",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 136,
    },

    # Origen: TS Automatización y Robótica Industrial (Electricidad y Electrónica) — Ciclo Completo
    # → 1577. Automatismos y telecontrol en instalaciones de agua
    {
        "familia_destino":       "Energía y agua",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Gestión del Agua",
        "codigo_destino":        "1577",
        "nombre_destino":        "Automatismos y telecontrol en instalaciones de agua",
        "origenes": [
            {
                "familia_origen":        "Electricidad y electrónica",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Automatización y Robótica Industrial",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 136,
    },

    # Origen: TS Automatización y Robótica Industrial (Electricidad y Electrónica) — Ciclo Completo
    # → 1576. Sistemas eléctricos en instalaciones de aguas
    {
        "familia_destino":       "Energía y agua",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Gestión del Agua",
        "codigo_destino":        "1576",
        "nombre_destino":        "Sistemas eléctricos en instalaciones de aguas",
        "origenes": [
            {
                "familia_origen":        "Electricidad y electrónica",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Automatización y Robótica Industrial",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 136,
    },

    # Origen: TS Desarrollo de Proyectos de Instalaciones Térmicas y de Fluidos (Inst. y Mant.) — módulo específico
    # → 1580. Técnicas de montaje en instalaciones de agua
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Gestión del Agua",
        "codigo_destino":  "1580",
        "nombre_destino":  "Técnicas de montaje en instalaciones de agua",
        "origenes": [
            {
                "familia_origen": "Instalación y mantenimiento",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Desarrollo de Proyectos de Instalaciones Térmicas y de Fluidos",
                "codigo_origen":  "0122",
                "nombre_origen":  "Procesos de montaje de instalaciones",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 136,
    },

    # Origen: T. Instalaciones Eléctricas y Automáticas (Electricidad y Electrónica) — Ciclo Completo
    # → 1576. Sistemas eléctricos en instalaciones de agua
    {
        "familia_destino":       "Energía y agua",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Gestión del Agua",
        "codigo_destino":        "1576",
        "nombre_destino":        "Sistemas eléctricos en instalaciones de agua",
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
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 136,
    },

    # Origen: TS Mantenimiento de Instalaciones Térmicas y de Fluidos (Inst. y Mant.) — módulo específico
    # → 1580. Técnicas de montaje en instalaciones de agua
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Gestión del Agua",
        "codigo_destino":  "1580",
        "nombre_destino":  "Técnicas de montaje en instalaciones de agua",
        "origenes": [
            {
                "familia_origen": "Instalación y mantenimiento",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Mantenimiento de Instalaciones Térmicas y de Fluidos",
                "codigo_origen":  "0122",
                "nombre_origen":  "Procesos de montaje de instalaciones",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 136,
    },

    # Origen: TS Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones
    #         (Marítimo Pesquera) — módulo específico
    # → 1580. Técnicas de montaje en instalaciones de agua
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Gestión del Agua",
        "codigo_destino":  "1580",
        "nombre_destino":  "Técnicas de montaje en instalaciones de agua",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones",
                "codigo_origen":  "1309",
                "nombre_origen":  "Organización del mantenimiento en seco de buques y embarcaciones y montaje de motores térmicos",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 136,
    },

    # Origen: TS Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones
    #         (Marítimo Pesquera) — módulo específico
    # → 1576. Sistemas eléctricos en instalaciones de agua
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Gestión del Agua",
        "codigo_destino":  "1576",
        "nombre_destino":  "Sistemas eléctricos en instalaciones de agua",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones",
                "codigo_origen":  "1311",
                "nombre_origen":  "Organización del mantenimiento y montaje de instalaciones y sistemas eléctricos de buques y embarcaciones",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 136,
    },

    # Origen: TS Organización y Control de Obras de Construcción (Edificación y obra civil) — dos módulos específicos
    # → 1572. Planificación y replanteo
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Gestión del Agua",
        "codigo_destino":  "1572",
        "nombre_destino":  "Planificación y replanteo",
        "origenes": [
            {
                "familia_origen": "Edificación y obra civil",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Organización y Control de Obras de Construcción",
                "codigo_origen":  "0565",
                "nombre_origen":  "Replanteos de construcción",
            },
            {
                "familia_origen": "Edificación y obra civil",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Organización y Control de Obras de Construcción",
                "codigo_origen":  "0566",
                "nombre_origen":  "Planificación de construcción",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 136,
    },

    # Origen: TS Proyectos de Edificación (Edificación y obra civil) — dos módulos específicos
    # → 1572. Planificación y replanteo
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Gestión del Agua",
        "codigo_destino":  "1572",
        "nombre_destino":  "Planificación y replanteo",
        "origenes": [
            {
                "familia_origen": "Edificación y obra civil",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Proyectos de Edificación",
                "codigo_origen":  "0565",
                "nombre_origen":  "Replanteos de construcción",
            },
            {
                "familia_origen": "Edificación y obra civil",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Proyectos de Edificación",
                "codigo_origen":  "0566",
                "nombre_origen":  "Planificación de construcción",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 136,
    },

    # Origen: TS Proyectos de Obra Civil (Edificación y obra civil) — dos módulos específicos
    # → 1572. Planificación y replanteo
    {
        "familia_destino": "Energía y agua",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Gestión del Agua",
        "codigo_destino":  "1572",
        "nombre_destino":  "Planificación y replanteo",
        "origenes": [
            {
                "familia_origen": "Edificación y obra civil",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Proyectos de Obra Civil",
                "codigo_origen":  "0565",
                "nombre_origen":  "Replanteos de construcción",
            },
            {
                "familia_origen": "Edificación y obra civil",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Proyectos de Obra Civil",
                "codigo_origen":  "0566",
                "nombre_origen":  "Planificación de construcción",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 137,
    },

    # Origen: TS Sistemas Electrotécnicos y Automatizados (Electricidad y Electrónica) — Ciclo Completo
    # → 1576. Sistemas eléctricos en instalaciones de agua
    {
        "familia_destino":       "Energía y agua",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Gestión del Agua",
        "codigo_destino":        "1576",
        "nombre_destino":        "Sistemas eléctricos en instalaciones de agua",
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
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 137,
    },

    # Origen: TS Mecatrónica Industrial (Instalación y mantenimiento) — Ciclo Completo
    # → 1576. Sistemas eléctricos en instalaciones de agua
    {
        "familia_destino":       "Energía y agua",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Gestión del Agua",
        "codigo_destino":        "1576",
        "nombre_destino":        "Sistemas eléctricos en instalaciones de agua",
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
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 137,
    },

]
