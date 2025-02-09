import { PRIVY_APP_ID, PRIVY_APP_SECRET } from '$env/static/private';

export async function createPrivyWallet(request: Request) {
  try {
    const headers = {
      'Authorization': `Basic ${Buffer.from(`${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/json',
      'privy-app-id': PRIVY_APP_ID
    };

    // Get auth token from request
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      headers['privy-token'] = authHeader.split(' ')[1];
    }

    const response = await fetch('https://api.privy.io/api/v1/wallets', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        chain: {
          id: '0x66eee', // Arbitrum Sepolia
          rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc'
        },
        type: 'eoa',
        purpose: 'onchain_storytelling'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Privy API error:', error);
      throw new Error(error.message || 'Failed to create wallet');
    }

    return response;
  } catch (error) {
    console.error('Error in createPrivyWallet:', error);
    throw error;
  }
} 