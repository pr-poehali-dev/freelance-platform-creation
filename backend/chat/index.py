import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для работы с чатами между пользователями'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
            action = query_params.get('action', 'list')

            if action == 'list':
                cur.execute("""
                    SELECT DISTINCT
                        c.id as chat_id,
                        c.order_id,
                        o.title as order_title,
                        CASE 
                            WHEN c.client_id = %s THEN c.freelancer_id
                            ELSE c.client_id
                        END as other_user_id,
                        CASE 
                            WHEN c.client_id = %s THEN u_freelancer.name
                            ELSE u_client.name
                        END as other_user_name,
                        (SELECT m.message FROM t_p96553691_freelance_platform_c.messages m 
                         WHERE m.chat_id = c.id 
                         ORDER BY m.created_at DESC LIMIT 1) as last_message,
                        (SELECT m.created_at FROM t_p96553691_freelance_platform_c.messages m 
                         WHERE m.chat_id = c.id 
                         ORDER BY m.created_at DESC LIMIT 1) as last_message_time
                    FROM t_p96553691_freelance_platform_c.chats c
                    JOIN t_p96553691_freelance_platform_c.orders o ON c.order_id = o.id
                    JOIN t_p96553691_freelance_platform_c.users u_freelancer ON c.freelancer_id = u_freelancer.id
                    JOIN t_p96553691_freelance_platform_c.users u_client ON c.client_id = u_client.id
                    WHERE c.client_id = %s OR c.freelancer_id = %s
                    ORDER BY last_message_time DESC NULLS LAST
                """, (user_id, user_id, user_id, user_id))
                
                chats = [dict(row) for row in cur.fetchall()]
                for chat in chats:
                    if chat.get('last_message_time'):
                        chat['last_message_time'] = chat['last_message_time'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'chats': chats}),
                    'isBase64Encoded': False
                }

            elif action == 'messages':
                chat_id = query_params.get('chat_id')
                if not chat_id:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'chat_id обязателен'}),
                        'isBase64Encoded': False
                    }

                cur.execute("""
                    SELECT m.*, u.name as sender_name
                    FROM t_p96553691_freelance_platform_c.messages m
                    JOIN t_p96553691_freelance_platform_c.users u ON m.sender_id = u.id
                    WHERE m.chat_id = %s
                    ORDER BY m.created_at ASC
                """, (int(chat_id),))
                
                messages = [dict(row) for row in cur.fetchall()]
                for msg in messages:
                    msg['created_at'] = msg['created_at'].isoformat() if msg.get('created_at') else None
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'messages': messages}),
                    'isBase64Encoded': False
                }

        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action', 'send')

            if action == 'create':
                order_id = body.get('order_id')
                other_user_id = body.get('other_user_id')
                
                if not order_id or not other_user_id:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'order_id и other_user_id обязательны'}),
                        'isBase64Encoded': False
                    }

                cur.execute("""
                    SELECT user_id FROM t_p96553691_freelance_platform_c.orders WHERE id = %s
                """, (order_id,))
                order_owner = cur.fetchone()
                
                if not order_owner:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Заказ не найден'}),
                        'isBase64Encoded': False
                    }

                client_id = order_owner['user_id']
                freelancer_id = other_user_id if user_id == client_id else user_id

                cur.execute("""
                    SELECT id FROM t_p96553691_freelance_platform_c.chats 
                    WHERE order_id = %s AND client_id = %s AND freelancer_id = %s
                """, (order_id, client_id, freelancer_id))
                
                existing_chat = cur.fetchone()
                
                if existing_chat:
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'chat_id': existing_chat['id']}),
                        'isBase64Encoded': False
                    }

                cur.execute("""
                    INSERT INTO t_p96553691_freelance_platform_c.chats (order_id, client_id, freelancer_id)
                    VALUES (%s, %s, %s)
                    RETURNING id
                """, (order_id, client_id, freelancer_id))
                
                new_chat = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'chat_id': new_chat['id']}),
                    'isBase64Encoded': False
                }

            elif action == 'send':
                chat_id = body.get('chat_id')
                message = body.get('message', '').strip()
                
                if not chat_id or not message:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'chat_id и message обязательны'}),
                        'isBase64Encoded': False
                    }

                cur.execute("""
                    INSERT INTO t_p96553691_freelance_platform_c.messages (chat_id, sender_id, message)
                    VALUES (%s, %s, %s)
                    RETURNING id, chat_id, sender_id, message, created_at
                """, (chat_id, user_id, message))
                
                new_message = cur.fetchone()
                conn.commit()
                
                msg_dict = dict(new_message)
                msg_dict['created_at'] = msg_dict['created_at'].isoformat() if msg_dict.get('created_at') else None
                
                return {
                    'statusCode': 201,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'message': msg_dict}),
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
