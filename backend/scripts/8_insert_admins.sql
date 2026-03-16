-- Seed de administrador inicial
INSERT OR IGNORE INTO administradores (id, nombre, password, created_at) VALUES
  (
    1,
    'admin',
    'pbkdf2_sha256$200000$c0b9e1f4a28d7c6b5e3a91f0d4c8b2a1$f0dc6961e660a82bba74830cc8c03dbab00bfc47a176a4c1ccf8a97a6a090136',
    datetime('now')
  );
