export const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in decimal
export const SEPOLIA_NETWORK = {
  chainId: SEPOLIA_CHAIN_ID,
  chainName: 'Sepolia',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://sepolia.infura.io/v3/'],
  blockExplorerUrls: ['https://sepolia.etherscan.io']
};

export async function connectMetaMask() {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });

    // Check if we're on Sepolia
    const chainId = await window.ethereum.request({ 
      method: 'eth_chainId' 
    });

    // Switch to Sepolia if needed
    if (chainId !== SEPOLIA_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: SEPOLIA_CHAIN_ID }]
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEPOLIA_NETWORK]
          });
        } else {
          throw switchError;
        }
      }
    }

    return accounts[0];
  } catch (error) {
    console.error('Failed to connect to MetaMask:', error);
    throw error;
  }
}

export async function getMetaMaskBalance(address: string) {
  try {
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    });
    return (parseInt(balance, 16) / 1e18).toFixed(4);
  } catch (error) {
    console.error('Failed to get balance:', error);
    return '0.0000';
  }
} 