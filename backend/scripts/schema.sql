PRAGMA foreign_keys = ON;

-- SQLite schema for Somorrostro Convalidaciones.
-- NOTE: SQLite is case-insensitive for table names, so this schema fulfills
-- the required entities:
-- GRADOS, FAMILIAS, CICLOS, MODULOS, CONVALIDACION, CONVALIDACION_ORIGEN,
-- USUARIOS, FORMULARIOS, FORMULARIO_SOLICITUDES,
-- FORMULARIO_MODULOS_APORTADOS, FORMULARIO_ARCHIVOS.

-- ---------------------------------------------------------------------------
-- Catalogo FP: grados -> familias -> ciclos -> modulos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS familias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  id_grado INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (nombre, id_grado),
  FOREIGN KEY (id_grado) REFERENCES grados(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ciclos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  titulo TEXT,
  id_oficial TEXT,
  normativa TEXT,
  id_familia INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (nombre, id_familia),
  FOREIGN KEY (id_familia) REFERENCES familias(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS modulos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  id_oficial TEXT,
  id_ciclo INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (nombre, id_ciclo),
  FOREIGN KEY (id_ciclo) REFERENCES ciclos(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Convalidaciones
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS convalidacion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_link TEXT,
  source_page INTEGER,
  source_doc TEXT,
  source_anexo INTEGER,
  rule_mode TEXT NOT NULL DEFAULT 'ALL' CHECK (rule_mode IN ('ALL', 'ANY')),
  id_modulo_destino INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (id_modulo_destino) REFERENCES modulos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS convalidacion_origen (
  conv_id INTEGER NOT NULL,
  id_modulo INTEGER NOT NULL,
  PRIMARY KEY (conv_id, id_modulo),
  FOREIGN KEY (conv_id) REFERENCES convalidacion(id) ON DELETE CASCADE,
  FOREIGN KEY (id_modulo) REFERENCES modulos(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Usuarios y formularios
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol TEXT NOT NULL DEFAULT 'ALUMNO'
    CHECK (rol IN ('ALUMNO', 'ADMIN')),
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (rol != 'ADMIN' OR password_hash IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS formularios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_alumno INTEGER NOT NULL,
  enviado_at TEXT,
  estado TEXT NOT NULL DEFAULT 'BORRADOR'
    CHECK (estado IN ('BORRADOR', 'ENVIADO', 'A_REVISAR', 'APROBADO', 'RECHAZADO')),
  validado_por INTEGER,
  anotaciones TEXT,
  validado_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (id_alumno) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (validado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS formulario_solicitudes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_formulario INTEGER NOT NULL,
  id_modulo INTEGER,
  id_convalidacion INTEGER,
  descripcion TEXT,
  estado_evaluacion TEXT NOT NULL DEFAULT 'PENDIENTE'
    CHECK (estado_evaluacion IN ('PENDIENTE', 'MATCH', 'NO_MATCH')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (id_formulario) REFERENCES formularios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_modulo) REFERENCES modulos(id) ON DELETE SET NULL,
  FOREIGN KEY (id_convalidacion) REFERENCES convalidacion(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS formulario_modulos_aportados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_formulario INTEGER NOT NULL,
  id_modulo INTEGER,
  descripcion TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (id_formulario) REFERENCES formularios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_modulo) REFERENCES modulos(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS formulario_archivos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_formulario INTEGER NOT NULL,
  nombre_archivo TEXT NOT NULL,
  descripcion TEXT,
  ruta_almacenamiento TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (id_formulario) REFERENCES formularios(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Indices
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_familias_grado ON familias(id_grado);
CREATE INDEX IF NOT EXISTS idx_ciclos_familia ON ciclos(id_familia);
CREATE INDEX IF NOT EXISTS idx_modulos_ciclo ON modulos(id_ciclo);
CREATE INDEX IF NOT EXISTS idx_modulos_id_oficial ON modulos(id_oficial);

CREATE INDEX IF NOT EXISTS idx_convalidacion_destino ON convalidacion(id_modulo_destino);
CREATE INDEX IF NOT EXISTS idx_convalidacion_rule_mode ON convalidacion(rule_mode);
CREATE INDEX IF NOT EXISTS idx_convalidacion_origen_modulo ON convalidacion_origen(id_modulo);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_formularios_alumno ON formularios(id_alumno);
CREATE INDEX IF NOT EXISTS idx_formularios_estado ON formularios(estado);
CREATE INDEX IF NOT EXISTS idx_formulario_solicitudes_form ON formulario_solicitudes(id_formulario);
CREATE INDEX IF NOT EXISTS idx_formulario_solicitudes_modulo ON formulario_solicitudes(id_modulo);
CREATE INDEX IF NOT EXISTS idx_formulario_modulos_aportados_form ON formulario_modulos_aportados(id_formulario);
CREATE INDEX IF NOT EXISTS idx_formulario_archivos_form ON formulario_archivos(id_formulario);

-- ---------------------------------------------------------------------------
-- Triggers para updated_at
-- ---------------------------------------------------------------------------
CREATE TRIGGER IF NOT EXISTS trg_usuarios_updated_at
AFTER UPDATE ON usuarios
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE usuarios
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_formularios_updated_at
AFTER UPDATE ON formularios
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE formularios
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_formulario_solicitudes_updated_at
AFTER UPDATE ON formulario_solicitudes
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE formulario_solicitudes
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_formulario_modulos_aportados_updated_at
AFTER UPDATE ON formulario_modulos_aportados
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE formulario_modulos_aportados
  SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;
