import { PUBLIC_PRIVY_APP_ID } from '$env/static/public';
import { PRIVY_CLIENT_ID } from '$env/static/private';

// Public configs
export const publicConfigs = {
  PRIVY_APP_ID: PUBLIC_PRIVY_APP_ID
};

// Private configs
export const privateConfigs = {
  PRIVY_CLIENT_ID
};

// Export individual configs
export { PRIVY_CLIENT_ID };

// Remove unused config 