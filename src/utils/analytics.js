import { PACK_PRICING, USER_TIERS } from '../config/constants';
import { extractTransactions, extractInventory } from './normalizeResponse';

/**
 * Processes raw wallet data into analytics stats
 * @param {Object} data - Raw wallet data from API
 * @param {number} lifetimeTotalSpent - Optional lifetime total spent for tier calculation
 * @returns {Object} Processed statistics
 */
export const processAnalytics = (data, lifetimeTotalSpent = null) => {
  if (!data) return null;

  // 1. Basic KPIs from root object
  const { totalSpent, totalPacks, packBreakdown, wallet, username } = data;
  const { items: transactions, ...transactionsPagination } = extractTransactions(data.transactions);
  const { items: inventoryItems, ...inventoryPagination } = extractInventory(data.inventoryWins);
  
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
  const normalizePackName = (name = '') => name.toLowerCase().replace(/\s+/g, ' ').trim();
  const getPackPrice = (name, fallbackAmount) => {
    const normalizedName = normalizePackName(name);
    if (PACK_PRICING[normalizedName] !== undefined) {
      return PACK_PRICING[normalizedName];
    }
    return fallbackAmount ?? null;
  };

  const pieData = packBreakdown
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .map(item => ({
      name: item.packName,
      value: item.totalSpent, // Chart by Revenue
      count: item.count,
      packPrice: getPackPrice(item.packName, item.packAmount)
    }));

  // 3. Prepare Trend Data (Group transactions by Date)
  const dailySpend = {};
  transactions.forEach(tx => {
    const txDate = new Date(tx.loggedAt);
    const dateKey = txDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    // Store both the display date and the actual date for proper sorting across year boundaries
    // Use tx.amount (new API) with fallback to tx.packAmount (legacy)
    const txAmount = tx.amount ?? tx.packAmount ?? 0;
    if (!dailySpend[dateKey]) {
      dailySpend[dateKey] = { amount: 0, winnings: 0, actualDate: txDate };
    }
    dailySpend[dateKey].amount += txAmount;
    dailySpend[dateKey].winnings += tx.totalWinnings || 0;
    // Keep the earliest date for this dateKey to ensure consistent sorting
    if (txDate < dailySpend[dateKey].actualDate) {
      dailySpend[dateKey].actualDate = txDate;
    }
  });

  // Convert to array and sort by actual date
  const chartData = Object.entries(dailySpend)
    .map(([date, data]) => ({
      date,
      amount: data.amount,
      winnings: data.winnings,
      sortDate: data.actualDate
    }))
    .sort((a, b) => a.sortDate - b.sortDate)
    .map(({ date, amount, winnings }) => ({ date, amount, winnings }));

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

  // Calculate total winnings and RTP from data or transactions
  const totalWinnings = data.totalWinnings || transactions.reduce((sum, tx) => sum + (tx.totalWinnings || 0), 0);
  const rtp = data.rtp || (totalSpent > 0 ? (totalWinnings / totalSpent) * 100 : 0);
  const netWinnings = totalWinnings - totalSpent;

  return {
    wallet,
    username,
    totalSpent,
    totalPacks,
    avgOrderValue,
    totalWinnings,
    netWinnings,
    rtp,
    pieData,
    chartData,
    tier,
    priceToNameMap,
    transactions,
    transactionsPagination,
    inventoryItems,
    inventoryPagination,
    totalFreePacksRedeemed: totalFreePacksRedeemed || 0,
    freePacks: sortedFreePacks
  };
};

