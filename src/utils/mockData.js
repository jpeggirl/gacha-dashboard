import { PACK_DEFINITIONS } from '../config/constants';

// Mock pack definitions with collections
const MOCK_PACKS = [
  { name: 'Pokémon Welcome pack', price: 0, collection: 'pokemon' },
  { name: 'Pokémon Starter Pack', price: 25, collection: 'pokemon' },
  { name: 'Pokémon Collector Pack', price: 50, collection: 'pokemon' },
  { name: 'Pokémon Elite Pack', price: 100, collection: 'pokemon' },
  { name: 'Pokémon Master Pack', price: 250, collection: 'pokemon' },
  { name: 'One Piece starter pack', price: 50, collection: 'one-piece' },
  { name: 'One piece manga pack', price: 250, collection: 'one-piece' }
];

/**
 * Generates mock data matching the new API structure
 * @param {string} wallet - Wallet address
 * @returns {Object} Mock wallet data
 */
export const generateMockData = (wallet) => {
  const transactions = [];
  const breakdownMap = {};
  
  const now = new Date();
  let totalSpent = 0;
  let totalWinnings = 0;
  let totalPacks = 0;

  // Generate 50 random transactions
  for (let i = 0; i < 50; i++) {
    const pack = MOCK_PACKS[Math.floor(Math.random() * MOCK_PACKS.length)];
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Last 90 days
    
    // Generate random winnings (RTP between 80-120%)
    const rtpMultiplier = 0.8 + Math.random() * 0.4;
    const txWinnings = parseFloat((pack.price * rtpMultiplier).toFixed(2));
    
    // Update totals
    totalSpent += pack.price;
    totalWinnings += txWinnings;
    totalPacks += 1;

    // Update breakdown
    if (!breakdownMap[pack.name]) {
      breakdownMap[pack.name] = { 
        packName: pack.name, 
        packAmount: pack.price,
        collection: pack.collection,
        count: 0, 
        totalSpent: 0,
        totalWinnings: 0
      };
    }
    breakdownMap[pack.name].count += 1;
    breakdownMap[pack.name].totalSpent += pack.price;
    breakdownMap[pack.name].totalWinnings += txWinnings;

    // Add to transaction log (new API structure)
    transactions.push({
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      nftIds: [Math.floor(Math.random() * 200000)],
      amount: pack.price,
      packName: pack.name,
      collection: pack.collection,
      cardCount: 1,
      totalWinnings: txWinnings,
      loggedAt: date.toISOString()
    });
  }

  // Calculate RTP for each pack in breakdown
  Object.values(breakdownMap).forEach(pack => {
    pack.rtp = pack.totalSpent > 0 ? parseFloat(((pack.totalWinnings / pack.totalSpent) * 100).toFixed(2)) : 0;
  });

  // Sort transactions by date desc
  transactions.sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));

  // Generate free packs for testing (always include the fields, even if empty)
  // Some users will have free packs, some won't - this simulates real API behavior
  const hasFreePacks = Math.random() < 0.3; // 30% chance to have free packs
  const freePackRedemptions = [];
  if (hasFreePacks) {
    const numFreePacks = Math.floor(Math.random() * 4) + 1; // 1-4 free packs
    for (let i = 0; i < numFreePacks; i++) {
      const freePackDate = new Date(now);
      freePackDate.setDate(freePackDate.getDate() - Math.floor(Math.random() * 90));
      
      // Generate a random code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      freePackRedemptions.push({
        code: code,
        redeemedAt: freePackDate.toISOString(),
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        presetId: Math.floor(Math.random() * 1000000)
      });
    }
    // Sort by redemption date (newest first)
    freePackRedemptions.sort((a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt));
  }

  // Calculate overall RTP
  const rtp = totalSpent > 0 ? parseFloat(((totalWinnings / totalSpent) * 100).toFixed(2)) : 0;

  // Generate mock inventory wins
  const inventoryWinsData = [];
  const tiers = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const tierColors = { common: '#9ca3af', uncommon: '#22c55e', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b' };
  const grades = ['PSA 9', 'PSA 10', 'BGS 9.5', 'CGC 9', 'Raw'];
  const sets = ['Base Set', 'Jungle', 'Fossil', 'Team Rocket', 'Gym Heroes'];

  for (let i = 0; i < 12; i++) {
    const tier = tiers[Math.floor(Math.random() * tiers.length)];
    const tierMultiplier = { common: 1, uncommon: 2, rare: 5, epic: 15, legendary: 50 }[tier];
    const value = parseFloat((tierMultiplier * (5 + Math.random() * 20)).toFixed(2));

    inventoryWinsData.push({
      id: `inv-${i}`,
      tier,
      details: {
        name: `Mock Card #${i + 1}`,
        img: `https://placehold.co/200x280/1e293b/e2e8f0?text=Card+${i + 1}`,
        year: 1999 + Math.floor(Math.random() * 26),
        grade: grades[Math.floor(Math.random() * grades.length)],
        set: sets[Math.floor(Math.random() * sets.length)],
      },
      value,
      variety: Math.random() < 0.3 ? 'Holo' : undefined,
    });
  }

  // Return data matching new API structure
  return {
    wallet: wallet,
    username: null,
    email: null,
    totalPacks: totalPacks,
    totalSpent: totalSpent,
    totalWinnings: parseFloat(totalWinnings.toFixed(2)),
    rtp: rtp,
    packBreakdown: Object.values(breakdownMap),
    transactions: {
      data: transactions,
      page: 1,
      limit: 20,
      total: transactions.length,
      totalPages: Math.ceil(transactions.length / 20),
    },
    inventoryWins: {
      data: inventoryWinsData,
      page: 1,
      limit: 20,
      total: inventoryWinsData.length,
      totalPages: 1,
    },
    freePackRedemptions: freePackRedemptions,
    totalFreePacksRedeemed: freePackRedemptions.length
  };
};

