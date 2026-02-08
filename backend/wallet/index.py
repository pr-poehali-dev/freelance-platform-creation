import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для управления балансом пользователей - пополнение, списание, история транзакций'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': ''
        }
    
    user_id_header = event.get('headers', {}).get('X-User-Id')
    if not user_id_header:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        user_id = int(user_id_header)
        query_params = event.get('queryStringParameters') or {}
        action = query_params.get('action', 'balance')
        
        if method == 'GET' and action == 'balance':
            cur.execute(
                "SELECT id, username, name, email, balance FROM t_p96553691_freelance_platform_c.users WHERE id = %s",
                (user_id,)
            )
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'})
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'balance': float(user['balance'])}, default=str)
            }
        
        if method == 'GET' and action == 'transactions':
            limit = int(query_params.get('limit', 50))
            
            cur.execute("""
                SELECT 
                    t.id,
                    t.type,
                    t.amount,
                    t.description,
                    t.order_id,
                    t.created_at,
                    u.name as related_user_name
                FROM t_p96553691_freelance_platform_c.transactions t
                LEFT JOIN t_p96553691_freelance_platform_c.users u ON t.related_user_id = u.id
                WHERE t.user_id = %s
                ORDER BY t.created_at DESC
                LIMIT %s
            """, (user_id, limit))
            
            transactions = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'transactions': transactions}, default=str)
            }
        
        if method == 'POST':
            data = json.loads(event.get('body', '{}'))
            action = data.get('action')
            
            if action == 'deposit':
                amount = float(data.get('amount', 0))
                
                if amount <= 0:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Amount must be positive'})
                    }
                
                cur.execute("""
                    UPDATE t_p96553691_freelance_platform_c.users 
                    SET balance = balance + %s 
                    WHERE id = %s
                    RETURNING balance
                """, (amount, user_id))
                
                result = cur.fetchone()
                
                cur.execute("""
                    INSERT INTO t_p96553691_freelance_platform_c.transactions 
                    (user_id, type, amount, description)
                    VALUES (%s, %s, %s, %s)
                """, (user_id, 'deposit', amount, 'Пополнение счета'))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True, 
                        'balance': float(result['balance'])
                    })
                }
            
            if action == 'payment':
                order_id = data.get('order_id')
                freelancer_id = data.get('freelancer_id')
                amount = float(data.get('amount', 0))
                
                if amount <= 0:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Amount must be positive'})
                    }
                
                cur.execute(
                    "SELECT balance FROM t_p96553691_freelance_platform_c.users WHERE id = %s",
                    (user_id,)
                )
                user = cur.fetchone()
                
                if not user or user['balance'] < amount:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Insufficient balance'})
                    }
                
                cur.execute("""
                    UPDATE t_p96553691_freelance_platform_c.users 
                    SET balance = balance - %s 
                    WHERE id = %s
                """, (amount, user_id))
                
                cur.execute("""
                    UPDATE t_p96553691_freelance_platform_c.users 
                    SET balance = balance + %s 
                    WHERE id = %s
                """, (amount, freelancer_id))
                
                cur.execute("""
                    INSERT INTO t_p96553691_freelance_platform_c.transactions 
                    (user_id, type, amount, description, order_id, related_user_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (user_id, 'payment', -amount, 'Оплата заказа', order_id, freelancer_id))
                
                cur.execute("""
                    INSERT INTO t_p96553691_freelance_platform_c.transactions 
                    (user_id, type, amount, description, order_id, related_user_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (freelancer_id, 'income', amount, 'Получение оплаты за заказ', order_id, user_id))
                
                if order_id:
                    cur.execute("""
                        UPDATE t_p96553691_freelance_platform_c.orders 
                        SET status = 'completed' 
                        WHERE id = %s
                    """, (order_id,))
                
                conn.commit()
                
                cur.execute(
                    "SELECT balance FROM t_p96553691_freelance_platform_c.users WHERE id = %s",
                    (user_id,)
                )
                updated_user = cur.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True, 
                        'balance': float(updated_user['balance'])
                    })
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
        
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()
