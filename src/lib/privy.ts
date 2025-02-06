import Privy from '@privy-io/js-sdk-core';
import { PRIVY_APP_ID } from './config';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

// Create a viem public client
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
});

// Initialize Privy with the required configuration
export const privyClient = new Privy({
  appId: PRIVY_APP_ID,
  defaultChain: mainnet,
  publicClient
}); 