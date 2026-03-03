-- SQLite schema for Somorrostro Convalidaciones
-- TODO: complete table definitions based on the roadmap interno.

-- Catalog
CREATE TABLE IF NOT EXISTS grados (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS familias (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ciclos (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  id_oficial TEXT,
  normativa TEXT,
  id_familia INTEGER,
  id_grado INTEGER,
  FOREIGN KEY (id_familia) REFERENCES familias(id) ON DELETE SET NULL,
  FOREIGN KEY (id_grado) REFERENCES grados(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS modulos (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  id_oficial TEXT,
  id_ciclo INTEGER NOT NULL,
  FOREIGN KEY (id_ciclo) REFERENCES ciclos(id) ON DELETE CASCADE
);

-- Convalidaciones
CREATE TABLE IF NOT EXISTS convalidacion (
  id INTEGER PRIMARY KEY,
  source_link TEXT,
  source_page INTEGER,
  id_modulo_destino INTEGER NOT NULL,
  FOREIGN KEY (id_modulo_destino) REFERENCES modulos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS convalidacion_origen (
  conv_id INTEGER NOT NULL,
  id_modulo INTEGER NOT NULL,
  PRIMARY KEY (conv_id, id_modulo),
  FOREIGN KEY (conv_id) REFERENCES convalidacion(id) ON DELETE CASCADE,
  FOREIGN KEY (id_modulo) REFERENCES modulos(id) ON DELETE CASCADE
);

-- Usuarios, administradores y formularios
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY,
  DNI TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS administradores (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS estados_formularios (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS estados_modulos_destino (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS formularios (
  id INTEGER PRIMARY KEY,
  id_alumno INTEGER NOT NULL,
  enviado_at TEXT,
  estado INTEGER NOT NULL,
  validado_por INTEGER,
  anotaciones TEXT,
  validado_at TEXT,
  FOREIGN KEY (id_alumno) REFERENCES usuarios(id),
  FOREIGN KEY (validado_por) REFERENCES administradores(id),
  FOREIGN KEY (estado) REFERENCES estados_formularios(id)
);

CREATE TABLE IF NOT EXISTS formulario_solicitudes (
  id INTEGER PRIMARY KEY,
  id_formulario INTEGER NOT NULL,
  id_modulo_destino INTEGER,
  id_convalidacion INTEGER,
  descripcion TEXT,
  estado_modulo INTEGER NOT NULL,
  FOREIGN KEY (id_formulario) REFERENCES formularios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_modulo_destino) REFERENCES modulos(id) ON DELETE SET NULL,
  FOREIGN KEY (id_convalidacion) REFERENCES convalidacion(id) ON DELETE SET NULL,
  FOREIGN KEY (estado_modulo) REFERENCES estados_modulos_destino(id)
);

CREATE TABLE IF NOT EXISTS formulario_modulos_aportados (
  id INTEGER PRIMARY KEY,
  id_formulario INTEGER NOT NULL,
  id_modulo INTEGER,
  descripcion TEXT,
  FOREIGN KEY (id_formulario) REFERENCES formularios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_modulo) REFERENCES modulos(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS formulario_archivos (
  id INTEGER PRIMARY KEY,
  id_formulario INTEGER NOT NULL,
  nombre_archivo TEXT NOT NULL,
  descripcion TEXT,
  ruta_almacenamiento TEXT NOT NULL,
  FOREIGN KEY (id_formulario) REFERENCES formularios(id) ON DELETE CASCADE
);
