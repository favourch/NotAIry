import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { privateConfigs } from '$lib/config';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { code } = await request.json();
        
        console.log('Attempting to generate token for code:', code);
        
        // Generate a token using your Privy app secret
        const response = await fetch('https://auth.privy.io/api/v1/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                client_id: privateConfigs.PRIVY_CLIENT_ID,
                code
            })
        });

        // Log response status and headers
        console.log('Token Response Status:', response.status);
        console.log('Token Response Headers:', Object.fromEntries(response.headers));

        // If response is not ok, get the error text
        if (!response.ok) {
            const error = await response.json();
            console.error('Token Error Response:', error);
            throw new Error(error.message || 'Failed to get token');
        }

        // Try to parse the response as JSON
        let data;
        try {
            const text = await response.text();
            console.log('Raw response:', text);
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            return json({ error: 'Invalid response format' }, { status: 500 });
        }

        return json(data);
    } catch (error) {
        console.error('Token generation failed:', error);
        return new Response(JSON.stringify({ 
            error: error instanceof Error ? error.message : 'Failed to get token' 
        }), { 
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}; 