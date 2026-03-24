# rules_otros.py
# Reglas de convalidación globales que aplican a todos los ciclos

# ──────────────────────────────────────────────────────────────────────
# TIPO 1: Módulo universal ↔ módulo universal
# El módulo X de cualquier ciclo convalida el módulo X en cualquier otro ciclo.
# Procesado por: generate_convalidations_otros.py
# ──────────────────────────────────────────────────────────────────────
MODULOS_GLOBALES = [
    "Formación y Orientación Laboral",
    "Empresa e Iniciativa Emprendedora",
    "Itinerario personal para la empleabilidad I",
    "Itinerario personal para la empleabilidad II"
]

# ──────────────────────────────────────────────────────────────────────
# TIPO 2: Ciclo completo → módulo en cualquier ciclo
# Tener el ciclo completo indicado convalida ese módulo en TODO ciclo que lo tenga.
# Procesado por: generate_convalidations_ciclo_universal.py
# ──────────────────────────────────────────────────────────────────────
REGLAS_CICLO_A_MODULO_UNIVERSAL = [

    # Técnico en Gestión Administrativa (ciclo completo) → EIE en cualquier ciclo
    {
        "ciclo_origen":   "Gestión Administrativa",
        "grado_origen":   "Grado Medio",
        "familia_origen": "Administración y gestión",
        "modulo_destino_nombre": "Empresa e Iniciativa Emprendedora",
    },

    # Técnico Superior en Administración y Finanzas (ciclo completo) → EIE en cualquier ciclo
    {
        "ciclo_origen":   "Administración y Finanzas",
        "grado_origen":   "Grado Superior",
        "familia_origen": "Administración y gestión",
        "modulo_destino_nombre": "Empresa e Iniciativa Emprendedora",
    },

    # Técnico en Emergencias Sanitarias (ciclo completo) → Primeros auxilios en cualquier ciclo
    {
        "ciclo_origen":          "Emergencias Sanitarias",
        "grado_origen":          "Grado Medio",
        "familia_origen":        "Sanidad",
        "modulo_destino_nombre": "Primeros auxilios",   # Primeros auxilios
    },
]

# ──────────────────────────────────────────────────────────────────────
# TIPO 3: Módulo A (por id_oficial) → Módulo B (por id_oficial)
# Cualquier instancia del módulo A convalida cualquier instancia del módulo B.
# Cada par (origen, destino) obtiene su propio conv_id (OR semántico).
# Procesado por: generate_convalidations_globales.py
# ──────────────────────────────────────────────────────────────────────
REGLAS_MODULO_A_MODULO = [

    # 0179 Inglés (aportado) → 0156 Inglés (a convalidar)
    {
        "id_oficial_origen":  "0179",
        "id_oficial_destino": "0156",
    },
    {
        "modulo_origen":"Formación y Orientación Laboral",
        "modulo_destino": "Itinerario personal para la empleabilidad I"
    },
    {
        "modulo_origen":"Empresa e Iniciativa Emprendedora",
        "modulo_destino": "Itinerario personal para la empleabilidad II"
    },
]
