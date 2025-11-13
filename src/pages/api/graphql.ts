import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        // Get the request body and authorization header from the client
        const body = await request.json();
        const authHeader = request.headers.get('authorization');

        // Forward the request to the actual GraphQL API
        const response = await fetch('https://api.hardcover.app/v1/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader && { 'Authorization': authHeader })
            },
            body: JSON.stringify(body)
        });

        // Get the response data
        const data = await response.json();

        // Return the response with CORS headers
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Proxy request failed' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};

// Handle OPTIONS preflight requests
export const OPTIONS: APIRoute = async () => {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
};
