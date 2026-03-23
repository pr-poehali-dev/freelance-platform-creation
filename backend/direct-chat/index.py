import json
import os
import base64
import uuid
import boto3
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p96553691_freelance_platform_c'

def get_cdn_url(key):
    access_key = os.environ['AWS_ACCESS_KEY_ID']
    return f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"

def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

def handler(event: dict, context) -> dict:
    """Прямые чаты между пользователями с поддержкой файловых вложений."""
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

    if method == 'GET':
        action = query_params.get('action', 'list')

        if action == 'list':
            cur.execute(f"""
                SELECT
                    dc.id as chat_id,
                    CASE WHEN dc.user1_id = {user_id} THEN dc.user2_id ELSE dc.user1_id END as other_user_id,
                    CASE WHEN dc.user1_id = {user_id} THEN u2.name ELSE u1.name END as other_user_name,
                    (SELECT dm.message FROM {SCHEMA}.direct_messages dm WHERE dm.direct_chat_id = dc.id ORDER BY dm.created_at DESC LIMIT 1) as last_message,
                    (SELECT dm.file_name FROM {SCHEMA}.direct_messages dm WHERE dm.direct_chat_id = dc.id ORDER BY dm.created_at DESC LIMIT 1) as last_file_name,
                    (SELECT dm.created_at FROM {SCHEMA}.direct_messages dm WHERE dm.direct_chat_id = dc.id ORDER BY dm.created_at DESC LIMIT 1) as last_message_time
                FROM {SCHEMA}.direct_chats dc
                JOIN {SCHEMA}.users u1 ON dc.user1_id = u1.id
                JOIN {SCHEMA}.users u2 ON dc.user2_id = u2.id
                WHERE dc.user1_id = {user_id} OR dc.user2_id = {user_id}
                ORDER BY last_message_time DESC NULLS LAST
            """)
            chats = [dict(r) for r in cur.fetchall()]
            for c in chats:
                if c.get('last_message_time'):
                    c['last_message_time'] = c['last_message_time'].isoformat()
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'chats': chats})
            }

        if action == 'presign':
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
            cdn_url = get_cdn_url(key)
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'upload_url': upload_url, 'cdn_url': cdn_url, 'key': key})
            }

        if action == 'messages':
            chat_id = int(query_params.get('chat_id', 0))
            if not chat_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'chat_id обязателен'})
                }
            cur.execute(f"""
                SELECT dm.*, u.name as sender_name
                FROM {SCHEMA}.direct_messages dm
                JOIN {SCHEMA}.users u ON dm.sender_id = u.id
                WHERE dm.direct_chat_id = {chat_id}
                ORDER BY dm.created_at ASC
            """)
            messages = [dict(r) for r in cur.fetchall()]
            for m in messages:
                if m.get('created_at'):
                    m['created_at'] = m['created_at'].isoformat()
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'messages': messages})
            }

    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', 'send')

        if action == 'create':
            other_user_id = int(body.get('other_user_id', 0))
            if not other_user_id or other_user_id == user_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'other_user_id обязателен'})
                }

            u1 = min(user_id, other_user_id)
            u2 = max(user_id, other_user_id)

            cur.execute(f"SELECT id FROM {SCHEMA}.direct_chats WHERE user1_id = {u1} AND user2_id = {u2}")
            existing = cur.fetchone()
            if existing:
                cur.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'chat_id': existing['id']})
                }

            cur.execute(f"INSERT INTO {SCHEMA}.direct_chats (user1_id, user2_id) VALUES ({u1}, {u2}) RETURNING id")
            new_chat = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'chat_id': new_chat['id']})
            }

        if action == 'send':
            chat_id = int(body.get('chat_id', 0))
            message = (body.get('message') or '').strip()
            file_url = body.get('file_url')
            file_name = body.get('file_name', '')
            file_type = body.get('file_type', '')
            # legacy base64 fallback
            file_data = body.get('file_data')

            if not chat_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'chat_id обязателен'})
                }

            if not message and not file_url and not file_data:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нужно сообщение или файл'})
                }

            if not file_url and file_data:
                ext = file_name.split('.')[-1] if '.' in file_name else 'bin'
                key = f"chat-files/{chat_id}/{uuid.uuid4()}.{ext}"
                file_bytes = base64.b64decode(file_data)
                s3 = get_s3()
                s3.put_object(Bucket='files', Key=key, Body=file_bytes, ContentType=file_type or 'application/octet-stream')
                file_url = get_cdn_url(key)

            msg_text = message.replace("'", "''") if message else ''
            f_url = file_url.replace("'", "''") if file_url else None
            f_name = file_name.replace("'", "''") if file_name else None
            f_type = file_type.replace("'", "''") if file_type else None

            if f_url:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.direct_messages (direct_chat_id, sender_id, message, file_url, file_name, file_type)
                    VALUES ({chat_id}, {user_id}, '{msg_text}', '{f_url}', '{f_name}', '{f_type}')
                    RETURNING id, created_at
                """)
            else:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.direct_messages (direct_chat_id, sender_id, message)
                    VALUES ({chat_id}, {user_id}, '{msg_text}')
                    RETURNING id, created_at
                """)

            row = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'message': {
                        'id': row['id'],
                        'direct_chat_id': chat_id,
                        'sender_id': user_id,
                        'message': message,
                        'file_url': file_url,
                        'file_name': file_name if file_data else None,
                        'file_type': file_type if file_data else None,
                        'created_at': row['created_at'].isoformat()
                    }
                })
            }

    cur.close()
    conn.close()
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }