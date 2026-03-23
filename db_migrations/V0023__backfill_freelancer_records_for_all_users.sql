INSERT INTO t_p96553691_freelance_platform_c.freelancers (user_id)
SELECT u.id FROM t_p96553691_freelance_platform_c.users u
WHERE NOT EXISTS (
    SELECT 1 FROM t_p96553691_freelance_platform_c.freelancers f WHERE f.user_id = u.id
);