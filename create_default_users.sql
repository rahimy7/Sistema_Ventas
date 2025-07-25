INSERT INTO users (username, password, full_name, role, is_active) VALUES 
('admin', '$2b$10$k9Y6mzJ4lOvvYxr.EJFme.F6mWNWqGHlGLEQ1OvV8ZzVQgLhfzz4G', 'Administrador del Sistema', 'admin', true),
('ventas', '$2b$10$k9Y6mzJ4lOvvYxr.EJFme.F6mWNWqGHlGLEQ1OvV8ZzVQgLhfzz4G', 'Usuario de Ventas', 'sales', true),
('visor', '$2b$10$k9Y6mzJ4lOvvYxr.EJFme.F6mWNWqGHlGLEQ1OvV8ZzVQgLhfzz4G', 'Usuario Visor', 'viewer', true)
ON CONFLICT (username) DO NOTHING;
