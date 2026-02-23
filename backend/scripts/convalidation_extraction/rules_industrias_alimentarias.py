# rules_industrias_alimentarias.py
# Reglas de convalidación para la familia: Industrias Alimentarias

CONVALIDACIONES: list[dict] = [

    # ══════════════════════════════════════════════════════════════════
    # GRADO MEDIO
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: T. Aceites de Oliva y Vinos (RD 1798/2008)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Panadería, Repostería y Confitería — módulo específico
    # → 0146. Venta y comercialización de productos alimentarios
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Aceites de Oliva y Vinos",
        "codigo_destino":  "0146",
        "nombre_destino":  "Venta y comercialización de productos alimentarios",
        "origenes": [
            {
                "familia_origen": "Industrias alimentarias",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Panadería, Repostería y Confitería",
                "codigo_origen":  "0032",
                "nombre_origen":  "Presentación y venta de productos de panadería y pastelería",
            },
        ],
        "source_link": None,
        "source_page": 124855,
    },

    # Origen: T. Actividades Comerciales (Comercio y Marketing) — módulo específico
    # → 0030. Operaciones y control de almacén en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Aceites de Oliva y Vinos",
        "codigo_destino":  "0030",
        "nombre_destino":  "Operaciones y control de almacén en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Comercio y marketing",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Actividades Comerciales",
                "codigo_origen":  "1228",
                "nombre_origen":  "Técnicas de almacén",
            },
        ],
        "source_link": None,
        "source_page": 124855,
    },

    # Origen: T. Actividades Comerciales (Comercio y Marketing) — Ciclo Completo
    # → 0146. Venta y comercialización de productos alimentarios
    {
        "familia_destino":       "Industrias alimentarias",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Aceites de Oliva y Vinos",
        "codigo_destino":        "0146",
        "nombre_destino":        "Venta y comercialización de productos alimentarios",
        "origenes": [
            {
                "familia_origen":        "Comercio y marketing",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Actividades Comerciales",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124856,
    },

    # Origen: T. Carpintería y Mueble (Madera, mueble y corcho) — módulo específico
    # → 0030. Operaciones y control de almacén en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Aceites de Oliva y Vinos",
        "codigo_destino":  "0030",
        "nombre_destino":  "Operaciones y control de almacén en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Madera, mueble y corcho",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Carpintería y Mueble",
                "codigo_origen":  "0542",
                "nombre_origen":  "Control de almacén",
            },
        ],
        "source_link": None,
        "source_page": 124856,
    },

    # Origen: T. Conducción de Vehículos de Transporte por Carretera — módulo específico
    # → 0030. Operaciones y control de almacén en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Aceites de Oliva y Vinos",
        "codigo_destino":  "0030",
        "nombre_destino":  "Operaciones y control de almacén en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Transporte y mantenimiento de vehículos",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Conducción de Vehículos de Transporte por Carretera",
                "codigo_origen":  "1209",
                "nombre_origen":  "Operaciones de Almacenaje",
            },
        ],
        "source_link": None,
        "source_page": 124856,
    },

    # Origen: T. Instalación y Amueblamiento (Madera, mueble y corcho) — módulo específico
    # → 0030. Operaciones y control de almacén en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Aceites de Oliva y Vinos",
        "codigo_destino":  "0030",
        "nombre_destino":  "Operaciones y control de almacén en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Madera, mueble y corcho",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Instalación y Amueblamiento",
                "codigo_origen":  "0542",
                "nombre_origen":  "Control de almacén",
            },
        ],
        "source_link": None,
        "source_page": 124856,
    },

    # Origen: T. Mantenimiento Electromecánico (Instalación y Mantenimiento) — Ciclo Completo
    # → 0116. Principios de mantenimiento electromecánico
    {
        "familia_destino":       "Industrias alimentarias",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Aceites de Oliva y Vinos",
        "codigo_destino":        "0116",
        "nombre_destino":        "Principios de mantenimiento electromecánico",
        "origenes": [
            {
                "familia_origen":        "Instalación y mantenimiento",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Mantenimiento Electromecánico",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124856,
    },

    # Origen: T. Mantenimiento de Material Rodante Ferroviario — Ciclo Completo
    # → 0116. Principios de mantenimiento electromecánico
    {
        "familia_destino":       "Industrias alimentarias",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Aceites de Oliva y Vinos",
        "codigo_destino":        "0116",
        "nombre_destino":        "Principios de mantenimiento electromecánico",
        "origenes": [
            {
                "familia_origen":        "Transporte y mantenimiento de vehículos",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Mantenimiento de Material Rodante Ferroviario",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124856,
    },

    # DESTINO: T. Elaboración de Productos Alimenticios (RD 452/2010)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Panadería, Repostería y Confitería — módulo específico
    # → 0146. Venta y comercialización de productos alimentarios
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Elaboración de Productos Alimenticios",
        "codigo_destino":  "0146",
        "nombre_destino":  "Venta y comercialización de productos alimentarios",
        "origenes": [
            {
                "familia_origen": "Industrias alimentarias",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Panadería, Repostería y Confitería",
                "codigo_origen":  "0032",
                "nombre_origen":  "Presentación y venta de productos de panadería y pastelería",
            },
        ],
        "source_link": None,
        "source_page": 124856,
    },

    # Origen: T. Actividades Comerciales (Comercio y Marketing) — módulo específico
    # → 0030. Operaciones y control de almacén en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Elaboración de Productos Alimenticios",
        "codigo_destino":  "0030",
        "nombre_destino":  "Operaciones y control de almacén en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Comercio y marketing",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Actividades Comerciales",
                "codigo_origen":  "1228",
                "nombre_origen":  "Técnicas de almacén",
            },
        ],
        "source_link": None,
        "source_page": 124856,
    },

    # Origen: T. Actividades Comerciales (Comercio y Marketing) — Ciclo Completo
    # → 0146. Venta y comercialización de productos alimentarios
    {
        "familia_destino":       "Industrias alimentarias",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Elaboración de Productos Alimenticios",
        "codigo_destino":        "0146",
        "nombre_destino":        "Venta y comercialización de productos alimentarios",
        "origenes": [
            {
                "familia_origen":        "Comercio y marketing",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Actividades Comerciales",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124856,
    },

    # Origen: T. Carpintería y Mueble (Madera, mueble y corcho) — módulo específico
    # → 0030. Operaciones y control de almacén en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Elaboración de Productos Alimenticios",
        "codigo_destino":  "0030",
        "nombre_destino":  "Operaciones y control de almacén en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Madera, mueble y corcho",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Carpintería y Mueble",
                "codigo_origen":  "0542",
                "nombre_origen":  "Control de almacén",
            },
        ],
        "source_link": None,
        "source_page": 124856,
    },

    # Origen: T. Conducción de Vehículos de Transporte por Carretera — módulo específico
    # → 0030. Operaciones y control de almacén en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Elaboración de Productos Alimenticios",
        "codigo_destino":  "0030",
        "nombre_destino":  "Operaciones y control de almacén en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Transporte y mantenimiento de vehículos",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Conducción de Vehículos de Transporte por Carretera",
                "codigo_origen":  "1209",
                "nombre_origen":  "Operaciones de Almacenaje",
            },
        ],
        "source_link": None,
        "source_page": 124857,
    },

    # Origen: T. Instalación y Amueblamiento (Madera, mueble y corcho) — módulo específico
    # → 0030. Operaciones y control de almacén en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Elaboración de Productos Alimenticios",
        "codigo_destino":  "0030",
        "nombre_destino":  "Operaciones y control de almacén en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Madera, mueble y corcho",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Instalación y Amueblamiento",
                "codigo_origen":  "0542",
                "nombre_origen":  "Control de almacén",
            },
        ],
        "source_link": None,
        "source_page": 124857,
    },

    # Origen: T. Mantenimiento Electromecánico (Instalación y Mantenimiento) — Ciclo Completo
    # → 0116. Principios de mantenimiento electromecánico
    {
        "familia_destino":       "Industrias alimentarias",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Elaboración de Productos Alimenticios",
        "codigo_destino":        "0116",
        "nombre_destino":        "Principios de mantenimiento electromecánico",
        "origenes": [
            {
                "familia_origen":        "Instalación y mantenimiento",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Mantenimiento Electromecánico",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124857,
    },

    # Origen: T. Mantenimiento de Material Rodante Ferroviario — Ciclo Completo
    # → 0116. Principios de mantenimiento electromecánico
    {
        "familia_destino":       "Industrias alimentarias",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Elaboración de Productos Alimenticios",
        "codigo_destino":        "0116",
        "nombre_destino":        "Principios de mantenimiento electromecánico",
        "origenes": [
            {
                "familia_origen":        "Transporte y mantenimiento de vehículos",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Mantenimiento de Material Rodante Ferroviario",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124857,
    },

    # DESTINO: T. Panadería, Repostería y Confitería (RD 1399/2007)
    # ─────────────────────────────────────────────────────────────────

    # Origen: T. Aceites de Oliva y Vinos — módulo específico
    # → 0032. Presentación y venta de productos de panadería y pastelería
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Panadería, Repostería y Confitería",
        "codigo_destino":  "0032",
        "nombre_destino":  "Presentación y venta de productos de panadería y pastelería",
        "origenes": [
            {
                "familia_origen": "Industrias alimentarias",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Aceites de Oliva y Vinos",
                "codigo_origen":  "0146",
                "nombre_origen":  "Venta y comercialización de productos alimentarios",
            },
        ],
        "source_link": None,
        "source_page": 124857,
    },

    # Origen: T. Elaboración de Productos Alimenticios — módulo específico
    # → 0032. Presentación y venta de productos de panadería y pastelería
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Panadería, Repostería y Confitería",
        "codigo_destino":  "0032",
        "nombre_destino":  "Presentación y venta de productos de panadería y pastelería",
        "origenes": [
            {
                "familia_origen": "Industrias alimentarias",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Elaboración de Productos Alimenticios",
                "codigo_origen":  "0146",
                "nombre_origen":  "Venta y comercialización de productos alimentarios",
            },
        ],
        "source_link": None,
        "source_page": 124857,
    },

    # Origen: T. Actividades Comerciales (Comercio y Marketing) — módulo específico
    # → 0030. Operaciones y control de almacén en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Panadería, Repostería y Confitería",
        "codigo_destino":  "0030",
        "nombre_destino":  "Operaciones y control de almacén en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Comercio y marketing",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Actividades Comerciales",
                "codigo_origen":  "1228",
                "nombre_origen":  "Técnicas de almacén",
            },
        ],
        "source_link": None,
        "source_page": 124857,
    },

    # Origen: T. Actividades Comerciales (Comercio y Marketing) — Ciclo Completo
    # → 0032. Presentación y venta de productos de panadería y pastelería
    {
        "familia_destino":       "Industrias alimentarias",
        "grado_destino":         "Grado Medio",
        "ciclo_destino":         "Panadería, Repostería y Confitería",
        "codigo_destino":        "0032",
        "nombre_destino":        "Presentación y venta de productos de panadería y pastelería",
        "origenes": [
            {
                "familia_origen":        "Comercio y marketing",
                "grado_origen":          "Grado Medio",
                "ciclo_origen":          "Actividades Comerciales",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124857,
    },

    # Origen: T. Carpintería y Mueble (Madera, mueble y corcho) — módulo específico
    # → 0030. Operaciones y control de almacén en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Panadería, Repostería y Confitería",
        "codigo_destino":  "0030",
        "nombre_destino":  "Operaciones y control de almacén en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Madera, mueble y corcho",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Carpintería y Mueble",
                "codigo_origen":  "0542",
                "nombre_origen":  "Control de almacén",
            },
        ],
        "source_link": None,
        "source_page": 124857,
    },

    # Origen: T. Conducción de Vehículos de Transporte por Carretera — módulo específico
    # → 0030. Operaciones y control de almacén en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Panadería, Repostería y Confitería",
        "codigo_destino":  "0030",
        "nombre_destino":  "Operaciones y control de almacén en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Transporte y mantenimiento de vehículos",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Conducción de Vehículos de Transporte por Carretera",
                "codigo_origen":  "1209",
                "nombre_origen":  "Operaciones de Almacenaje",
            },
        ],
        "source_link": None,
        "source_page": 124857,
    },

    # Origen: T. Instalación y Amueblamiento (Madera, mueble y corcho) — módulo específico
    # → 0030. Operaciones y control de almacén en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Medio",
        "ciclo_destino":   "Panadería, Repostería y Confitería",
        "codigo_destino":  "0030",
        "nombre_destino":  "Operaciones y control de almacén en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Madera, mueble y corcho",
                "grado_origen":   "Grado Medio",
                "ciclo_origen":   "Instalación y Amueblamiento",
                "codigo_origen":  "0542",
                "nombre_origen":  "Control de almacén",
            },
        ],
        "source_link": None,
        "source_page": 124857,
    },

    # ══════════════════════════════════════════════════════════════════
    # GRADO SUPERIOR
    # ══════════════════════════════════════════════════════════════════

    # DESTINO: TS Procesos y Calidad en la Industria Alimentaria (RD 451/2010)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Acuicultura (Marítimo pesquera) — módulo específico
    # → 0086. Gestión de calidad y ambiental en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Procesos y Calidad en la Industria Alimentaria",
        "codigo_destino":  "0086",
        "nombre_destino":  "Gestión de calidad y ambiental en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Acuicultura",
                "codigo_origen":  "1021",
                "nombre_origen":  "Gestión medioambiental de los procesos acuícolas",
            },
        ],
        "source_link": None,
        "source_page": 124858,
    },

    # Origen: TS Construcciones Metálicas (Fabricación mecánica) — módulo específico
    # → 0086. Gestión de calidad y ambiental en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Procesos y Calidad en la Industria Alimentaria",
        "codigo_destino":  "0086",
        "nombre_destino":  "Gestión de calidad y ambiental en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Construcciones Metálicas",
                "codigo_origen":  "0165",
                "nombre_origen":  "Gestión de la calidad, prevención de riesgos laborales y protección ambiental",
            },
        ],
        "source_link": None,
        "source_page": 124858,
    },

    # Origen: TS Desarrollo y Fabricación de Productos Cerámicos (Vidrio y cerámica) — módulo específico
    # → 0086. Gestión de calidad y ambiental en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Procesos y Calidad en la Industria Alimentaria",
        "codigo_destino":  "0086",
        "nombre_destino":  "Gestión de calidad y ambiental en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Vidrio y cerámica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Desarrollo y Fabricación de Productos Cerámicos",
                "codigo_origen":  "0165",
                "nombre_origen":  "Gestión de la calidad, prevención de riesgos laborales y protección ambiental",
            },
        ],
        "source_link": None,
        "source_page": 124858,
    },

    # Origen: TS Diseño y Producción de Calzado y Complementos (Textil, confección y piel) — módulo específico
    # → 0086. Gestión de calidad y ambiental en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Procesos y Calidad en la Industria Alimentaria",
        "codigo_destino":  "0086",
        "nombre_destino":  "Gestión de calidad y ambiental en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Textil, confección y piel",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Diseño y Producción de Calzado y Complementos",
                "codigo_origen":  "0165",
                "nombre_origen":  "Gestión de la calidad, prevención de riesgos laborales y protección ambiental",
            },
        ],
        "source_link": None,
        "source_page": 124858,
    },

    # Origen: TS Gestión de Ventas y Espacios Comerciales (Comercio y Marketing) — Ciclo Completo
    # → 0084. Comercialización y logística en la industria alimentaria
    {
        "familia_destino":       "Industrias alimentarias",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Procesos y Calidad en la Industria Alimentaria",
        "codigo_destino":        "0084",
        "nombre_destino":        "Comercialización y logística en la industria alimentaria",
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
        "source_page": 124858,
    },

    # Origen: TS Laboratorio de Análisis y de Control de Calidad (Química) — Ciclo Completo
    # → 0464. Análisis de alimentos
    {
        "familia_destino":       "Industrias alimentarias",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Procesos y Calidad en la Industria Alimentaria",
        "codigo_destino":        "0464",
        "nombre_destino":        "Análisis de alimentos",
        "origenes": [
            {
                "familia_origen":        "Química",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Laboratorio de Análisis y de Control de Calidad",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124858,
    },

    # Origen: TS Mantenimiento de Instalaciones Térmicas y de Fluidos — Ciclo Completo
    # → 0191. Mantenimiento electromecánico en industrias de proceso
    {
        "familia_destino":       "Industrias alimentarias",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Procesos y Calidad en la Industria Alimentaria",
        "codigo_destino":        "0191",
        "nombre_destino":        "Mantenimiento electromecánico en industrias de proceso",
        "origenes": [
            {
                "familia_origen":        "Instalación y mantenimiento",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Mantenimiento de Instalaciones Térmicas y de Fluidos",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124858,
    },

    # Origen: TS Patronaje y Moda (Textil, confección y piel) — módulo específico
    # → 0086. Gestión de calidad y ambiental en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Procesos y Calidad en la Industria Alimentaria",
        "codigo_destino":  "0086",
        "nombre_destino":  "Gestión de calidad y ambiental en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Textil, confección y piel",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Patronaje y Moda",
                "codigo_origen":  "0165",
                "nombre_origen":  "Gestión de la calidad, prevención de riesgos laborales y protección ambiental",
            },
        ],
        "source_link": None,
        "source_page": 124858,
    },

    # Origen: TS Programación de la Producción en Fabricación Mecánica — módulo específico
    # → 0086. Gestión de calidad y ambiental en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Procesos y Calidad en la Industria Alimentaria",
        "codigo_destino":  "0086",
        "nombre_destino":  "Gestión de calidad y ambiental en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Programación de la Producción en Fabricación Mecánica",
                "codigo_origen":  "0165",
                "nombre_origen":  "Gestión de la calidad, prevención de riesgos laborales y protección ambiental",
            },
        ],
        "source_link": None,
        "source_page": 124858,
    },

    # Origen: TS Programación de la Producción en Moldeo de Metales y Polímeros — módulo específico
    # → 0086. Gestión de calidad y ambiental en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Procesos y Calidad en la Industria Alimentaria",
        "codigo_destino":  "0086",
        "nombre_destino":  "Gestión de calidad y ambiental en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Programación de la Producción en Moldeo de Metales y Polímeros",
                "codigo_origen":  "0165",
                "nombre_origen":  "Gestión de la calidad, prevención de riesgos laborales y protección ambiental",
            },
        ],
        "source_link": None,
        "source_page": 124859,
    },

    # Origen: TS Transporte y Logística (Comercio y Marketing) — Ciclo Completo
    # → 0084. Comercialización y logística en la industria alimentaria
    {
        "familia_destino":       "Industrias alimentarias",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Procesos y Calidad en la Industria Alimentaria",
        "codigo_destino":        "0084",
        "nombre_destino":        "Comercialización y logística en la industria alimentaria",
        "origenes": [
            {
                "familia_origen":        "Comercio y marketing",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Transporte y Logística",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124859,
    },

    # DESTINO: TS Vitivinicultura (RD 1688/2007)
    # ─────────────────────────────────────────────────────────────────

    # Origen: TS Acuicultura (Marítimo pesquera) — módulo específico
    # → 0086. Gestión de calidad y ambiental en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Vitivinicultura",
        "codigo_destino":  "0086",
        "nombre_destino":  "Gestión de calidad y ambiental en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Marítimo pesquera",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Acuicultura",
                "codigo_origen":  "1021",
                "nombre_origen":  "Gestión medioambiental de los procesos acuícolas",
            },
        ],
        "source_link": None,
        "source_page": 124859,
    },

    # Origen: TS Construcciones Metálicas (Fabricación mecánica) — módulo específico
    # → 0086. Gestión de calidad y ambiental en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Vitivinicultura",
        "codigo_destino":  "0086",
        "nombre_destino":  "Gestión de calidad y ambiental en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Construcciones Metálicas",
                "codigo_origen":  "0165",
                "nombre_origen":  "Gestión de la calidad, prevención de riesgos laborales y protección ambiental",
            },
        ],
        "source_link": None,
        "source_page": 124859,
    },

    # Origen: TS Desarrollo y Fabricación de Productos Cerámicos (Vidrio y cerámica) — módulo específico
    # → 0086. Gestión de calidad y ambiental en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Vitivinicultura",
        "codigo_destino":  "0086",
        "nombre_destino":  "Gestión de calidad y ambiental en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Vidrio y cerámica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Desarrollo y Fabricación de Productos Cerámicos",
                "codigo_origen":  "0165",
                "nombre_origen":  "Gestión de la calidad, prevención de riesgos laborales y protección ambiental",
            },
        ],
        "source_link": None,
        "source_page": 124859,
    },

    # Origen: TS Diseño y Producción de Calzado y Complementos (Textil, confección y piel) — módulo específico
    # → 0086. Gestión de calidad y ambiental en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Vitivinicultura",
        "codigo_destino":  "0086",
        "nombre_destino":  "Gestión de calidad y ambiental en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Textil, confección y piel",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Diseño y Producción de Calzado y Complementos",
                "codigo_origen":  "0165",
                "nombre_origen":  "Gestión de la calidad, prevención de riesgos laborales y protección ambiental",
            },
        ],
        "source_link": None,
        "source_page": 124859,
    },

    # Origen: TS Gestión de Ventas y Espacios Comerciales (Comercio y Marketing) — Ciclo Completo
    # → 0084. Comercialización y logística en la industria alimentaria
    {
        "familia_destino":       "Industrias alimentarias",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Vitivinicultura",
        "codigo_destino":        "0084",
        "nombre_destino":        "Comercialización y logística en la industria alimentaria",
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
        "source_page": 124859,
    },

    # Origen: TS Laboratorio de Análisis y de Control de Calidad (Química) — Ciclo Completo
    # → 0081. Análisis enológico
    {
        "familia_destino":       "Industrias alimentarias",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Vitivinicultura",
        "codigo_destino":        "0081",
        "nombre_destino":        "Análisis enológico",
        "origenes": [
            {
                "familia_origen":        "Química",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Laboratorio de Análisis y de Control de Calidad",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124859,
    },

    # Origen: TS Patronaje y Moda (Textil, confección y piel) — módulo específico
    # → 0086. Gestión de calidad y ambiental en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Vitivinicultura",
        "codigo_destino":  "0086",
        "nombre_destino":  "Gestión de calidad y ambiental en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Textil, confección y piel",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Patronaje y Moda",
                "codigo_origen":  "0165",
                "nombre_origen":  "Gestión de la calidad, prevención de riesgos laborales y protección ambiental",
            },
        ],
        "source_link": None,
        "source_page": 124859,
    },

    # Origen: TS Programación de la Producción en Fabricación Mecánica — módulo específico
    # → 0086. Gestión de calidad y ambiental en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Vitivinicultura",
        "codigo_destino":  "0086",
        "nombre_destino":  "Gestión de calidad y ambiental en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Programación de la Producción en Fabricación Mecánica",
                "codigo_origen":  "0165",
                "nombre_origen":  "Gestión de la calidad, prevención de riesgos laborales y protección ambiental",
            },
        ],
        "source_link": None,
        "source_page": 124860,
    },

    # Origen: TS Programación de la Producción en Moldeo de Metales y Polímeros — módulo específico
    # → 0086. Gestión de calidad y ambiental en la industria alimentaria
    {
        "familia_destino": "Industrias alimentarias",
        "grado_destino":   "Grado Superior",
        "ciclo_destino":   "Vitivinicultura",
        "codigo_destino":  "0086",
        "nombre_destino":  "Gestión de calidad y ambiental en la industria alimentaria",
        "origenes": [
            {
                "familia_origen": "Fabricación mecánica",
                "grado_origen":   "Grado Superior",
                "ciclo_origen":   "Programación de la Producción en Moldeo de Metales y Polímeros",
                "codigo_origen":  "0165",
                "nombre_origen":  "Gestión de la calidad, prevención de riesgos laborales y protección ambiental",
            },
        ],
        "source_link": None,
        "source_page": 124860,
    },

    # Origen: TS Transporte y Logística (Comercio y Marketing) — Ciclo Completo
    # → 0084. Comercialización y logística en la industria alimentaria
    {
        "familia_destino":       "Industrias alimentarias",
        "grado_destino":         "Grado Superior",
        "ciclo_destino":         "Vitivinicultura",
        "codigo_destino":        "0084",
        "nombre_destino":        "Comercialización y logística en la industria alimentaria",
        "origenes": [
            {
                "familia_origen":        "Comercio y marketing",
                "grado_origen":          "Grado Superior",
                "ciclo_origen":          "Transporte y Logística",
                "codigo_origen":         None,
                "nombre_origen":         None,
                "ciclo_completo_origen": True,
            },
        ],
        "source_link": None,
        "source_page": 124860,
    },

]
