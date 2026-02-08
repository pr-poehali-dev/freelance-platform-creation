-- Create freelancers table
CREATE TABLE IF NOT EXISTS t_p96553691_freelance_platform_c.freelancers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES t_p96553691_freelance_platform_c.users(id),
    bio TEXT,
    hourly_rate INTEGER,
    avatar_url TEXT,
    skills TEXT[],
    rating NUMERIC(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    completed_projects INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS t_p96553691_freelance_platform_c.reviews (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES t_p96553691_freelance_platform_c.orders(id),
    freelancer_id INTEGER NOT NULL REFERENCES t_p96553691_freelance_platform_c.freelancers(id),
    client_id INTEGER NOT NULL REFERENCES t_p96553691_freelance_platform_c.users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_freelancer_id ON t_p96553691_freelance_platform_c.reviews(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON t_p96553691_freelance_platform_c.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_freelancers_rating ON t_p96553691_freelance_platform_c.freelancers(rating DESC);