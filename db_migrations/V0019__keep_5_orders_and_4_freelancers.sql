-- Скрываем все активные заказы кроме 5 последних
UPDATE t_p96553691_freelance_platform_c.orders
SET status = 'hidden'
WHERE status = 'active'
  AND id NOT IN (93, 94, 95, 96, 97);

-- Скрываем всех фрилансеров кроме топ-4 по рейтингу (id: 24, 56, 21, 52)
UPDATE t_p96553691_freelance_platform_c.freelancers
SET rating = 0
WHERE id NOT IN (24, 56, 21, 52);
