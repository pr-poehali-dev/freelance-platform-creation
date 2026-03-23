CREATE TABLE IF NOT EXISTS t_p96553691_freelance_platform_c.order_reviews (
    id SERIAL PRIMARY KEY,
    completed_order_id INTEGER NOT NULL,
    reviewer_id INTEGER NOT NULL REFERENCES t_p96553691_freelance_platform_c.users(id),
    reviewee_id INTEGER NOT NULL REFERENCES t_p96553691_freelance_platform_c.users(id),
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'freelancer')),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (completed_order_id, reviewer_id)
);