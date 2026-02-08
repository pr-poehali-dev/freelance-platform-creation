-- Создание таблицы откликов на заказы
CREATE TABLE IF NOT EXISTS order_responses (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    freelancer_id INTEGER NOT NULL REFERENCES users(id),
    message TEXT,
    proposed_price INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(order_id, freelancer_id)
);

-- Добавление поля исполнителя в таблицу заказов
ALTER TABLE orders ADD COLUMN IF NOT EXISTS executor_id INTEGER REFERENCES users(id);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_order_responses_order ON order_responses(order_id);
CREATE INDEX IF NOT EXISTS idx_order_responses_freelancer ON order_responses(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_order_responses_status ON order_responses(status);
CREATE INDEX IF NOT EXISTS idx_orders_executor ON orders(executor_id);

-- Комментарии
COMMENT ON TABLE order_responses IS 'Отклики фрилансеров на заказы';
COMMENT ON COLUMN order_responses.status IS 'pending - ожидает, accepted - принят, rejected - отклонен';
COMMENT ON COLUMN orders.executor_id IS 'ID исполнителя, взявшего заказ в работу';
