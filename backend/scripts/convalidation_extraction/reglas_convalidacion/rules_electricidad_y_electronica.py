"""
rules_electricidad_y_electronica.py
=====================================
Reglas de convalidación cuyo MÓDULO DESTINO pertenece a la familia
"Electricidad y Electrónica".

Fuente: Tabla de convalidaciones entre títulos regulados por la Ley Orgánica 2/2006.
"""

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO MEDIO
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. Instalaciones Eléctricas y Automáticas (RD 177/2008)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Redes y Estaciones de Tratamiento de Aguas (Energía y Agua) — módulo específico
    # → 0232. Automatismos industriales
    {
        "familia_destino": "Electricidad y electrónica",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Instalaciones Eléctricas y Automáticas",
        "codigo_destino":  "0232",
        "nombre_destino":  "Automatismos industriales",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Redes y Estaciones de Tratamientos de Aguas",
                "codigo_origen":  "1561",
                "nombre_origen":  "Instalaciones eléctricas en redes de agua",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 132,
    },

    # Origen: TS Gestión del Agua (Energía y Agua) — dos módulos específicos
    # → 0232. Automatismos industriales
    {
        "familia_destino": "Electricidad y electrónica",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Instalaciones Eléctricas y Automáticas",
        "codigo_destino":  "0232",
        "nombre_destino":  "Automatismos industriales",
        "origenes": [
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Gestión del Agua",
                "codigo_origen":  "1576",
                "nombre_origen":  "Sistemas eléctricos en instalaciones de agua",
            },
            {
                "familia_origen": "Energía y agua",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Gestión del Agua",
                "codigo_origen":  "1577",
                "nombre_origen":  "Automatismos y telecontrol en instalaciones de agua",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 132,
    },

    # Origen: TS Mantenimiento Electrónico (RD 1578/2011) — Ciclo Completo
    # → 0233. Electrónica
    {
        "familia_destino":       "Electricidad y electrónica",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalaciones Eléctricas y Automáticas",
        "codigo_destino":        "0233",
        "nombre_destino":        "Electrónica",
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
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 132,
    },

    # Origen: TS Mantenimiento Electrónico (RD 1578/2011) — Ciclo Completo
    # → 0234. Electrotecnia
    {
        "familia_destino":       "Electricidad y electrónica",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalaciones Eléctricas y Automáticas",
        "codigo_destino":        "0234",
        "nombre_destino":        "Electrotecnia",
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
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 132,
    },

    # DESTINO: T. Instalaciones de Telecomunicaciones (RD 1632/2009)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Instalaciones Eléctricas y Automáticas — dos módulos específicos
    # → 0359. Electrónica aplicada
    {
        "familia_destino": "Electricidad y electrónica",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Instalaciones de Telecomunicaciones",
        "codigo_destino":  "0359",
        "nombre_destino":  "Electrónica aplicada",
        "origenes": [
            {
                "familia_origen": "Electricidad y electrónica",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Instalaciones Eléctricas y Automáticas",
                "codigo_origen":  "0233",
                "nombre_origen":  "Electrónica",
            },
            {
                "familia_origen": "Electricidad y electrónica",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Instalaciones Eléctricas y Automáticas",
                "codigo_origen":  "0234",
                "nombre_origen":  "Electrotecnia",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 132,
    },

    # Origen: T. Instalaciones Eléctricas y Automáticas — tres módulos específicos
    # → 0362. Instalaciones eléctricas básicas
    {
        "familia_destino": "Electricidad y electrónica",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Instalaciones de Telecomunicaciones",
        "codigo_destino":  "0362",
        "nombre_destino":  "Instalaciones eléctricas básicas",
        "origenes": [
            {
                "familia_origen": "Electricidad y electrónica",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Instalaciones Eléctricas y Automáticas",
                "codigo_origen":  "0232",
                "nombre_origen":  "Automatismos industriales",
            },
            {
                "familia_origen": "Electricidad y electrónica",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Instalaciones Eléctricas y Automáticas",
                "codigo_origen":  "0235",
                "nombre_origen":  "Instalaciones eléctricas interiores",
            },
            {
                "familia_origen": "Electricidad y electrónica",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Instalaciones Eléctricas y Automáticas",
                "codigo_origen":  "0240",
                "nombre_origen":  "Máquinas eléctricas",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 132,
    },

    # Origen: TS Mantenimiento Electrónico — Ciclo Completo
    # → 0359. Electrónica aplicada
    {
        "familia_destino":       "Electricidad y electrónica",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalaciones de Telecomunicaciones",
        "codigo_destino":        "0359",
        "nombre_destino":        "Electrónica aplicada",
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
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 133,
    },

    # Origen: TS Mantenimiento Electrónico — Ciclo Completo
    # → 0360. Equipos microinformáticos
    {
        "familia_destino":       "Electricidad y electrónica",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalaciones de Telecomunicaciones",
        "codigo_destino":        "0360",
        "nombre_destino":        "Equipos microinformáticos",
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
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 133,
    },

    # Origen: TS Sistemas Microinformáticos y Redes (Informática y Com.) — Ciclo Completo
    # → 0360. Equipos microinformáticos
    {
        "familia_destino":       "Electricidad y electrónica",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalaciones de Telecomunicaciones",
        "codigo_destino":        "0360",
        "nombre_destino":        "Equipos microinformáticos",
        "origenes": [
            {
                "familia_origen":        "Informática y comunicaciones",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Sistemas Microinformáticos y Redes",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 133,
    },

    # Origen: TS Sistemas Microinformáticos y Redes (Informática y Com.) — Ciclo Completo
    # → 0361. Infraestructuras de redes de datos y sistemas de telefonía
    {
        "familia_destino":       "Electricidad y electrónica",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Instalaciones de Telecomunicaciones",
        "codigo_destino":        "0361",
        "nombre_destino":        "Infraestructuras de redes de datos y sistemas de telefonía",
        "origenes": [
            {
                "familia_origen":        "Informática y comunicaciones",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Sistemas Microinformáticos y Redes",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 133,
    },

    # ══════════════════════════════════════════════════════════════════
    # GRADO SUPERIOR
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: TS Automatización y Robótica Industrial (RD 1581/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Mantenimiento Electrónico — Ciclo Completo
    # → 0963. Documentación técnica
    {
        "familia_destino":       "Electricidad y electrónica",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Automatización y Robótica Industrial",
        "codigo_destino":        "0963",
        "nombre_destino":        "Documentación técnica",
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
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 133,
    },

    # Origen: TS Sistemas Electrotécnicos y Automatizados — módulo específico
    # → 0963. Documentación técnica
    {
        "familia_destino": "Electricidad y electrónica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Automatización y Robótica Industrial",
        "codigo_destino":  "0963",
        "nombre_destino":  "Documentación técnica",
        "origenes": [
            {
                "familia_origen": "Electricidad y electrónica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Sistemas Electrotécnicos y Automatizados",
                "codigo_origen":  "0519",
                "nombre_origen":  "Documentación técnica en instalaciones eléctricas",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 133,
    },

    # Origen: TS Desarrollo de Aplicaciones Multiplataforma (Informática y Com.) — Ciclo Completo
    # → 0964. Informática industrial
    {
        "familia_destino":       "Electricidad y electrónica",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Automatización y Robótica Industrial",
        "codigo_destino":        "0964",
        "nombre_destino":        "Informática industrial",
        "origenes": [
            {
                "familia_origen":        "Informática y comunicaciones",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Desarrollo de Aplicaciones Multiplataforma",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 133,
    },

    # DESTINO: TS Electromedicina Clínica (RD 838/2015)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Automatización y Robótica Industrial — módulo específico
    # → 1586. Sistemas electromecánicos y de fluidos
    {
        "familia_destino": "Electricidad y electrónica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Electromedicina Clínica",
        "codigo_destino":  "1586",
        "nombre_destino":  "Sistemas electromecánicos y de fluidos",
        "origenes": [
            {
                "familia_origen": "Electricidad y electrónica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Automatización y Robótica Industrial",
                "codigo_origen":  "0959",
                "nombre_origen":  "Sistemas eléctricos, neumáticos e hidráulicos",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 133,
    },

    # Origen: TS Mantenimiento Electrónico — dos módulos específicos
    # → 1587. Sistemas electrónicos y fotónicos
    {
        "familia_destino": "Electricidad y electrónica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Electromedicina Clínica",
        "codigo_destino":  "1587",
        "nombre_destino":  "Sistemas electrónicos y fotónicos",
        "origenes": [
            {
                "familia_origen": "Electricidad y electrónica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Mantenimiento Electrónico",
                "codigo_origen":  "1051",
                "nombre_origen":  "Circuitos electrónicos analógicos",
            },
            {
                "familia_origen": "Electricidad y electrónica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Mantenimiento Electrónico",
                "codigo_origen":  "1052",
                "nombre_origen":  "Equipos microprogramables",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 133,
    },

    # Origen: TS Sistemas Electrotécnicos y Automatizados — dos módulos específicos
    # → 1585. Instalaciones eléctricas
    {
        "familia_destino": "Electricidad y electrónica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Electromedicina Clínica",
        "codigo_destino":  "1585",
        "nombre_destino":  "Instalaciones eléctricas",
        "origenes": [
            {
                "familia_origen": "Electricidad y electrónica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Sistemas Electrotécnicos y Automatizados",
                "codigo_origen":  "0524",
                "nombre_origen":  "Configuración de instalaciones eléctricas",
            },
            {
                "familia_origen": "Electricidad y electrónica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Sistemas Electrotécnicos y Automatizados",
                "codigo_origen":  "0602",
                "nombre_origen":  "Gestión del montaje y del mantenimiento de instalaciones",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 133,
    },

    # Origen: TS Desarrollo de Proyectos de Instalaciones Térmicas y de Fluidos
    #         (Instalación y Mantenimiento) — dos módulos específicos
    # → 1585. Instalaciones eléctricas
    {
        "familia_destino": "Electricidad y electrónica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Electromedicina Clínica",
        "codigo_destino":  "1585",
        "nombre_destino":  "Instalaciones eléctricas",
        "origenes": [
            {
                "familia_origen": "Instalación y mantenimiento",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Desarrollo de Proyectos de Instalaciones Térmicas y de Fluidos",
                "codigo_origen":  "0122",
                "nombre_origen":  "Proceso de montaje de instalaciones",
            },
            {
                "familia_origen": "Instalación y mantenimiento",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Desarrollo de Proyectos de Instalaciones Térmicas y de Fluidos",
                "codigo_origen":  "0128",
                "nombre_origen":  "Planificación del montaje de instalaciones",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 133,
    },

    # Origen: TS Mantenimiento de Instalaciones Térmicas y de Fluidos
    #         (Instalación y Mantenimiento) — dos módulos específicos
    # → 1585. Instalaciones eléctricas
    {
        "familia_destino": "Electricidad y electrónica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Electromedicina Clínica",
        "codigo_destino":  "1585",
        "nombre_destino":  "Instalaciones eléctricas",
        "origenes": [
            {
                "familia_origen": "Instalación y mantenimiento",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Mantenimiento de Instalaciones Térmicas y de Fluidos",
                "codigo_origen":  "0120",
                "nombre_origen":  "Sistemas eléctricos y automáticos",
            },
            {
                "familia_origen": "Instalación y mantenimiento",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Mantenimiento de Instalaciones Térmicas y de Fluidos",
                "codigo_origen":  "0122",
                "nombre_origen":  "Proceso de montaje de instalaciones",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 133,
    },

    # DESTINO: TS Sistemas Electrotécnicos y Automatizados (RD 1127/2010)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Automatización y Robótica Industrial — módulo específico
    # → 0519. Documentación técnica en instalaciones eléctricas
    {
        "familia_destino": "Electricidad y electrónica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Sistemas Electrotécnicos y Automatizados",
        "codigo_destino":  "0519",
        "nombre_destino":  "Documentación técnica en instalaciones eléctricas",
        "origenes": [
            {
                "familia_origen": "Electricidad y electrónica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Automatización y Robótica Industrial",
                "codigo_origen":  "0963",
                "nombre_origen":  "Documentación técnica",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 134,
    },

    # Origen: TS Mantenimiento Electrónico — Ciclo Completo
    # → 0519. Documentación técnica en instalaciones eléctricas
    {
        "familia_destino":       "Electricidad y electrónica",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Sistemas Electrotécnicos y Automatizados",
        "codigo_destino":        "0519",
        "nombre_destino":        "Documentación técnica en instalaciones eléctricas",
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
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 134,
    },

    # Origen: TS Sistemas de Telecomunicaciones e Informáticos — dos módulos específicos
    # → 0517. Procesos en instalaciones de infraestructuras comunes de telecomunicaciones
    {
        "familia_destino": "Electricidad y electrónica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Sistemas Electrotécnicos y Automatizados",
        "codigo_destino":  "0517",
        "nombre_destino":  "Procesos en instalaciones de infraestructuras comunes de telecomunicaciones",
        "origenes": [
            {
                "familia_origen": "Electricidad y electrónica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Sistemas de Telecomunicaciones e Informáticos",
                "codigo_origen":  "0525",
                "nombre_origen":  "Configuración de infraestructuras de sistemas de telecomunicaciones",
            },
            {
                "familia_origen": "Electricidad y electrónica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Sistemas de Telecomunicaciones e Informáticos",
                "codigo_origen":  "0553",
                "nombre_origen":  "Técnicas y procesos en infraestructuras de telecomunicaciones",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 134,
    },

    # DESTINO: TS Sistemas de Telecomunicación e Informáticos (RD 883/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Administración de Sistemas Informáticos en Red (Informática y Com.) — Ciclo Completo
    # → 0552. Sistemas informáticos y redes locales
    {
        "familia_destino":       "Electricidad y electrónica",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Sistemas de Telecomunicaciones e Informáticos",
        "codigo_destino":        "0552",
        "nombre_destino":        "Sistemas informáticos y redes locales",
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
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 134,
    },

    # DESTINO: TS Electromedicina Clínica — adicional
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Mecatrónica Industrial (Instalación y Mantenimiento) — módulo específico
    # → 1586. Sistemas electromecánicos y de fluidos
    {
        "familia_destino": "Electricidad y electrónica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Electromedicina Clínica",
        "codigo_destino":  "1586",
        "nombre_destino":  "Sistemas electromecánicos y de fluidos",
        "origenes": [
            {
                "familia_origen": "Instalación y mantenimiento",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Mecatrónica Industrial",
                "codigo_origen":  "0936",
                "nombre_origen":  "Sistemas Hidráulicos y Neumáticos",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 134,
    },

]
