import { USER_TIERS, TRANSACTION_LIMIT } from '../config/constants';

/**
 * Processes raw wallet data into analytics stats
 * @param {Object} data - Raw wallet data from API
 * @param {number} lifetimeTotalSpent - Optional lifetime total spent for tier calculation
 * @returns {Object} Processed statistics
 */
export const processAnalytics = (data, lifetimeTotalSpent = null) => {
  if (!data) return null;

  // 1. Basic KPIs from root object
  const { totalSpent, totalPacks, packBreakdown, transactions, wallet, username } = data;
  
  // Extract free packs data - API uses "freePackRedemptions" field
  const totalFreePacksRedeemed = data.totalFreePacksRedeemed || 0;
  let freePackRedemptions = data.freePackRedemptions || [];
  
  // Ensure freePackRedemptions is an array
  if (!Array.isArray(freePackRedemptions)) {
    freePackRedemptions = [];
  }
  
  // Map freePackRedemptions to the format expected by components
  // API returns: {code, txHash, presetId, redeemedAt}
  // Component expects: {code, redeemedAt}
  const freePacks = freePackRedemptions.map(redemption => ({
    code: redemption.code,
    redeemedAt: redemption.redeemedAt,
    txHash: redemption.txHash, // Keep for potential future use
    presetId: redemption.presetId // Keep for potential future use
  }));
  
  // Debug: Log free packs data to help troubleshoot
  console.log('[Analytics] Free packs data:', {
    totalFreePacksRedeemed,
    freePackRedemptions,
    freePacks,
    freePacksLength: freePacks.length,
    freePacksSample: freePacks.slice(0, 2) // Show first 2 items
  });
  const avgOrderValue = totalPacks > 0 ? totalSpent / totalPacks : 0;
  
  // Use lifetime total for tier calculation if provided, otherwise use filtered total
  const tierCalculationTotal = lifetimeTotalSpent !== null ? lifetimeTotalSpent : totalSpent;

  // 2. Prepare Pie Data (Top packs by spend)
  const pieData = packBreakdown
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .map(item => ({
      name: item.packName,
      value: item.totalSpent, // Chart by Revenue
      count: item.count
    }));

  // 3. Prepare Trend Data (Group transactions by Date)
  const dailySpend = {};
  transactions.forEach(tx => {
    const dateKey = new Date(tx.loggedAt).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    dailySpend[dateKey] = (dailySpend[dateKey] || 0) + tx.packAmount;
  });

  // Convert date strings to sortable format and sort
  const chartData = Object.entries(dailySpend)
    .map(([date, amount]) => {
      // Parse the date string (e.g., "Jan 15") to a proper date for sorting
      const currentYear = new Date().getFullYear();
      const parsedDate = new Date(`${date}, ${currentYear}`);
      return { date, amount, sortDate: parsedDate };
    })
    .sort((a, b) => a.sortDate - b.sortDate)
    .map(({ date, amount }) => ({ date, amount }));

  // 4. Identify Tier (based on lifetime spending)
  let tier = USER_TIERS.FREE_TO_PLAY.name;
  if (tierCalculationTotal >= USER_TIERS.LEVIATHAN.threshold) {
    tier = USER_TIERS.LEVIATHAN.name;
  } else if (tierCalculationTotal >= USER_TIERS.WHALE.threshold) {
    tier = USER_TIERS.WHALE.name;
  } else if (tierCalculationTotal >= USER_TIERS.DOLPHIN.threshold) {
    tier = USER_TIERS.DOLPHIN.name;
  } else if (tierCalculationTotal >= USER_TIERS.MINNOW.threshold) {
    tier = USER_TIERS.MINNOW.name;
  }

  // 5. Pack Name Lookup Map (Price -> Name) for Transaction Table
  const priceToNameMap = {};
  packBreakdown.forEach(p => {
    priceToNameMap[p.packAmount] = p.packName;
  });

  // Sort free packs by redemption date (newest first)
  const sortedFreePacks = (freePacks || []).slice().sort((a, b) => {
    const dateA = a.redeemedAt ? new Date(a.redeemedAt).getTime() : 0;
    const dateB = b.redeemedAt ? new Date(b.redeemedAt).getTime() : 0;
    return dateB - dateA; // Newest first
  });

  return {
    wallet,
    username,
    totalSpent,
    totalPacks,
    avgOrderValue,
    pieData,
    chartData,
    tier,
    priceToNameMap,
    transactions: transactions.slice(0, TRANSACTION_LIMIT), // Show last N
    totalFreePacksRedeemed: totalFreePacksRedeemed || 0,
    freePacks: sortedFreePacks
  };
};

