import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const PRIVY_API_URL = 'https://auth.privy.io/api/v1';

export const POST: RequestHandler = async ({ request }) => {
    const { action, email, verification_token } = await request.json();
    
    try {
        if (action === 'create') {
            const response = await fetch(`${PRIVY_API_URL}/auth/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_PRIVY_APP_SECRET}`
                },
                body: JSON.stringify({
                    app_id: import.meta.env.VITE_PRIVY_APP_ID,
                    type: 'email',
                    email: email,
                    redirect_url: `${request.headers.get('origin')}/dashboard`
                })
            });

            // Log response status and headers for debugging
            console.log('Create Response Status:', response.status);
            console.log('Create Response Headers:', Object.fromEntries(response.headers));

            // Check if response is ok before trying to parse JSON
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Create Error Response:', errorText);
                return json({ error: 'Authentication request failed' }, { status: response.status });
            }

            try {
                const data = await response.json();
                return json(data);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                return json({ error: 'Invalid response format' }, { status: 500 });
            }
        }
        
        if (action === 'verify') {
            const response = await fetch(`${PRIVY_API_URL}/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_PRIVY_APP_SECRET}`
                },
                body: JSON.stringify({
                    verification_token
                })
            });

            // Log response status and headers for debugging
            console.log('Verify Response Status:', response.status);
            console.log('Verify Response Headers:', Object.fromEntries(response.headers));

            // Check if response is ok before trying to parse JSON
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Verify Error Response:', errorText);
                return json({ error: 'Verification failed' }, { status: response.status });
            }

            try {
                const data = await response.json();
                return json(data);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                return json({ error: 'Invalid response format' }, { status: 500 });
            }
        }

        return json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Auth error:', error);
        return json({ error: 'Authentication failed', details: error.message }, { status: 500 });
    }
}; 