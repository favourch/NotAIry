import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  console.log('Received request to /api/wallet');

  const PRIVY_API_BASE = 'https://api.privy.io/api/v1';
  const vars = {
    APP_ID: import.meta.env.VITE_PRIVY_APP_ID,
    APP_SECRET: import.meta.env.VITE_PRIVY_APP_SECRET,
    CLIENT_ID: import.meta.env.VITE_PRIVY_CLIENT_ID
  };

  // Check environment variables
  if (!vars.APP_ID || !vars.APP_SECRET || !vars.CLIENT_ID) {
    console.error('Missing environment variables:', {
      APP_ID: !!vars.APP_ID,
      APP_SECRET: !!vars.APP_SECRET,
      CLIENT_ID: !!vars.CLIENT_ID
    });
    return json({
      error: 'Server configuration error',
      env: {
        APP_ID: !!vars.APP_ID,
        APP_SECRET: !!vars.APP_SECRET,
        CLIENT_ID: !!vars.CLIENT_ID
      }
    }, { status: 500 });
  }

  try {
    const auth = Buffer.from(`${vars.APP_ID}:${vars.APP_SECRET}`).toString('base64');
    
    const walletData = {
      wallet_type: 'server',
      chain_type: 'ethereum',
      network: {
        chain_id: 8453,
        name: 'base'
      },
      purpose: 'NotAIry Wallet',
      external_id: `notairy-${Date.now()}`
    };

    console.log('Creating wallet with data:', walletData);

    const response = await fetch(`${PRIVY_API_BASE}/wallets`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'privy-app-id': vars.APP_ID,
        'Content-Type': 'application/json',
        'privy-client-id': vars.CLIENT_ID
      },
      body: JSON.stringify(walletData)
    });

    const text = await response.text();
    console.log('Raw Privy API Response:', text);

    let data;
    try {
      data = JSON.parse(text);
      console.log('Parsed Privy API Response:', data);
    } catch (e) {
      console.error('Failed to parse Privy response:', e);
      return json({
        error: 'Invalid response from Privy API',
        raw: text
      }, { status: 500 });
    }
    
    if (!response.ok) {
      console.error('Privy API error:', data);
      return json({
        error: data.message || 'Failed to create wallet',
        details: data
      }, { status: response.status });
    }

    // The wallet data is directly in the response
    if (!data.id || !data.address) {
      console.error('Missing required wallet fields:', data);
      return json({
        error: 'Invalid wallet data',
        details: data
      }, { status: 500 });
    }

    // Format the wallet data
    const wallet = {
      id: data.id,
      address: data.address,
      chainType: data.chain_type,
      createdAt: data.created_at,
      policyIds: data.policy_ids || []
    };

    return json({ wallet });
  } catch (error) {
    console.error('Failed to create wallet:', error);
    return json({ 
      error: 'Failed to create wallet',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}; 