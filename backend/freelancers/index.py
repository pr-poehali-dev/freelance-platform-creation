import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для работы с фрилансерами - получение списка, профиля, отзывов'''
    
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
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action', 'list')
    
    if method == 'GET' and action == 'list':
        limit = int(query_params.get('limit', 20))
        if limit > 100:
            limit = 100
        
        cur.execute(f"""
            SELECT 
                f.id,
                f.user_id,
                u.name,
                u.username,
                f.bio,
                f.hourly_rate,
                f.avatar_url,
                f.skills,
                f.rating,
                f.total_reviews,
                f.completed_projects,
                f.created_at
            FROM t_p96553691_freelance_platform_c.freelancers f
            JOIN t_p96553691_freelance_platform_c.users u ON f.user_id = u.id
            ORDER BY f.rating DESC, f.completed_projects DESC
            LIMIT {limit}
        """)
        
        freelancers = [dict(r) for r in cur.fetchall()]
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'freelancers': freelancers}, default=str)
        }
    
    if method == 'GET' and action == 'profile':
        freelancer_id = int(query_params.get('freelancer_id', 0))
        if not freelancer_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'freelancer_id required'})
            }
        
        cur.execute(f"""
            SELECT 
                f.id, f.user_id, u.name, u.username, u.email,
                f.bio, f.hourly_rate, f.avatar_url, f.skills,
                f.rating, f.total_reviews, f.completed_projects, f.created_at
            FROM t_p96553691_freelance_platform_c.freelancers f
            JOIN t_p96553691_freelance_platform_c.users u ON f.user_id = u.id
            WHERE f.id = {freelancer_id}
        """)
        freelancer = cur.fetchone()
        
        if not freelancer:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Freelancer not found'})
            }
        
        cur.execute(f"""
            SELECT r.id, r.rating, r.comment, r.created_at,
                   u.name as client_name, o.title as order_title
            FROM t_p96553691_freelance_platform_c.reviews r
            JOIN t_p96553691_freelance_platform_c.users u ON r.client_id = u.id
            JOIN t_p96553691_freelance_platform_c.orders o ON r.order_id = o.id
            WHERE r.freelancer_id = {freelancer_id}
            ORDER BY r.created_at DESC
            LIMIT 20
        """)
        reviews = [dict(r) for r in cur.fetchall()]
        
        cur.execute(f"""
            SELECT o.id, o.title, o.description, o.category,
                   o.budget_min, o.budget_max, o.status, o.created_at
            FROM t_p96553691_freelance_platform_c.orders o
            WHERE o.executor_id = (
                SELECT user_id FROM t_p96553691_freelance_platform_c.freelancers WHERE id = {freelancer_id}
            ) AND o.status = 'completed'
            ORDER BY o.created_at DESC
            LIMIT 10
        """)
        completed_orders = [dict(r) for r in cur.fetchall()]
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'freelancer': dict(freelancer),
                'reviews': reviews,
                'completed_orders': completed_orders
            }, default=str)
        }
    
    if method == 'POST':
        user_id_header = event.get('headers', {}).get('X-User-Id')
        if not user_id_header:
            cur.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unauthorized'})
            }
        
        data = json.loads(event.get('body', '{}'))
        user_id = int(user_id_header)
        bio = data.get('bio', '').replace("'", "''")
        hourly_rate = int(data.get('hourly_rate', 0))
        avatar_url = data.get('avatar_url', '').replace("'", "''")
        skills = data.get('skills', [])
        skills_str = '{' + ','.join(f'"{s}"' for s in skills) + '}'
        
        cur.execute(f"""
            INSERT INTO t_p96553691_freelance_platform_c.freelancers 
            (user_id, bio, hourly_rate, avatar_url, skills)
            VALUES ({user_id}, '{bio}', {hourly_rate}, '{avatar_url}', '{skills_str}')
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                bio = EXCLUDED.bio,
                hourly_rate = EXCLUDED.hourly_rate,
                avatar_url = EXCLUDED.avatar_url,
                skills = EXCLUDED.skills
            RETURNING id
        """)
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'freelancer_id': result['id']})
        }
    
    cur.close()
    conn.close()
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }
