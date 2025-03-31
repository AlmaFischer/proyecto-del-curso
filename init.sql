-- Eliminar la tabla si ya existe
DROP TABLE IF EXISTS users;

-- Crear la tabla users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,  -- Corregido el error aquí
  email VARCHAR(200) NOT NULL,
  file VARCHAR(100) NOT NULL
);

-- Insertar el usuario admin con la contraseña admin.123
INSERT INTO users (username, password, email, file)
VALUES ('admin', 'admin.123', 'admin@admin.com', 'admin_file.pdf');
