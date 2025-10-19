import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Update existing order details
    Args: event - dict with httpMethod, body containing order_id and update fields
          context - object with request_id attribute
    Returns: HTTP response dict with success status
    '''
    method: str = event.get('httpMethod', 'PUT')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'PUT':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    order_id = body_data.get('order_id')
    
    if not order_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'order_id is required'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database configuration missing'})
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    update_fields = []
    values = []
    
    if 'title' in body_data:
        update_fields.append('title = %s')
        values.append(body_data['title'])
    
    if 'description' in body_data:
        update_fields.append('description = %s')
        values.append(body_data['description'])
    
    if 'budget' in body_data:
        budget_str = body_data['budget'].replace(' ', '').replace('₽', '')
        try:
            budget_val = int(budget_str)
            update_fields.append('budget_min = %s')
            values.append(budget_val)
            update_fields.append('budget_max = %s')
            values.append(budget_val)
        except ValueError:
            pass
    
    if 'category' in body_data:
        update_fields.append('category = %s')
        values.append(body_data['category'])
    
    if 'deadline' in body_data:
        update_fields.append('deadline = %s')
        values.append(body_data['deadline'])
    
    if not update_fields:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No fields to update'})
        }
    
    update_fields.append('updated_at = CURRENT_TIMESTAMP')
    values.append(order_id)
    
    schema = 't_p96553691_freelance_platform_c'
    query = f"UPDATE {schema}.orders SET {', '.join(update_fields)} WHERE id = %s"
    
    cur.execute(query, values)
    conn.commit()
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'success': True, 'message': 'Order updated successfully'})
    }