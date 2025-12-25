import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для отправки сообщений в чате по заказу'''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
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
    
    try:
        body = json.loads(event.get('body', '{}'))
        order_id = body.get('order_id')
        message_text = body.get('message')
        
        if not order_id or not message_text:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'order_id и message обязательны'}),
                'isBase64Encoded': False
            }
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        cur.execute('''
            SELECT id, client_id, freelancer_id 
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
        
        if not order_freelancer_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Фрилансер еще не выбран для этого заказа'}),
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
            INSERT INTO t_p96553691_freelance_platform_c.chats (order_id, freelancer_id, client_id)
            VALUES (%s, %s, %s)
            ON CONFLICT (order_id, freelancer_id) DO NOTHING
            RETURNING id
        ''', (order_id, order_freelancer_id, order_client_id))
        
        result = cur.fetchone()
        if result:
            chat_id = result[0]
        else:
            cur.execute('''
                SELECT id FROM t_p96553691_freelance_platform_c.chats
                WHERE order_id = %s AND freelancer_id = %s
            ''', (order_id, order_freelancer_id))
            chat_id = cur.fetchone()[0]
        
        cur.execute('''
            INSERT INTO t_p96553691_freelance_platform_c.messages (chat_id, sender_id, message)
            VALUES (%s, %s, %s)
            RETURNING id, created_at
        ''', (chat_id, int(user_id), message_text))
        
        message_id, created_at = cur.fetchone()
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': {
                    'id': message_id,
                    'chat_id': chat_id,
                    'sender_id': int(user_id),
                    'message': message_text,
                    'created_at': created_at.isoformat()
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
