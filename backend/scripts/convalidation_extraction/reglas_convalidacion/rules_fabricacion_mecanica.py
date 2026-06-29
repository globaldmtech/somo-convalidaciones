# rules_fabricacion_mecanica.py
# Reglas de convalidación para la familia: Fabricación Mecánica

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO MEDIO
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. Conformado por Moldeo de Metales y Polímeros (RD 387/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Construcciones Metálicas (Fabricación mecánica) — módulo específico
    # → 0007. Interpretación gráfica
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Conformado por Moldeo de Metales y Polímeros",
        "codigo_destino":  "0007",
        "nombre_destino":  "Interpretación gráfica",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Construcciones Metálicas",
                "codigo_origen":  "0245",
                "nombre_origen":  "Representación gráfica en fabricación mecánica",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 137,
    },

    # Origen: TS Diseño en Fabricación Mecánica (Fabricación mecánica) — módulo específico
    # → 0007. Interpretación gráfica
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Conformado por Moldeo de Metales y Polímeros",
        "codigo_destino":  "0007",
        "nombre_destino":  "Interpretación gráfica",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Diseño en Fabricación Mecánica",
                "codigo_origen":  "0245",
                "nombre_origen":  "Representación gráfica en fabricación mecánica",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 137,
    },

    # Origen: T. Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones
    #         (Marítimo pesquera) — módulo específico
    # → 0722. Preparación de máquinas e instalaciones de procesos automáticos
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Conformado por Moldeo de Metales y Polímeros",
        "codigo_destino":  "0722",
        "nombre_destino":  "Preparación de máquinas e instalaciones de procesos automáticos",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones",
                "codigo_origen":  "1174",
                "nombre_origen":  "Regulación y mantenimiento de automatismos en buques y embarcaciones",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 137,
    },

    # DESTINO: T. Mecanizado (RD 1398/2007)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Conformado por Moldeo de Metales y Polímeros (Fabricación mecánica) — módulo específico
    # → 0005. Sistemas automatizados
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Mecanizado",
        "codigo_destino":  "0005",
        "nombre_destino":  "Sistemas automatizados",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Conformado por Moldeo de Metales y Polímeros",
                "codigo_origen":  "0722",
                "nombre_origen":  "Preparación de máquinas e instalaciones de procesos automatizados",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 137,
    },

    # Origen: TS Construcciones Metálicas (Fabricación mecánica) — módulo específico
    # → 0005. Sistemas automatizados
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Mecanizado",
        "codigo_destino":  "0005",
        "nombre_destino":  "Sistemas automatizados",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Construcciones Metálicas",
                "codigo_origen":  "0162",
                "nombre_origen":  "Programación de sistemas automáticos de fabricación mecánica",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 137,
    },

    # Origen: TS Construcciones Metálicas (Fabricación mecánica) — módulo específico
    # → 0007. Interpretación gráfica
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Mecanizado",
        "codigo_destino":  "0007",
        "nombre_destino":  "Interpretación gráfica",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Construcciones Metálicas",
                "codigo_origen":  "0245",
                "nombre_origen":  "Representación gráfica en fabricación mecánica",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 137,
    },

    # Origen: TS Diseño en Fabricación Mecánica (Fabricación mecánica) — módulo específico
    # → 0007. Interpretación gráfica
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Mecanizado",
        "codigo_destino":  "0007",
        "nombre_destino":  "Interpretación gráfica",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Diseño en Fabricación Mecánica",
                "codigo_origen":  "0245",
                "nombre_origen":  "Representación gráfica en fabricación mecánica",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 138,
    },

    # Origen: TS Programación de la Producción en Fabricación Mecánica — módulo específico
    # → 0005. Sistemas automatizados
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Mecanizado",
        "codigo_destino":  "0005",
        "nombre_destino":  "Sistemas automatizados",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Programación de la Producción en Fabricación Mecánica",
                "codigo_origen":  "0162",
                "nombre_origen":  "Programación de sistemas automáticos de fabricación mecánica",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 138,
    },

    # Origen: TS Programación de la Producción en Moldeo de Metales y Polímeros — módulo específico
    # → 0005. Sistemas automatizados
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Mecanizado",
        "codigo_destino":  "0005",
        "nombre_destino":  "Sistemas automatizados",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Programación de la Producción en Moldeo de Metales y Polímeros",
                "codigo_origen":  "0162",
                "nombre_origen":  "Programación de sistemas automáticos de fabricación mecánica",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 138,
    },

    # DESTINO: T. Soldadura y Calderería (RD 1692/2007)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Construcciones Metálicas (Fabricación mecánica) — módulo específico
    # → 0007. Interpretación gráfica
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Soldadura y Calderería",
        "codigo_destino":  "0007",
        "nombre_destino":  "Interpretación gráfica",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Construcciones Metálicas",
                "codigo_origen":  "0245",
                "nombre_origen":  "Representación gráfica en fabricación mecánica",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 138,
    },

    # Origen: T. Mecanizado (Fabricación mecánica) — Ciclo Completo
    # → 0092. Mecanizado
    {
        "familia_destino":       "Fabricación mecánica",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Soldadura y Calderería",
        "codigo_destino":        "0092",
        "nombre_destino":        "Mecanizado",
        "origenes": [
            {
                "familia_origen":        "Fabricación mecánica",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Mecanizado",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 138,
    },

    # Origen: TS Diseño en Fabricación Mecánica (Fabricación mecánica) — módulo específico
    # → 0007. Interpretación gráfica
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Soldadura y Calderería",
        "codigo_destino":  "0007",
        "nombre_destino":  "Interpretación gráfica",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Diseño en Fabricación Mecánica",
                "codigo_origen":  "0245",
                "nombre_origen":  "Representación gráfica en fabricación mecánica",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 138,
    },

    # ══════════════════════════════════════════════════════════════════
    # GRADO SUPERIOR
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: TS Construcciones Metálicas (RD 174/2008)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones
    #         (Marítimo pesquera) — módulo específico
    # → 0162. Programación de sistemas automáticos de fabricación mecánica
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Construcciones Metálicas",
        "codigo_destino":  "0162",
        "nombre_destino":  "Programación de sistemas automáticos de fabricación mecánica",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones",
                "codigo_origen":  "1310",
                "nombre_origen":  "Programación y mantenimiento de automatismos hidráulicos y neumáticos en buques y embarcaciones",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 138,
    },

    # Origen: TS Patronaje y Moda (Textil, confección y piel) — módulo específico
    # → 0163. Programación de la producción
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Construcciones Metálicas",
        "codigo_destino":  "0163",
        "nombre_destino":  "Programación de la producción",
        "origenes": [
            {
                "familia_origen": "Textil, confección y piel",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Patronaje y Moda",
                "codigo_origen":  "0280",
                "nombre_origen":  "Organización de la producción en confección textil",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 138,
    },

    # DESTINO: TS Programación de la Producción en Fabricación Mecánica (RD 1687/2007)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Construcciones Metálicas (Fabricación mecánica) — módulo específico
    # → 0007. Interpretación gráfica
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Programación de la Producción en Fabricación Mecánica",
        "codigo_destino":  "0007",
        "nombre_destino":  "Interpretación gráfica",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Construcciones Metálicas",
                "codigo_origen":  "0245",
                "nombre_origen":  "Representación gráfica en fabricación mecánica",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 138,
    },

    # Origen: TS Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones
    #         (Marítimo pesquera) — módulo específico
    # → 0162. Programación de sistemas automáticos de fabricación mecánica
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Programación de la Producción en Fabricación Mecánica",
        "codigo_destino":  "0162",
        "nombre_destino":  "Programación de sistemas automáticos de fabricación mecánica",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones",
                "codigo_origen":  "1310",
                "nombre_origen":  "Programación y mantenimiento de automatismos hidráulicos y neumáticos en buques y embarcaciones",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 138,
    },

    # Origen: TS Patronaje y Moda (Textil, confección y piel) — módulo específico
    # → 0163. Programación de la producción
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Programación de la Producción en Fabricación Mecánica",
        "codigo_destino":  "0163",
        "nombre_destino":  "Programación de la producción",
        "origenes": [
            {
                "familia_origen": "Textil, confección y piel",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Patronaje y Moda",
                "codigo_origen":  "0280",
                "nombre_origen":  "Organización de la producción en confección textil",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 139,
    },

    # Origen: TS Diseño en Fabricación Mecánica (Fabricación mecánica) — módulo específico
    # → 0007. Interpretación gráfica
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Programación de la Producción en Fabricación Mecánica",
        "codigo_destino":  "0007",
        "nombre_destino":  "Interpretación gráfica",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Diseño en Fabricación Mecánica",
                "codigo_origen":  "0245",
                "nombre_origen":  "Representación gráfica en fabricación mecánica",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 139,
    },

    # DESTINO: TS Programación de la Producción en Moldeo de Metales y Polímeros (RD 882/2011)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Construcciones Metálicas (Fabricación mecánica) — módulo específico
    # → 0007. Interpretación gráfica
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Programación de la Producción en Moldeo de Metales y Polímeros",
        "codigo_destino":  "0007",
        "nombre_destino":  "Interpretación gráfica",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Construcciones Metálicas",
                "codigo_origen":  "0245",
                "nombre_origen":  "Representación gráfica en fabricación mecánica",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 139,
    },

    # Origen: TS Diseño en Fabricación Mecánica (Fabricación mecánica) — módulo específico
    # → 0007. Interpretación gráfica
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Programación de la Producción en Moldeo de Metales y Polímeros",
        "codigo_destino":  "0007",
        "nombre_destino":  "Interpretación gráfica",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Diseño en Fabricación Mecánica",
                "codigo_origen":  "0245",
                "nombre_origen":  "Representación gráfica en fabricación mecánica",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 139,
    },

    # Origen: TS Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones
    #         (Marítimo pesquera) — módulo específico
    # → 0162. Programación de sistemas automáticos de fabricación mecánica
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Programación de la Producción en Moldeo de Metales y Polímeros",
        "codigo_destino":  "0162",
        "nombre_destino":  "Programación de sistemas automáticos de fabricación mecánica",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Organización del Mantenimiento de Maquinaria de Buques y Embarcaciones",
                "codigo_origen":  "1310",
                "nombre_origen":  "Programación y mantenimiento de automatismos hidráulicos y neumáticos en buques y embarcaciones",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 139,
    },

    # Origen: TS Patronaje y Moda (Textil, confección y piel) — módulo específico
    # → 0163. Programación de la producción
    {
        "familia_destino": "Fabricación mecánica",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Programación de la Producción en Moldeo de Metales y Polímeros",
        "codigo_destino":  "0163",
        "nombre_destino":  "Programación de la producción",
        "origenes": [
            {
                "familia_origen": "Textil, confección y piel",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Patronaje y Moda",
                "codigo_origen":  "0280",
                "nombre_origen":  "Organización de la producción en confección textil",
            },
        ],
        "source_link": "https://www.boe.es/boe/dias/2020/12/30/pdfs/BOE-A-2020-17274.pdf",
        "source_page": 139,
    },

]
