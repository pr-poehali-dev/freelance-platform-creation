import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    '''API для получения сообщений чата по заказу'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    user_id = event.get('headers', {}).get('X-User-Id')
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    order_id = event.get('queryStringParameters', {}).get('order_id')
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
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        cur.execute('''
            SELECT id, client_id, freelancer_id, title
            FROM t_p96553691_freelance_platform_c.orders 
            WHERE id = %s
        ''', (order_id,))
        order = cur.fetchone()
        
        if not order:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Заказ не найден'}),
                'isBase64Encoded': False
            }
        
        order_client_id = order[1]
        order_freelancer_id = order[2]
        order_title = order[3]
        
        if not order_freelancer_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'messages': [],
                    'order': {
                        'id': int(order_id),
                        'title': order_title,
                        'client_id': order_client_id,
                        'freelancer_id': None
                    }
                }),
                'isBase64Encoded': False
            }
        
        if int(user_id) not in [order_client_id, order_freelancer_id]:
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'У вас нет доступа к этому чату'}),
                'isBase64Encoded': False
            }
        
        cur.execute('''
            SELECT id FROM t_p96553691_freelance_platform_c.chats
            WHERE order_id = %s AND freelancer_id = %s
        ''', (order_id, order_freelancer_id))
        
        chat = cur.fetchone()
        
        if not chat:
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'messages': [],
                    'order': {
                        'id': int(order_id),
                        'title': order_title,
                        'client_id': order_client_id,
                        'freelancer_id': order_freelancer_id
                    }
                }),
                'isBase64Encoded': False
            }
        
        chat_id = chat[0]
        
        cur.execute('''
            SELECT m.id, m.sender_id, m.message, m.created_at, u.name
            FROM t_p96553691_freelance_platform_c.messages m
            LEFT JOIN t_p96553691_freelance_platform_c.users u ON m.sender_id = u.id
            WHERE m.chat_id = %s
            ORDER BY m.created_at ASC
        ''', (chat_id,))
        
        messages_data = cur.fetchall()
        
        messages = []
        for msg in messages_data:
            messages.append({
                'id': msg[0],
                'sender_id': msg[1],
                'message': msg[2],
                'created_at': msg[3].isoformat(),
                'sender_name': msg[4] or 'Пользователь'
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'messages': messages,
                'order': {
                    'id': int(order_id),
                    'title': order_title,
                    'client_id': order_client_id,
                    'freelancer_id': order_freelancer_id
                }
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
