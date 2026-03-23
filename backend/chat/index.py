import json
import os
import base64
import uuid
import boto3
import psycopg2
from psycopg2.extras import RealDictCursor

CHAT_URL = 'https://functions.poehali.dev/860360d2-628f-498b-b4af-a6be44d35b25'

def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

def upload_file(file_data_b64: str, file_name: str, file_type: str) -> str:
    s3 = get_s3()
    ext = file_name.rsplit('.', 1)[-1] if '.' in file_name else 'bin'
    key = f'chat-files/{uuid.uuid4()}.{ext}'
    data = base64.b64decode(file_data_b64)
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType=file_type or 'application/octet-stream')
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return cdn_url

def handler(event: dict, context) -> dict:
    '''API для работы с чатами: отправка сообщений, файлов, редактирование'''
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
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется авторизация'}),
            'isBase64Encoded': False
        }

    user_id = int(user_id_str)
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    def resp(status, data):
        return {
            'statusCode': status,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(data, default=str),
            'isBase64Encoded': False
        }

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
                        CASE WHEN c.client_id = %s THEN c.freelancer_id ELSE c.client_id END as other_user_id,
                        CASE WHEN c.client_id = %s THEN u_freelancer.name ELSE u_client.name END as other_user_name,
                        (SELECT m.message FROM t_p96553691_freelance_platform_c.messages m
                         WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
                        (SELECT m.created_at FROM t_p96553691_freelance_platform_c.messages m
                         WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time
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
                return resp(200, {'chats': chats})

            elif action == 'messages':
                chat_id = query_params.get('chat_id')
                if not chat_id:
                    return resp(400, {'error': 'chat_id обязателен'})
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
                    msg['edited_at'] = msg['edited_at'].isoformat() if msg.get('edited_at') else None
                return resp(200, {'messages': messages})

            elif action == 'presign':
                file_name = query_params.get('file_name', 'file')
                file_type = query_params.get('file_type', 'application/octet-stream')
                ext = file_name.rsplit('.', 1)[-1] if '.' in file_name else 'bin'
                key = f'chat-files/{uuid.uuid4()}.{ext}'
                s3 = get_s3()
                upload_url = s3.generate_presigned_url(
                    'put_object',
                    Params={'Bucket': 'files', 'Key': key, 'ContentType': file_type},
                    ExpiresIn=3600,
                )
                cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
                return resp(200, {'upload_url': upload_url, 'cdn_url': cdn_url, 'key': key})

        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action', 'send')

            if action == 'create':
                order_id = body.get('order_id')
                other_user_id = body.get('other_user_id')
                if not order_id or not other_user_id:
                    return resp(400, {'error': 'order_id и other_user_id обязательны'})
                cur.execute("SELECT user_id FROM t_p96553691_freelance_platform_c.orders WHERE id = %s", (order_id,))
                order_owner = cur.fetchone()
                if not order_owner:
                    return resp(404, {'error': 'Заказ не найден'})
                client_id = order_owner['user_id']
                freelancer_id = other_user_id if user_id == client_id else user_id
                cur.execute("""
                    SELECT id FROM t_p96553691_freelance_platform_c.chats
                    WHERE order_id = %s AND client_id = %s AND freelancer_id = %s
                """, (order_id, client_id, freelancer_id))
                existing_chat = cur.fetchone()
                if existing_chat:
                    return resp(200, {'chat_id': existing_chat['id']})
                cur.execute("""
                    INSERT INTO t_p96553691_freelance_platform_c.chats (order_id, client_id, freelancer_id)
                    VALUES (%s, %s, %s) RETURNING id
                """, (order_id, client_id, freelancer_id))
                new_chat = cur.fetchone()
                conn.commit()
                return resp(201, {'chat_id': new_chat['id']})

            elif action == 'delete':
                chat_id = body.get('chat_id')
                if not chat_id:
                    return resp(400, {'error': 'chat_id обязателен'})
                cur.execute("""
                    SELECT id FROM t_p96553691_freelance_platform_c.chats
                    WHERE id = %s AND (client_id = %s OR freelancer_id = %s)
                """, (chat_id, user_id, user_id))
                if not cur.fetchone():
                    return resp(403, {'error': 'Нет доступа или чат не найден'})
                cur.execute("DELETE FROM t_p96553691_freelance_platform_c.messages WHERE chat_id = %s", (chat_id,))
                cur.execute("DELETE FROM t_p96553691_freelance_platform_c.chats WHERE id = %s", (chat_id,))
                conn.commit()
                return resp(200, {'success': True})

            elif action == 'send':
                chat_id = body.get('chat_id')
                message = body.get('message', '').strip()
                file_url = body.get('file_url')
                file_name = body.get('file_name')
                file_type = body.get('file_type')
                # legacy base64 fallback
                file_data = body.get('file_data')

                if not chat_id or (not message and not file_url and not file_data):
                    return resp(400, {'error': 'chat_id и message или файл обязательны'})

                if not file_url and file_data and file_name and file_type:
                    file_url = upload_file(file_data, file_name, file_type)

                cur.execute("""
                    INSERT INTO t_p96553691_freelance_platform_c.messages
                        (chat_id, sender_id, message, file_url, file_name, file_type)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, chat_id, sender_id, message, file_url, file_name, file_type, created_at, edited_at
                """, (chat_id, user_id, message or '', file_url, file_name, file_type))
                new_message = dict(cur.fetchone())
                conn.commit()
                new_message['created_at'] = new_message['created_at'].isoformat() if new_message.get('created_at') else None
                new_message['edited_at'] = None
                return resp(201, {'message': new_message})

            elif action == 'edit':
                message_id = body.get('message_id')
                new_text = body.get('message', '').strip()
                if not message_id or not new_text:
                    return resp(400, {'error': 'message_id и message обязательны'})
                cur.execute("""
                    SELECT id, sender_id FROM t_p96553691_freelance_platform_c.messages WHERE id = %s
                """, (message_id,))
                msg = cur.fetchone()
                if not msg:
                    return resp(404, {'error': 'Сообщение не найдено'})
                if msg['sender_id'] != user_id:
                    return resp(403, {'error': 'Нельзя редактировать чужое сообщение'})
                cur.execute("""
                    UPDATE t_p96553691_freelance_platform_c.messages
                    SET message = %s, edited_at = NOW()
                    WHERE id = %s
                    RETURNING id, chat_id, sender_id, message, file_url, file_name, file_type, created_at, edited_at
                """, (new_text, message_id))
                updated = dict(cur.fetchone())
                conn.commit()
                updated['created_at'] = updated['created_at'].isoformat() if updated.get('created_at') else None
                updated['edited_at'] = updated['edited_at'].isoformat() if updated.get('edited_at') else None
                return resp(200, {'message': updated})

        return resp(400, {'error': 'Неизвестное действие'})

    except Exception as e:
        conn.rollback()
        return resp(500, {'error': f'Ошибка сервера: {str(e)}'})
    finally:
        cur.close()
        conn.close()