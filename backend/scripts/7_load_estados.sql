-- Seed de estados de formularios
INSERT OR IGNORE INTO estados_formularios (id, nombre) VALUES
  (0, 'revision'),
  (1, 'validado'),
  (2, 'rechazado');

-- Seed de estados de modulos
INSERT OR IGNORE INTO estados_modulos_destino (id, nombre) VALUES
  (0, 'revision'),
  (1, 'validado'),
  (2, 'rechazado');
