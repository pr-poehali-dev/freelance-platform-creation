import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для создания заказа от авторизованного пользователя'''
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }

    try:
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
        body = json.loads(event.get('body', '{}'))
        
        title = body.get('title', '').strip()
        description = body.get('description', '').strip()
        category = body.get('category', '').strip()
        budget_min = body.get('budget_min')
        budget_max = body.get('budget_max')
        deadline = body.get('deadline')

        if not title or not description or not category:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Название, описание и категория обязательны'}),
                'isBase64Encoded': False
            }

        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute(
            """INSERT INTO t_p96553691_freelance_platform_c.orders 
            (user_id, title, description, category, budget_min, budget_max, deadline, status) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'active') 
            RETURNING id, user_id, title, description, category, budget_min, budget_max, deadline, status, created_at""",
            (user_id, title, description, category, budget_min, budget_max, deadline)
        )
        
        order = cur.fetchone()
        conn.commit()
        
        order_dict = dict(order)
        order_dict['created_at'] = order_dict['created_at'].isoformat() if order_dict.get('created_at') else None
        order_dict['deadline'] = order_dict['deadline'].isoformat() if order_dict.get('deadline') else None
        
        cur.close()
        conn.close()

        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'order': order_dict
            }),
            'isBase64Encoded': False
        }

    except ValueError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Неверный формат данных'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
