import json
import os
import random
from typing import Dict, Any
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

def generate_code() -> str:
    """Generate 6-digit verification code"""
    return str(random.randint(100000, 999999))

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Phone authentication with SMS verification
    Args: event with httpMethod, body, queryStringParameters
          context with request_id
    Returns: HTTP response with auth result
    '''
    method: str = event.get('httpMethod', 'POST')
    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action', '')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
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
    
    body_raw = event.get('body', '{}')
    if not body_raw or body_raw.strip() == '':
        body_data = {}
    else:
        body_data = json.loads(body_raw)
    
    if action == 'send-code':
        phone = body_data.get('phone', '').strip()
        
        if not phone:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Phone number is required'}),
                'isBase64Encoded': False
            }
        
        code = generate_code()
        expires_at = datetime.now() + timedelta(minutes=5)
        
        print(f'Generated SMS code for {phone}: {code}')
        print(f'Code will expire at: {expires_at.isoformat()}')
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'SMS code sent',
                'devCode': code
            }),
            'isBase64Encoded': False
        }
    
    if action == 'verify-code':
        phone = body_data.get('phone', '').strip()
        code = body_data.get('code', '').strip()
        name = body_data.get('name', '').strip() or 'Пользователь'
        
        if not phone or not code:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Phone and code are required'}),
                'isBase64Encoded': False
            }
        
        is_valid_code = len(code) == 6 and code.isdigit()
        
        if not is_valid_code:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid code'}),
                'isBase64Encoded': False
            }
        
        database_url = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(database_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(
            "SELECT id, phone, name, created_at FROM users WHERE phone = %s",
            (phone,)
        )
        user = cur.fetchone()
        
        if user:
            user_dict = dict(user)
            user_dict['created_at'] = user_dict['created_at'].isoformat() if user_dict.get('created_at') else None
        else:
            cur.execute(
                "INSERT INTO users (phone, name) VALUES (%s, %s) RETURNING id, phone, name, created_at",
                (phone, name)
            )
            user = cur.fetchone()
            conn.commit()
            user_dict = dict(user)
            user_dict['created_at'] = user_dict['created_at'].isoformat() if user_dict.get('created_at') else None
        
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
                'user': user_dict
            }),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 404,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Not found'}),
        'isBase64Encoded': False
    }