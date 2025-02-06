import { PrivyClient } from '@privy-io/embedded-wallet-service';
import { PRIVY_APP_ID } from './config';

// Initialize Privy with the required configuration
const privy = new PrivyClient({
  appId: PRIVY_APP_ID,
  onAuthSuccess: (user: any) => {
    console.log('Auth success:', user);
  },
  onAuthFailure: (error: any) => {
    console.error('Auth failed:', error);
  }
});

// Initialize the client and export it
let initialized = false;
async function initializePrivy() {
  if (!initialized) {
    try {
      await privy.init();
      initialized = true;
    } catch (error) {
      console.error('Failed to initialize Privy client:', error);
    }
  }
  return privy;
}

export const privyClient = privy;
export { initializePrivy }; 