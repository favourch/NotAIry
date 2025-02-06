// Constants
const PRIVY_API_BASE = 'https://api.privy.io/api/v1';
const APP_ID = import.meta.env.VITE_PRIVY_APP_ID;
const APP_SECRET = import.meta.env.VITE_PRIVY_APP_SECRET;

// Basic headers required for all requests
const getBaseHeaders = () => {
  const auth = btoa(`${APP_ID}:${APP_SECRET}`);
  return {
    'Authorization': `Basic ${auth}`,
    'privy-app-id': APP_ID,
    'Content-Type': 'application/json'
  };
};

// API wrapper functions
export async function createWallet() {
  try {
    // First check if we have a stored wallet
    const storedWallet = localStorage.getItem('notairy_wallet');
    if (storedWallet) {
      return JSON.parse(storedWallet);
    }

    // Create new wallet if none exists
    const response = await fetch(`${PRIVY_API_BASE}/wallets`, {
      method: 'POST',
      headers: getBaseHeaders(),
      body: JSON.stringify({
        type: 'server'
      })
    });

    if (!response.ok) throw new Error('Failed to create wallet');
    const data = await response.json();
    
    // Store wallet info
    localStorage.setItem('notairy_wallet', JSON.stringify(data.wallet));
    return data.wallet;
  } catch (error) {
    console.error('Failed to create wallet:', error);
    throw error;
  }
}

export async function getWalletBalance(walletId: string) {
  try {
    const response = await fetch(`${PRIVY_API_BASE}/wallets/${walletId}`, {
      headers: getBaseHeaders()
    });

    if (!response.ok) throw new Error('Failed to get wallet');
    const data = await response.json();
    return data.wallet.balance;
  } catch (error) {
    console.error('Failed to get balance:', error);
    throw error;
  }
}

export async function submitNote(walletId: string, note: {
  content: string;
  type: string;
  sourceUrl?: string;
}) {
  try {
    const response = await fetch(`${PRIVY_API_BASE}/wallets/${walletId}/rpc`, {
      method: 'POST',
      headers: getBaseHeaders(),
      body: JSON.stringify({
        method: 'eth_sendTransaction',
        params: [{
          to: import.meta.env.VITE_CONTRACT_ADDRESS,
          data: JSON.stringify(note),
          value: '0x0'
        }]
      })
    });

    if (!response.ok) throw new Error('Failed to submit note');
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Failed to submit note:', error);
    throw error;
  }
}

export async function verifyNote(walletId: string, noteId: string, verdict: boolean) {
  try {
    const response = await fetch(`${PRIVY_API_BASE}/wallets/${walletId}/rpc`, {
      method: 'POST',
      headers: getBaseHeaders(),
      body: JSON.stringify({
        method: 'eth_sendTransaction',
        params: [{
          to: import.meta.env.VITE_CONTRACT_ADDRESS,
          data: JSON.stringify({ noteId, verdict }),
          value: '0x0'
        }]
      })
    });

    if (!response.ok) throw new Error('Failed to verify note');
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Failed to verify note:', error);
    throw error;
  }
}

// Add logout function
export function logout() {
  localStorage.removeItem('notairy_wallet');
} 