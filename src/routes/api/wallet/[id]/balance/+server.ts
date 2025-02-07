import { json } from '@sveltejs/kit';
import { VITE_PRIVY_APP_ID as PRIVY_APP_ID, VITE_PRIVY_APP_SECRET as PRIVY_APP_SECRET } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ params }: RequestEvent) {
  try {
    const headers = {
      'Authorization': `Basic ${Buffer.from(`${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/json',
      'privy-app-id': PRIVY_APP_ID,
      'privy-chain-id': '0x66eee' // Arbitrum Sepolia
    };

    const response = await fetch(`https://api.privy.io/api/v1/wallets/${params.id}/balance`, {
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      return json({ error: data.message }, { status: response.status });
    }

    return json(data);
  } catch (error) {
    return json({ error: 'Failed to get wallet balance' }, { status: 500 });
  }
} 