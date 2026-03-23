UPDATE t_p96553691_freelance_platform_c.freelancers f
SET
    rating = COALESCE(stats.avg_rating, 0),
    total_reviews = COALESCE(stats.review_count, 0),
    completed_projects = COALESCE(done.project_count, 0)
FROM (
    SELECT
        reviewee_id,
        ROUND(AVG(rating)::numeric, 2) AS avg_rating,
        COUNT(*) AS review_count
    FROM t_p96553691_freelance_platform_c.order_reviews
    WHERE role = 'client'
    GROUP BY reviewee_id
) stats
FULL OUTER JOIN (
    SELECT
        executor_id,
        COUNT(*) AS project_count
    FROM t_p96553691_freelance_platform_c.completed_orders
    WHERE executor_id IS NOT NULL
    GROUP BY executor_id
) done ON done.executor_id = stats.reviewee_id
WHERE f.user_id = COALESCE(stats.reviewee_id, done.executor_id);