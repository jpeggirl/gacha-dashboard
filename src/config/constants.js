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
    PACK_PURCHASES: '/pack-purchases',
    CLAIM_CODES: '/claim-codes'
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

// Claim Code Campaign
export const CLAIM_CODE_COST = 15;
export const CLAIM_CODE_CONVERSION_THRESHOLD = 20;
export const CAMPAIGN_START_DATE = '2026-02-10T00:00:00.000Z';

// All 254 free claim codes from the campaign CSV
export const CAMPAIGN_CLAIM_CODES = [
  'NVSSE9GZ','ZM4ZCCEE','AFB9E7XS','2XBHSXFE','V8U3AA9G','XLH4Q3NZ','3B9NJLDY','JFR5QZET',
  'AS4UHYL2','S5QLFYDK','Y4EXDZWY','88CQVYNZ','9J722MAM','8PQBSUPL','HKMJ6BP3','S3EDPZ73',
  'QSFM9PNE','VX69R9KJ','AYS32LX5','8Z4C2PR2','4BS97ALW','QD9A7AP4','AQUBAKTS','SWX5S835',
  '9YJVS98H','YWHS9DPA','XRYLKV58','USC4SQT6','98FGLWJP','83J9DVFG','3DFZ2VKR','UPXUW5U9',
  'J8PCKGQ7','XMJNQ3GF','KCD7EW5F','Y9QCXM5G','N7HTQL85','9BEMFDRW','9J64LE27','FLL7D2R7',
  'AF4DWSZT','KVQJ74CG','58HFXWX4','VMMTEKED','JXCXXMHG','GE499ZU8','EVK89Q6B','RR3PBNSL',
  'PLB2MUUJ','FNQU2GK4','C6N7ZXRU','H6PMD8A4','7XD7KJ8N','WLHK57LH','CDKCA46F','EJQ85DSS',
  'BEHXFBS3','BHDHS855','JMF3QREE','VMSY5JLZ','EHLE9K6Z','5K4F2332','7AEVVTGM','AT9ZBT6R',
  'H2VXE4XS','3PJ4ZSZ5','DYMGSKW9','TA8BUH8B','MCPLXDZL','NGC2ZQ63','58BRSQ7L','XWS49WC4',
  '4G5U2NSB','3VGBTSEV','PL8N2WH4','MTWLC38N','N6HKNTPV','MYPRSAUP','KXXYE4FT','ML726S76',
  'QMG3X4WZ','SGYSHW2M','P4P9ZB2X','APLKC2AK','JNNJMMXB','CNBQGSEP','JUQS4762','LHLPGRRV',
  '698PSDL5','8XMTDALV','HR858ZEX','BU9HXTVS','ZSN7MTP8','AFEA22LL','BMFVMSXA','Y9MTFA5W',
  'WGC3TCBV','KGNCST7K','K86Y5YZR','ZFUB7HE4','FGLXBJ6W','3WR4S8PZ','9GJLK8YQ','TQZGR43B',
  'JTJQKQHG','VV6DDR3B','PC83S6TW','4T3S33ZC','GC2AS98U','FJCHNA7E','H462P363','8PBKWFGP',
  'HCH6ZRYY','K69VGM3V','E8LBUSH3','SWLGQPCX','HWHQ6698','BKUVPEFF','RXP33ZL9','6SKZGJZH',
  'V6H9YVBW','LARQVG4L','9M6SB4N7','P6MHZMFX','84U8NLMX','DGELLN75','9Y24F8AA','3Q3G7Z6D',
  'LZPFZDFA','YAWDAVY7','K7W7TN3T','JPT78H5P','LBXXZCRX','HHTW3JCR','9VQ8MPMQ','ZXXGJ5X3',
  'CDGC75XS','9ZQLJ3Z4','28WREKT7','9TDLGLAZ','BS2DVVJG','LCSAWC99','EVWHRU5G','U2WLACG5',
  'BBKZUSXR','HWV5H5F2','7CP35TLQ','297VL65N','4QUNXPLY','U4KTFGBE','TFPJDVFG','QVKYM9R5',
  '6M67RP6F','XCNTLSKE','AXLSWHGW','CMSG9SK7','MXZA3D7C','PJZHKK4B','VPTTB9RE','YZF4AFST',
  '94J62S72','UVBKJGTJ','446HNWUK','6S4K387P','TJFCX3KE','K6P6A3KD','Z9KX433M','RYVBL7YG',
  'N5JL4CL8','TP94JDJ9','6DXSESP9','MTRTLW2J','QNRFSCGT','46FBBMRU','BWMJXJRF','DYNTM8RN',
  'E8Q2ZKNA','MGE3CVUG','U9REU6JY','XF4ATPDF','M779FGJZ','3BHLU94U','T7YY5CT7','EX8H5YT5',
  '2GMV4D9Y','4YKP3Z7U','3R36VLJ4','2UDJJ3V3','LQK7LKFV','RBRSRT25','P7GMV7UH','7GBNDD37',
  'ZFMWZN9E','HKZY6YPC','NQKPQQF8','NPVRLQVK','U9HG4TAV','XCCYEMMP','S3CQJYPP','3BAVSZ26',
  '7GS8AK7E','HENLK4YQ','KX84AJBQ','6XAYY9F4','H9FDEXRD','EUKDKNN4','NJALY6HL','5Q76XF38',
  '6HAJ4XZV','EVTK4AVS','4B3HF2FT','U4GJYKNH','2LAFP2KN','35J7R5YS','NMJJV6J3','G2AWD4E7',
  'GT7YBB36','V8P7WZGS','DVZACVGR','4NZKYHRQ','7BK6TKYT','PHETW2GD','EBACKCWG','XURUAQ2P',
  'LSZB3E46','YCE6572T','VR7CXE9H','YCCQSTT5','6RCFQWG9','LSQUCTZ4','3PBU6Q8B','K9XL3QYM',
  'UPB5HEJD','G3R6VY22','EFARD5N9','85SWHTEN','WPEQRKQY','28D4TY7L','R8J7QFTM','LPRA5LU8',
  'SLHS4WDZ','9SVUEQZ8','3ZWUF6TR','Y8FM45BY','J9BFQMD6','LRF24QVG','R6UC3BYD','2UJKQVF2',
  'JV6NHMX3','JJELR9PA','494K5M99','E3QYHKZN','ZLGN663C','XLW6KTP9',
];

// Default User Tags
export const DEFAULT_TAGS = [
  'abstract farmer',
  'collectors',
  'rip packs',
  'outside abstract'
];

