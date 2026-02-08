-- Add balance column to users table
ALTER TABLE t_p96553691_freelance_platform_c.users 
ADD COLUMN IF NOT EXISTS balance NUMERIC(12, 2) DEFAULT 0.00;

-- Create transactions table
CREATE TABLE IF NOT EXISTS t_p96553691_freelance_platform_c.transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p96553691_freelance_platform_c.users(id),
    type VARCHAR(50) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT,
    order_id INTEGER REFERENCES t_p96553691_freelance_platform_c.orders(id),
    related_user_id INTEGER REFERENCES t_p96553691_freelance_platform_c.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON t_p96553691_freelance_platform_c.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON t_p96553691_freelance_platform_c.transactions(created_at DESC);