CREATE TABLE IF NOT EXISTS t_p96553691_freelance_platform_c.chats (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    freelancer_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(order_id, freelancer_id)
);

CREATE TABLE IF NOT EXISTS t_p96553691_freelance_platform_c.messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_chat_id ON t_p96553691_freelance_platform_c.messages(chat_id);
CREATE INDEX idx_chats_order_id ON t_p96553691_freelance_platform_c.chats(order_id);