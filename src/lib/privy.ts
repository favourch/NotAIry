import { PUBLIC_PRIVY_APP_ID } from '$env/static/public';
import { supabase } from './supabase';

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

// Add smart wallet configuration
const SMART_WALLET_CONFIG = {
  implementation: 'KERNEL', // Using Kernel (ZeroDev) implementation
  network: {
    chainId: '0x66eee', // Arbitrum Sepolia
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc'
  }
};

// Initialize Privy with smart wallet support
async function loadPrivyWidget(): Promise<boolean> {
  if (privyLoadPromise) return privyLoadPromise;

  privyLoadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://embedded.privy.io/widget.js';
    script.async = true;
    script.onload = () => {
      // Initialize with smart wallet config
      window.PrivyLogin?.init({
        clientId: PUBLIC_PRIVY_APP_ID,
        theme: {
          colors: {
            primary: '#a5b4fc',
            background: '#161616',
            text: '#ffffff'
          }
        },
        smartWallet: {
          enabled: true,
          implementation: SMART_WALLET_CONFIG.implementation,
          network: SMART_WALLET_CONFIG.network
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
const APP_ID = PUBLIC_PRIVY_APP_ID;

// Basic headers required for all requests
const getBaseHeaders = () => {
  return {
    'privy-app-id': APP_ID,
    'Content-Type': 'application/json'
  };
};

// Add network constants
const NETWORKS = {
  ARBITRUM_ONE: {
    chainId: '0xa4b1', // 42161
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io'
  },
  ARBITRUM_SEPOLIA: {
    chainId: '0x66eee', // 421614
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorer: 'https://sepolia.arbiscan.io'
  }
};

// Use Arbitrum Sepolia for development, Arbitrum One for production
const CURRENT_NETWORK = import.meta.env.DEV ? NETWORKS.ARBITRUM_SEPOLIA : NETWORKS.ARBITRUM_ONE;

// API wrapper functions
export async function getWalletBalance(wallet: any): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const walletId = wallet?.id || wallet;
    if (!walletId) {
      throw new Error('No wallet ID provided');
    }

    // Use smart wallet specific endpoint
    const endpoint = wallet.isSmartWallet ? 
      `/api/wallet/smart/${walletId}/balance` : 
      `/api/wallet/${walletId}/balance`;

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get wallet balance');
    }
    
    const data = await response.json();
    const balanceInEth = (parseInt(data.balance) / 1e18).toFixed(4);
    return balanceInEth;
  } catch (error) {
    console.error('Failed to get balance:', error);
    return '0.0000';
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

// Update wallet creation to use smart wallets
export async function createWallet() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    // Create smart wallet through Privy API
    const response = await fetch('/api/wallet/smart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create smart wallet');
    }

    return {
      id: data.address,
      address: data.address,
      network: 'Arbitrum Sepolia',
      isSmartWallet: true
    };
  } catch (error) {
    console.error('Error creating smart wallet:', error);
    throw error;
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

// Add network switching functionality
export async function switchToArbitrum(wallet: any) {
  try {
    const response = await fetch(`${PRIVY_API_BASE}/wallets/${wallet.id}/chain`, {
      method: 'PUT',
      headers: getBaseHeaders(),
      body: JSON.stringify({
        chainId: CURRENT_NETWORK.chainId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to switch network');
    }

    return true;
  } catch (error) {
    console.error('Failed to switch network:', error);
    return false;
  }
}

// Add smart wallet specific functions
export async function batchTransactions(wallet: any, transactions: any[]) {
  try {
    const response = await fetch(`${PRIVY_API_BASE}/wallets/${wallet.id}/batch`, {
      method: 'POST',
      headers: getBaseHeaders(),
      body: JSON.stringify({ transactions })
    });

    if (!response.ok) {
      throw new Error('Failed to execute batch transactions');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to execute batch transactions:', error);
    throw error;
  }
} 