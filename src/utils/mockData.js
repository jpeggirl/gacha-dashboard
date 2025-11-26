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

  return {
    wallet: wallet,
    totalPacks: totalPacks,
    totalSpent: totalSpent,
    packBreakdown: Object.values(breakdownMap),
    transactions: transactions
  };
};

