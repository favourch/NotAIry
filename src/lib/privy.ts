import { PUBLIC_PRIVY_APP_ID } from '$env/static/public';

interface PrivyUser {
  id: string;
  email?: string;
  wallet?: {
    address: string;
  };
}

declare global {
  interface Window {
    PrivyLogin: any;
  }
}

let privyLoadPromise: Promise<boolean> | null = null;

async function loadPrivyWidget(): Promise<boolean> {
  if (privyLoadPromise) return privyLoadPromise;

  privyLoadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://embedded.privy.io/widget.js';
    script.async = true;
    script.onload = () => {
      // Initialize the widget once loaded
      window.PrivyLogin?.init({
        clientId: PUBLIC_PRIVY_APP_ID,
        theme: {
          colors: {
            primary: '#a5b4fc',
            background: '#161616',
            text: '#ffffff'
          }
        }
      });
      resolve(true);
    };
    script.onerror = () => {
      console.error('Failed to load Privy widget');
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return privyLoadPromise;
}

export async function initPrivy() {
  try {
    const isLoaded = await loadPrivyWidget();
    if (!isLoaded) {
      console.error('Privy widget failed to load');
      return null;
    }
    return true;
  } catch (error) {
    console.error('Failed to initialize Privy:', error);
    return null;
  }
}

export async function login(): Promise<PrivyUser | null> {
  try {
    const isLoaded = await loadPrivyWidget();
    if (!isLoaded) {
      throw new Error('Privy widget not loaded');
    }

    return new Promise((resolve) => {
      window.PrivyLogin.showLogin({
        onComplete: (user: PrivyUser) => {
          localStorage.setItem('userId', user.id);
          resolve(user);
        },
        onError: (error: any) => {
          console.error('Login error:', error);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    localStorage.removeItem('userId');
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

export async function getUser(userId: string): Promise<PrivyUser | null> {
  const storedUserId = localStorage.getItem('userId');
  if (storedUserId === userId) {
    return {
      id: userId,
      email: localStorage.getItem('userEmail') || undefined
    };
  }
  return null;
}

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

export async function createWallet(): Promise<PrivyUser | null> {
  try {
    const response = await fetch(`${PRIVY_API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PUBLIC_PRIVY_APP_ID}`
      },
      body: JSON.stringify({
        create_wallet: true
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create wallet');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error creating wallet:', error);
    return null;
  }
}

export async function updateUser(userId: string, updates: Partial<PrivyUser>): Promise<PrivyUser | null> {
  try {
    const response = await fetch(`${PRIVY_API_BASE}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PUBLIC_PRIVY_APP_ID}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`${PRIVY_API_BASE}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${PUBLIC_PRIVY_APP_ID}`
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
} 