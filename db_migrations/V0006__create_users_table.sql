-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индекса для быстрого поиска по username
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Добавление комментариев
COMMENT ON TABLE users IS 'Таблица пользователей для авторизации';
COMMENT ON COLUMN users.username IS 'Уникальный логин пользователя';
COMMENT ON COLUMN users.password_hash IS 'Хеш пароля (bcrypt)';
COMMENT ON COLUMN users.name IS 'Отображаемое имя пользователя';
COMMENT ON COLUMN users.email IS 'Email пользователя (опционально)';
