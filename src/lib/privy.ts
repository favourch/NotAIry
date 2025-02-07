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
    'Content-Type': 'application/json',
    'privy-client-id': import.meta.env.VITE_PRIVY_CLIENT_ID,
    'Origin': window.location.origin,
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'authorization, content-type, privy-app-id, privy-client-id'
  };
};

// API wrapper functions
export async function createWallet() {
  try {
    // First check if we have a stored wallet
    try {
      const storedWallet = localStorage.getItem('notairy_wallet');
      if (storedWallet) {
        const parsed = JSON.parse(storedWallet);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
        // Invalid stored data, remove it
        localStorage.removeItem('notairy_wallet');
      }
    } catch (e) {
      console.warn('Failed to parse stored wallet:', e);
      localStorage.removeItem('notairy_wallet');
    }

    // Test if server is reachable
    console.log('Testing server connection...');
    try {
      const testResponse = await fetch('/api/test');
      const testData = await testResponse.json();
      console.log('Test response:', testData);
    } catch (e) {
      console.error('Server test failed:', e);
      throw new Error('Could not connect to server');
    }

    console.log('Sending request to /api/wallet');
    const response = await fetch('/api/wallet', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const text = await response.text();
    console.log('Raw response:', text);

    if (!text) {
      throw new Error('Empty response from server');
    }

    let data;
    try {
      data = JSON.parse(text);
      console.log('Parsed response:', data);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${text}`);
    }

    if (!response.ok) {
      throw new Error(data.error || 'Server error');
    }

    if (!data.wallet) {
      throw new Error('No wallet data in response');
    }
    
    // Store wallet info
    localStorage.setItem('notairy_wallet', JSON.stringify(data.wallet));
    return data.wallet;
  } catch (error) {
    console.error('Failed to create wallet:', error);
    throw error;
  }
}

// Get wallet balance from Privy
export async function getWalletBalance(wallet: any): Promise<string> {
  try {
    // Extract wallet ID or address
    const walletId = wallet?.id || wallet;
    if (!walletId) {
      throw new Error('No wallet ID provided');
    }

    const response = await fetch(`/api/wallet/${walletId}/balance`);
    
    if (!response.ok) {
      throw new Error('Failed to get wallet balance');
    }
    
    const data = await response.json();
    return data.balance;
  } catch (error) {
    console.error('Failed to get balance:', error);
    return '0';  // Return '0' as default balance on error
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