// API Configuration
// Note: In .env file, if password contains special characters, use quotes: VITE_ADMIN_PASSWORD="your-password"
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('[Config] VITE_ADMIN_PASSWORD is not set in environment variables!');
}

// Debug: Log password status (without revealing the actual password)
if (import.meta.env.DEV) {
  console.log('[Config] Admin password loaded:', {
    fromEnv: !!import.meta.env.VITE_ADMIN_PASSWORD,
    length: ADMIN_PASSWORD?.length || 0,
    isSet: !!ADMIN_PASSWORD
  });
}

export const API_CONFIG = {
  BASE_URL: 'https://api-pull.gacha.game/api/admin',
  ENDPOINTS: {
    PACK_PURCHASES: '/pack-purchases'
  },
  HEADERS: {
    'x-admin-password': ADMIN_PASSWORD,
    'Content-Type': 'application/json'
  },
  TIMEOUT: 10000 // milliseconds (10 seconds)
};

// Pack Definitions
export const PACK_DEFINITIONS = [
  { name: '$30 Starter Pack', price: 30 },
  { name: '$150 Great Pack', price: 150 },
  { name: '$250 Rocket Pack', price: 250 },
  { name: '$10 Gem Sack', price: 10 }
];

// Chart Colors
export const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

// User Tiers
export const USER_TIERS = {
  FREE_TO_PLAY: { name: 'Free to Play', threshold: 0 },
  MINNOW: { name: 'Minnow', threshold: 100 },
  DOLPHIN: { name: 'Dolphin', threshold: 1000 },
  WHALE: { name: 'Whale', threshold: 10000 },
  LEVIATHAN: { name: 'Leviathan', threshold: 50000 }
};

// Default Wallet Address
export const DEFAULT_WALLET = '0xfc006b59d81504832cfa4f3d40be17224663d4e9';

// Transaction Limits
export const TRANSACTION_LIMIT = 50;

