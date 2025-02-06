import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  const PRIVY_API_BASE = 'https://api.privy.io/api/v1';
  const vars = {
    APP_ID: import.meta.env.VITE_PRIVY_APP_ID,
    APP_SECRET: import.meta.env.VITE_PRIVY_APP_SECRET,
    CLIENT_ID: import.meta.env.VITE_PRIVY_CLIENT_ID
  };

  try {
    const auth = Buffer.from(`${vars.APP_ID}:${vars.APP_SECRET}`).toString('base64');
    
    const response = await fetch(`${PRIVY_API_BASE}/wallets/${params.id}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'privy-app-id': vars.APP_ID,
        'Content-Type': 'application/json',
        'privy-client-id': vars.CLIENT_ID
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      return json({
        error: data.message || 'Failed to get wallet balance',
        details: data
      }, { status: response.status });
    }

    return json({
      balance: data.wallet?.balance || '0',
      address: data.wallet?.address
    });
  } catch (error) {
    console.error('Failed to get wallet balance:', error);
    return json({ 
      error: 'Failed to get wallet balance',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}; 