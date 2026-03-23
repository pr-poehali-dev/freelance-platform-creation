import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для работы с откликами на заказы'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    headers = event.get('headers', {})
    user_id_str = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id_str:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Требуется авторизация'}),
            'isBase64Encoded': False
        }

    user_id = int(user_id_str)
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            order_id = query_params.get('order_id')

            if order_id:
                cur.execute("""
                    SELECT 
                        r.*,
                        u.name as freelancer_name,
                        u.username as freelancer_username
                    FROM t_p96553691_freelance_platform_c.order_responses r
                    JOIN t_p96553691_freelance_platform_c.users u ON r.freelancer_id = u.id
                    WHERE r.order_id = %s
                    ORDER BY r.created_at DESC
                """, (int(order_id),))
            else:
                cur.execute("""
                    SELECT 
                        r.*,
                        u.name as freelancer_name,
                        u.username as freelancer_username,
                        o.title as order_title
                    FROM t_p96553691_freelance_platform_c.order_responses r
                    JOIN t_p96553691_freelance_platform_c.users u ON r.freelancer_id = u.id
                    JOIN t_p96553691_freelance_platform_c.orders o ON r.order_id = o.id
                    WHERE r.freelancer_id = %s OR o.user_id = %s
                    ORDER BY r.created_at DESC
                """, (user_id, user_id))
            
            responses = [dict(row) for row in cur.fetchall()]
            for resp in responses:
                resp['created_at'] = resp['created_at'].isoformat() if resp.get('created_at') else None
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'responses': responses}),
                'isBase64Encoded': False
            }

        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            order_id = body.get('order_id')
            message = body.get('message', '').strip()
            proposed_price = body.get('proposed_price')

            if not order_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'order_id обязателен'}),
                    'isBase64Encoded': False
                }

            cur.execute("""
                SELECT user_id FROM t_p96553691_freelance_platform_c.orders WHERE id = %s
            """, (order_id,))
            order = cur.fetchone()

            if not order:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Заказ не найден'}),
                    'isBase64Encoded': False
                }

            if order['user_id'] == user_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Нельзя откликнуться на свой заказ'}),
                    'isBase64Encoded': False
                }

            cur.execute("""
                SELECT id FROM t_p96553691_freelance_platform_c.order_responses 
                WHERE order_id = %s AND freelancer_id = %s
            """, (order_id, user_id))
            
            existing = cur.fetchone()
            if existing:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Вы уже откликнулись на этот заказ'}),
                    'isBase64Encoded': False
                }

            cur.execute("""
                INSERT INTO t_p96553691_freelance_platform_c.order_responses 
                (order_id, freelancer_id, message, proposed_price, status)
                VALUES (%s, %s, %s, %s, 'pending')
                RETURNING id, order_id, freelancer_id, message, proposed_price, status, created_at
            """, (order_id, user_id, message, proposed_price))

            response = cur.fetchone()
            conn.commit()

            resp_dict = dict(response)
            resp_dict['created_at'] = resp_dict['created_at'].isoformat() if resp_dict.get('created_at') else None

            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'response': resp_dict}),
                'isBase64Encoded': False
            }

        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            response_id = body.get('response_id')
            action = body.get('action')

            if not response_id or not action:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'response_id и action обязательны'}),
                    'isBase64Encoded': False
                }

            cur.execute("""
                SELECT r.*, o.user_id as order_owner_id
                FROM t_p96553691_freelance_platform_c.order_responses r
                JOIN t_p96553691_freelance_platform_c.orders o ON r.order_id = o.id
                WHERE r.id = %s
            """, (response_id,))
            
            response = cur.fetchone()
            if not response:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Отклик не найден'}),
                    'isBase64Encoded': False
                }

            if response['order_owner_id'] != user_id:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Только владелец заказа может принимать отклики'}),
                    'isBase64Encoded': False
                }

            if action == 'accept':
                cur.execute("""
                    UPDATE t_p96553691_freelance_platform_c.order_responses 
                    SET status = 'accepted'
                    WHERE id = %s
                """, (response_id,))

                cur.execute("""
                    UPDATE t_p96553691_freelance_platform_c.orders 
                    SET status = 'in_progress', executor_id = %s
                    WHERE id = %s
                """, (response['freelancer_id'], response['order_id']))

                cur.execute("""
                    UPDATE t_p96553691_freelance_platform_c.order_responses 
                    SET status = 'rejected'
                    WHERE order_id = %s AND id != %s AND status = 'pending'
                """, (response['order_id'], response_id))

                conn.commit()

                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': True, 'message': 'Отклик принят, заказ в работе'}),
                    'isBase64Encoded': False
                }

            elif action == 'reject':
                cur.execute("""
                    UPDATE t_p96553691_freelance_platform_c.order_responses 
                    SET status = 'rejected'
                    WHERE id = %s
                """, (response_id,))

                conn.commit()

                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': True, 'message': 'Отклик отклонен'}),
                    'isBase64Encoded': False
                }

        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Неизвестное действие'}),
            'isBase64Encoded': False
        }

    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()
