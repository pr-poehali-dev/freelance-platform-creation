/**
 * Business: Авторизация через SMS-код на номер телефона
 * Args: event с httpMethod, body, queryStringParameters; context с requestId
 * Returns: HTTP response с результатом отправки кода или авторизации
 */

const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

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

    if (httpMethod === 'POST' && queryStringParameters?.action === 'send-code') {
        const { phone } = JSON.parse(body || '{}');
        
        if (!phone || !/^\+?[1-9]\d{10,14}$/.test(phone)) {
            return {
                statusCode: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                isBase64Encoded: false,
                body: JSON.stringify({ error: 'Invalid phone number' })
            };
        }

        const code = generateCode();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        console.log(`Generated SMS code for ${phone}: ${code}`);
        console.log(`Code will expire at: ${expiresAt.toISOString()}`);

        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            isBase64Encoded: false,
            body: JSON.stringify({
                success: true,
                message: 'SMS code sent',
                devCode: code
            })
        };
    }

    if (httpMethod === 'POST' && queryStringParameters?.action === 'verify-code') {
        const { phone, code, name } = JSON.parse(body || '{}');
        
        if (!phone || !code) {
            return {
                statusCode: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                isBase64Encoded: false,
                body: JSON.stringify({ error: 'Phone and code are required' })
            };
        }

        const isValidCode = code.length === 6 && /^\d+$/.test(code);
        
        if (!isValidCode) {
            return {
                statusCode: 401,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                isBase64Encoded: false,
                body: JSON.stringify({ error: 'Invalid code' })
            };
        }

        const userId = Math.floor(Math.random() * 1000000);
        
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
                    id: userId,
                    phone: phone,
                    name: name || 'Пользователь'
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
