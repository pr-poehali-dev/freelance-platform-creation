import json
import os
import uuid
import base64
import psycopg2
from psycopg2.extras import RealDictCursor
import urllib.request

SCHEMA = 't_p96553691_freelance_platform_c'


def yukassa_request(method, path, body=None):
    shop_id = os.environ['YUKASSA_SHOP_ID']
    secret_key = os.environ['YUKASSA_SECRET_KEY']
    credentials = base64.b64encode(f"{shop_id}:{secret_key}".encode()).decode()
    url = f"https://api.yookassa.ru/v3{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header('Authorization', f'Basic {credentials}')
    req.add_header('Content-Type', 'application/json')
    if body:
        req.add_header('Idempotence-Key', str(uuid.uuid4()))
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def handler(event: dict, context) -> dict:
    """ЮКасса: создание платежа для пополнения баланса и обработка webhook."""
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

    method = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    query_params = event.get('queryStringParameters') or {}

    # Webhook от ЮКассы — без авторизации пользователя
    if method == 'POST' and query_params.get('action') == 'webhook':
        body = json.loads(event.get('body', '{}'))
        if body.get('event') != 'payment.succeeded':
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'ok': True})
            }

        payment = body.get('object', {})
        payment_id = payment.get('id')
        metadata = payment.get('metadata', {})
        user_id = int(metadata.get('user_id', 0))
        amount = float(payment.get('amount', {}).get('value', 0))

        if not user_id or not amount:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'ok': True})
            }

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Проверяем, не был ли этот платёж уже зачислен
        cur.execute(f"SELECT id FROM {SCHEMA}.transactions WHERE description LIKE '%{payment_id}%' AND user_id = {user_id}")
        if cur.fetchone():
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'ok': True})
            }

        cur.execute(f"UPDATE {SCHEMA}.users SET balance = balance + {amount} WHERE id = {user_id}")
        cur.execute(f"""
            INSERT INTO {SCHEMA}.transactions (user_id, type, amount, description)
            VALUES ({user_id}, 'deposit', {amount}, 'Пополнение через ЮКасса (payment_id: {payment_id})')
        """)
        conn.commit()
        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'ok': True})
        }

    # Создание платежа
    if method == 'POST':
        user_id_str = headers.get('X-User-Id') or headers.get('x-user-id')
        if not user_id_str:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unauthorized'})
            }

        body = json.loads(event.get('body', '{}'))
        amount = float(body.get('amount', 0))
        return_url = body.get('return_url', 'https://preview--freelance-platform-creation.poehali.dev/')

        if amount < 10:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Минимальная сумма пополнения — 10 ₽'})
            }

        payment = yukassa_request('POST', '/payments', {
            'amount': {'value': f"{amount:.2f}", 'currency': 'RUB'},
            'confirmation': {'type': 'redirect', 'return_url': return_url},
            'capture': True,
            'description': f'Пополнение счёта фриланс-платформы',
            'metadata': {'user_id': str(user_id_str)}
        })

        confirmation_url = payment.get('confirmation', {}).get('confirmation_url')
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'confirmation_url': confirmation_url, 'payment_id': payment.get('id')})
        }

    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }
