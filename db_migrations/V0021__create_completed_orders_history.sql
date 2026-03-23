CREATE TABLE IF NOT EXISTS t_p96553691_freelance_platform_c.completed_orders (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    budget_min INTEGER,
    budget_max INTEGER,
    client_id INTEGER NOT NULL REFERENCES t_p96553691_freelance_platform_c.users(id),
    client_name VARCHAR(255),
    executor_id INTEGER REFERENCES t_p96553691_freelance_platform_c.users(id),
    executor_name VARCHAR(255),
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);