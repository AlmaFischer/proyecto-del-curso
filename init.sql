-- Eliminar tablas si existen
DROP TABLE IF EXISTS document_entities;
DROP TABLE IF EXISTS entities;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS comments;

-- Crear la tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE  -- Indica si el usuario es administrador
);

-- Crear la tabla de documentos
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    document_type VARCHAR(50) NOT NULL,
    file VARCHAR(100) NOT NULL,
    pdf_path TEXT NOT NULL,
    sha256 CHAR(64) NOT NULL UNIQUE
);

-- Crear la tabla de entidades (puede ser una empresa o una persona)
CREATE TABLE entities (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE SET NULL,  -- Relación con usuario
    name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(200) NOT NULL UNIQUE,
    nationality VARCHAR(100),
    address TEXT,
    representative VARCHAR(255)
);

-- Tabla intermedia para la relación muchos a muchos entre documentos y entidades
CREATE TABLE document_entities (
    document_id INT REFERENCES documents(id) ON DELETE CASCADE,
    entity_id INT REFERENCES entities(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, entity_id)
);

-- Crear la tabla de comentarios
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- Fecha automática al crear
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- Usuario que comenta
    document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,  -- Documento relacionado
    content TEXT NOT NULL  -- Texto del comentario
);
