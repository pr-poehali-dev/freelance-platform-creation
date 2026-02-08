import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get all orders or user's orders from database
    Args: event with httpMethod, queryStringParameters with user_id (optional)
          context with request_id
    Returns: HTTP response with list of orders
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
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
    
    query_params = event.get('queryStringParameters') or {}
    user_id = query_params.get('user_id')
    category = query_params.get('category')
    status = query_params.get('status', 'active')
    
    database_url = os.environ.get('DATABASE_URL')
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT o.*, 
               u.name as user_name, 
               u.username,
               executor.name as executor_name,
               executor.username as executor_username
        FROM t_p96553691_freelance_platform_c.orders o 
        JOIN t_p96553691_freelance_platform_c.users u ON o.user_id = u.id 
        LEFT JOIN t_p96553691_freelance_platform_c.users executor ON o.executor_id = executor.id
        WHERE 1=1
    """
    params = []
    
    if user_id:
        query += " AND o.user_id = %s"
        params.append(int(user_id))
    
    if category:
        query += " AND o.category = %s"
        params.append(category)
    
    if status:
        query += " AND o.status = %s"
        params.append(status)
    
    query += " ORDER BY o.created_at DESC LIMIT 100"
    
    cur.execute(query, params)
    orders = [dict(row) for row in cur.fetchall()]
    
    cur.close()
    conn.close()
    
    for order in orders:
        order['created_at'] = order['created_at'].isoformat() if order.get('created_at') else None
        order['updated_at'] = order['updated_at'].isoformat() if order.get('updated_at') else None
        order['deadline'] = order['deadline'].isoformat() if order.get('deadline') else None
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'orders': orders}),
        'isBase64Encoded': False
    }