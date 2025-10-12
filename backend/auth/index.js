/**
 * Business: OAuth авторизация через Google и управление JWT токенами
 * Args: event с httpMethod, body, queryStringParameters; context с requestId
 * Returns: HTTP response с токеном или URL для редиректа
 */

exports.handler = async (event, context) => {
    const { httpMethod, queryStringParameters, body } = event;

    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            body: ''
        };
    }

    if (httpMethod === 'POST' && queryStringParameters?.action === 'verify') {
        const { token } = JSON.parse(body || '{}');
        
        if (!token) {
            return {
                statusCode: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                isBase64Encoded: false,
                body: JSON.stringify({ error: 'Token is required' })
            };
        }

        const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        const tokenInfo = await response.json();

        if (tokenInfo.error || tokenInfo.aud !== GOOGLE_CLIENT_ID) {
            return {
                statusCode: 401,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                isBase64Encoded: false,
                body: JSON.stringify({ error: 'Invalid token' })
            };
        }

        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            isBase64Encoded: false,
            body: JSON.stringify({
                success: true,
                user: {
                    id: tokenInfo.sub,
                    email: tokenInfo.email,
                    name: tokenInfo.name,
                    avatar: tokenInfo.picture
                }
            })
        };
    }

    return {
        statusCode: 404,
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        isBase64Encoded: false,
        body: JSON.stringify({ error: 'Not found' })
    };
};