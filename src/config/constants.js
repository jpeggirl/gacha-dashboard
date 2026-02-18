// API Configuration
// Note: In .env file, if password contains special characters, use quotes: VITE_ADMIN_PASSWORD="your-password"
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  // Only show error once to reduce console noise
  if (!window.adminPasswordErrorShown) {
    console.error('[Config] VITE_ADMIN_PASSWORD is not set in Vercel environment variables!');
    console.error('[Config] API calls will fail. Add VITE_ADMIN_PASSWORD in Vercel Settings → Environment Variables');
    if (!import.meta.env.DEV) {
      window.adminPasswordErrorShown = true;
    }
  }
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

// Pack Definitions - Note: Pack names and prices now come from the API
// These are kept as fallbacks for legacy data only
export const PACK_DEFINITIONS = [
  { name: 'Pokémon Welcome pack', price: 0 },
  { name: 'Pokémon Starter Pack', price: 25 },
  { name: 'Pokémon Collector Pack', price: 50 },
  { name: 'Pokémon Elite Pack', price: 100 },
  { name: 'Pokémon Master Pack', price: 250 },
  { name: 'One Piece starter pack', price: 50 },
  { name: 'One piece manga pack', price: 250 }
];

// Pack pricing lookups (normalized key -> price)
export const PACK_PRICING = {
  'pokémon welcome pack': 0,
  'pokemon welcome pack': 0,
  'pokémon starter pack': 25,
  'pokemon starter pack': 25,
  'pokémon collector pack': 50,
  'pokemon collector pack': 50,
  'pokémon elite pack': 100,
  'pokemon elite pack': 100,
  'pokémon master pack': 250,
  'pokemon master pack': 250,
  'one piece starter pack': 50,
  'one piece manga pack': 250
};

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

// Pagination Defaults (matching API defaults)
export const DEFAULT_TRANSACTIONS_LIMIT = 20;
export const DEFAULT_INVENTORY_LIMIT = 20;

// Default User Tags
export const DEFAULT_TAGS = [
  'abstract farmer',
  'collectors',
  'rip packs',
  'outside abstract'
];

