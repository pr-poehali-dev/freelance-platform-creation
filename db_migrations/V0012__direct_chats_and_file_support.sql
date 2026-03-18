-- Добавляем таблицу для прямых чатов (без заказа)
CREATE TABLE t_p96553691_freelance_platform_c.direct_chats (
  id serial PRIMARY KEY,
  user1_id integer NOT NULL REFERENCES t_p96553691_freelance_platform_c.users(id),
  user2_id integer NOT NULL REFERENCES t_p96553691_freelance_platform_c.users(id),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user1_id, user2_id)
);

-- Добавляем таблицу сообщений для прямых чатов
CREATE TABLE t_p96553691_freelance_platform_c.direct_messages (
  id serial PRIMARY KEY,
  direct_chat_id integer NOT NULL REFERENCES t_p96553691_freelance_platform_c.direct_chats(id),
  sender_id integer NOT NULL REFERENCES t_p96553691_freelance_platform_c.users(id),
  message text NULL,
  file_url text NULL,
  file_name text NULL,
  file_type text NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем поддержку файлов в обычные сообщения
ALTER TABLE t_p96553691_freelance_platform_c.messages
  ADD COLUMN file_url text NULL,
  ADD COLUMN file_name text NULL,
  ADD COLUMN file_type text NULL;
