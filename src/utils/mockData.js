import { PACK_DEFINITIONS } from '../config/constants';

/**
 * Generates mock data matching the API structure
 * @param {string} wallet - Wallet address
 * @returns {Object} Mock wallet data
 */
export const generateMockData = (wallet) => {
  const transactions = [];
  const breakdownMap = {};
  
  const now = new Date();
  let totalSpent = 0;
  let totalPacks = 0;

  // Generate 50 random transactions
  for (let i = 0; i < 50; i++) {
    const pack = PACK_DEFINITIONS[Math.floor(Math.random() * PACK_DEFINITIONS.length)];
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Last 90 days
    
    // Update totals
    totalSpent += pack.price;
    totalPacks += 1;

    // Update breakdown
    if (!breakdownMap[pack.name]) {
      breakdownMap[pack.name] = { 
        packName: pack.name, 
        packAmount: pack.price, 
        count: 0, 
        totalSpent: 0 
      };
    }
    breakdownMap[pack.name].count += 1;
    breakdownMap[pack.name].totalSpent += pack.price;

    // Add to transaction log
    transactions.push({
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      packAmount: pack.price,
      loggedAt: date.toISOString()
    });
  }

  // Sort transactions by date desc
  transactions.sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));

  // Generate free packs for testing (always include the fields, even if empty)
  // Some users will have free packs, some won't - this simulates real API behavior
  const hasFreePacks = Math.random() < 0.3; // 30% chance to have free packs
  const freePacks = [];
  if (hasFreePacks) {
    const numFreePacks = Math.floor(Math.random() * 4) + 1; // 1-4 free packs
    for (let i = 0; i < numFreePacks; i++) {
      const freePackDate = new Date(now);
      freePackDate.setDate(freePackDate.getDate() - Math.floor(Math.random() * 90));
      
      // Generate a random code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      freePacks.push({
        code: code,
        redeemedAt: freePackDate.toISOString()
      });
    }
    // Sort by redemption date (newest first)
    freePacks.sort((a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt));
  }

  // Always include free pack fields in the response (even if 0/empty)
  // This ensures the feature works for all users
  return {
    wallet: wallet,
    totalPacks: totalPacks,
    totalSpent: totalSpent,
    packBreakdown: Object.values(breakdownMap),
    transactions: transactions,
    totalFreePacksRedeemed: freePacks.length, // Always present, even if 0
    freePacks: freePacks // Always present, even if empty array
  };
};

