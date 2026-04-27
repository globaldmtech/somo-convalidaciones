-- ============================================================
-- Somorrostro cycle flags
-- ============================================================

PRAGMA foreign_keys = OFF;

UPDATE ciclos
SET es_somorrostro = 1
WHERE id IN (
  4,   -- Administracion y Finanzas
  3,   -- Gestion Administrativa
  33,  -- Marketing y Publicidad
  38,  -- Electricidad y Electronica (FP Basica)
  41,  -- Instalaciones Electricas y Automaticas
  42,  -- Instalaciones de Telecomunicaciones
  43,  -- Sistemas Electrotecnicos y Automatizados
  44,  -- Sistemas de Telecomunicaciones e informaticos
  45,  -- Automatizacion y Robotica Industrial
  46,  -- Mantenimiento Electronico
  54,  -- Energias Renovables
  66,  -- Fabricacion de Elementos Metalicos (FP Basica)
  68,  -- Mecanizado
  69,  -- Soldadura y Caldereria
  72,  -- Programacion de la Produccion en Fabricacion Mecanica
  73,  -- Diseno en Fabricacion Mecanica
  74,  -- Construcciones Metalicas
  93,  -- Informatica y Comunicaciones (FP Basica integrada)
  94,  -- Sistemas Microinformaticos y Redes
  95,  -- Administracion de Sistemas Informaticos en Red
  96,  -- Desarrollo de Aplicaciones Multiplataforma
  97,  -- Desarrollo de Aplicaciones Web
  100, -- Inteligencia Artificial y Big Data
  102, -- Mantenimiento de Viviendas
  105, -- Mantenimiento Electromecanico
  108, -- Mecatronica Industrial
  109, -- Digitalizacion del Mantenimiento Industrial
  112, -- Peluqueria y Estetica
  169, -- Quimica y Salud Ambiental
  171, -- Atencion a Personas en Situacion de Dependencia
  189, -- Electromecanica de Vehiculos Automoviles
  197  -- Automocion
);

UPDATE ciclos
SET es_somorrostro = 0
WHERE id NOT IN (
  4, 3, 33, 38, 41, 42, 43, 44, 45, 46, 54, 66, 68, 69, 72, 73, 74, 93, 94, 95, 96,
  97, 100, 102, 105, 108, 109, 112, 169, 171, 189, 197
);

PRAGMA foreign_keys = ON;
