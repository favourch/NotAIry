import { VITE_PRIVY_APP_ID as PRIVY_APP_ID, VITE_PRIVY_APP_SECRET as PRIVY_APP_SECRET } from '$env/static/private';

export async function createPrivyWallet(request: Request) {
  const headers = {
    'Authorization': `Basic ${Buffer.from(`${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`).toString('base64')}`,
    'Content-Type': 'application/json',
    'privy-app-id': PRIVY_APP_ID
  };

  const response = await fetch('https://api.privy.io/api/v1/wallets', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      chain: {
        id: '0x66eee', // Arbitrum Sepolia
        rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc'
      },
      type: 'eoa'
    })
  });

  return response;
} 