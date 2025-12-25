import json
import os
from typing import Dict, Any
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Create new order on freelance platform
    Args: event with httpMethod, body containing order details, headers with X-User-Id
          context with request_id
    Returns: HTTP response with created order data
    '''
    method: str = event.get('httpMethod', 'POST')
    
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
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
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
    
    body_data = json.loads(event.get('body', '{}'))
    
    title = body_data.get('title', '').strip()
    description = body_data.get('description', '').strip()
    category = body_data.get('category', '').strip()
    budget_min = body_data.get('budget_min')
    budget_max = body_data.get('budget_max')
    deadline = body_data.get('deadline')
    
    if not title or not description or not category:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Title, description and category are required'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(
        "INSERT INTO t_p96553691_freelance_platform_c.orders (user_id, title, description, category, budget_min, budget_max, deadline, status) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, 'active') RETURNING id, title, description, category, budget_min, budget_max, deadline, status, created_at",
        (int(user_id), title, description, category, budget_min, budget_max, deadline)
    )
    
    order = dict(cur.fetchone())
    conn.commit()
    
    cur.close()
    conn.close()
    
    order['created_at'] = order['created_at'].isoformat() if order.get('created_at') else None
    order['deadline'] = order['deadline'].isoformat() if order.get('deadline') else None
    
    return {
        'statusCode': 201,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'order': order}),
        'isBase64Encoded': False
    }