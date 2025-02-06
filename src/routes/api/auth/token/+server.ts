import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PRIVY_CLIENT_ID } from '$lib/config';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { email } = await request.json();
        
        console.log('Attempting to generate token for email:', email);
        
        // Generate a token using your Privy app secret
        const response = await fetch('https://auth.privy.io/api/v1/auth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_PRIVY_APP_SECRET}`
            },
            body: JSON.stringify({
                app_id: import.meta.env.VITE_PRIVY_APP_ID,
                client_id: PRIVY_CLIENT_ID,
                email: email
            })
        });

        // Log response status and headers
        console.log('Token Response Status:', response.status);
        console.log('Token Response Headers:', Object.fromEntries(response.headers));

        // If response is not ok, get the error text
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Token Error Response:', errorText);
            return json({ error: 'Token generation failed', details: errorText }, { status: response.status });
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
        return json({ 
            error: 'Failed to generate token', 
            details: error instanceof Error ? error.message : String(error) 
        }, { status: 500 });
    }
}; 