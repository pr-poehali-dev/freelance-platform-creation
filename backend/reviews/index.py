import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p96553691_freelance_platform_c'

def handler(event: dict, context) -> dict:
    """Отзывы после завершения заказа: создание и получение."""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    headers = event.get('headers', {})
    user_id_str = headers.get('X-User-Id') or headers.get('x-user-id')
    if not user_id_str:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется авторизация'})
        }

    user_id = int(user_id_str)
    method = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters') or {}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)

    def resp(status, data):
        return {
            'statusCode': status,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(data, default=str)
        }

    try:
        if method == 'GET':
            reviewee_id = query_params.get('user_id')
            if not reviewee_id:
                return resp(400, {'error': 'user_id обязателен'})

            cur.execute(f"""
                SELECT
                    r.id, r.completed_order_id, r.rating, r.comment, r.role,
                    r.created_at,
                    co.title as order_title,
                    u.name as reviewer_name,
                    u.id as reviewer_id
                FROM {SCHEMA}.order_reviews r
                JOIN {SCHEMA}.completed_orders co ON r.completed_order_id = co.id
                JOIN {SCHEMA}.users u ON r.reviewer_id = u.id
                WHERE r.reviewee_id = %s
                ORDER BY r.created_at DESC
            """, (int(reviewee_id),))

            reviews = [dict(row) for row in cur.fetchall()]
            for rv in reviews:
                if rv.get('created_at'):
                    rv['created_at'] = rv['created_at'].isoformat()

            avg_rating = None
            if reviews:
                avg_rating = round(sum(r['rating'] for r in reviews) / len(reviews), 2)

            return resp(200, {'reviews': reviews, 'avg_rating': avg_rating, 'total': len(reviews)})

        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            completed_order_id = body.get('completed_order_id')
            rating = body.get('rating')
            comment = body.get('comment', '').strip()

            if not completed_order_id or not rating:
                return resp(400, {'error': 'completed_order_id и rating обязательны'})

            if not (1 <= int(rating) <= 5):
                return resp(400, {'error': 'Оценка должна быть от 1 до 5'})

            cur.execute(f"""
                SELECT id, client_id, executor_id
                FROM {SCHEMA}.completed_orders
                WHERE id = %s
            """, (int(completed_order_id),))
            order = cur.fetchone()

            if not order:
                return resp(404, {'error': 'Завершённый заказ не найден'})

            if user_id == order['client_id']:
                role = 'client'
                reviewee_id = order['executor_id']
            elif user_id == order['executor_id']:
                role = 'freelancer'
                reviewee_id = order['client_id']
            else:
                return resp(403, {'error': 'Вы не участник этого заказа'})

            if not reviewee_id:
                return resp(400, {'error': 'Нет пользователя для оценки'})

            cur.execute(f"""
                SELECT id FROM {SCHEMA}.order_reviews
                WHERE completed_order_id = %s AND reviewer_id = %s
            """, (int(completed_order_id), user_id))
            if cur.fetchone():
                return resp(409, {'error': 'Вы уже оставили отзыв по этому заказу'})

            cur.execute(f"""
                INSERT INTO {SCHEMA}.order_reviews
                    (completed_order_id, reviewer_id, reviewee_id, role, rating, comment)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, created_at
            """, (int(completed_order_id), user_id, reviewee_id, role, int(rating), comment or None))

            new_review = dict(cur.fetchone())
            conn.commit()
            new_review['created_at'] = new_review['created_at'].isoformat()
            return resp(201, {'success': True, 'review': new_review})

    except Exception as e:
        conn.rollback()
        return resp(500, {'error': f'Ошибка сервера: {str(e)}'})
    finally:
        cur.close()
        conn.close()
