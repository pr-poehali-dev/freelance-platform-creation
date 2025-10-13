import json
import os
import hashlib
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User authentication with login and password
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
    
    database_url = os.environ.get('DATABASE_URL')
    
    if action == 'register':
        username = body_data.get('username', '').strip()
        password = body_data.get('password', '').strip()
        name = body_data.get('name', '').strip() or username
        email = body_data.get('email', '').strip()
        
        if not username or not password:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Username and password are required'}),
                'isBase64Encoded': False
            }
        
        if len(password) < 6:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Password must be at least 6 characters'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(database_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        existing_user = cur.fetchone()
        
        if existing_user:
            cur.close()
            conn.close()
            return {
                'statusCode': 409,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Username already exists'}),
                'isBase64Encoded': False
            }
        
        password_hash = hash_password(password)
        
        cur.execute(
            "INSERT INTO users (username, password_hash, name, email) "
            "VALUES (%s, %s, %s, %s) RETURNING id, username, name, email, created_at",
            (username, password_hash, name, email)
        )
        user = cur.fetchone()
        conn.commit()
        
        user_dict = dict(user)
        user_dict['created_at'] = user_dict['created_at'].isoformat() if user_dict.get('created_at') else None
        
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
                'user': user_dict
            }),
            'isBase64Encoded': False
        }
    
    if action == 'login':
        username = body_data.get('username', '').strip()
        password = body_data.get('password', '').strip()
        
        if not username or not password:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Username and password are required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(database_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        password_hash = hash_password(password)
        
        cur.execute(
            "SELECT id, username, name, email, created_at FROM users "
            "WHERE username = %s AND password_hash = %s",
            (username, password_hash)
        )
        user = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if not user:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid username or password'}),
                'isBase64Encoded': False
            }
        
        user_dict = dict(user)
        user_dict['created_at'] = user_dict['created_at'].isoformat() if user_dict.get('created_at') else None
        
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
