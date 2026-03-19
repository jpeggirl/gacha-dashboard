import { ARCHETYPE_THRESHOLDS } from '../config/constants';

/**
 * Compute behavioral metrics from raw transactions.
 * @param {Array} transactions - Array of transaction objects with loggedAt, packName, price fields
 * @returns {Object} Behavioral metrics snapshot
 */
export function computeBehavioralMetrics(transactions) {
  if (!transactions || transactions.length === 0) {
    return {
      activeDays: 0,
      totalPurchases: 0,
      firstPurchaseDate: null,
      lastPurchaseDate: null,
      daysSinceLastPurchase: null,
      sessionClusters: [],
      maxSessionPurchases: 0,
      avgGap: 0,
      maxGap: 0,
      medianGap: 0,
      gapRatio: null,
    };
  }

  // Parse dates and sort ascending
  const dated = transactions
    .map(tx => ({
      ...tx,
      date: new Date(tx.loggedAt || tx.created_at || tx.date),
    }))
    .sort((a, b) => a.date - b.date);

  // Group by calendar date (YYYY-MM-DD)
  const clusterMap = {};
  for (const tx of dated) {
    const dayKey = tx.date.toISOString().split('T')[0];
    if (!clusterMap[dayKey]) {
      clusterMap[dayKey] = { date: dayKey, count: 0, totalSpent: 0 };
    }
    clusterMap[dayKey].count += 1;
    clusterMap[dayKey].totalSpent += Number(tx.price) || 0;
  }

  const sessionClusters = Object.values(clusterMap).sort(
    (a, b) => a.date.localeCompare(b.date)
  );

  const activeDays = sessionClusters.length;
  const totalPurchases = dated.length;
  const firstPurchaseDate = dated[0].date.toISOString();
  const lastPurchaseDate = dated[dated.length - 1].date.toISOString();

  const now = new Date();
  const daysSinceLastPurchase = Math.floor(
    (now - dated[dated.length - 1].date) / (1000 * 60 * 60 * 24)
  );

  const maxSessionPurchases = Math.max(...sessionClusters.map(c => c.count));

  // Gap analysis between active days
  const gaps = [];
  for (let i = 1; i < sessionClusters.length; i++) {
    const prev = new Date(sessionClusters[i - 1].date);
    const curr = new Date(sessionClusters[i].date);
    const gapDays = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
    gaps.push(gapDays);
  }

  const avgGap = gaps.length > 0
    ? gaps.reduce((sum, g) => sum + g, 0) / gaps.length
    : 0;

  const maxGap = gaps.length > 0 ? Math.max(...gaps) : 0;

  const medianGap = gaps.length > 0
    ? (() => {
        const sorted = [...gaps].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];
      })()
    : 0;

  const gapRatio = avgGap > 0 ? daysSinceLastPurchase / avgGap : null;

  return {
    activeDays,
    totalPurchases,
    firstPurchaseDate,
    lastPurchaseDate,
    daysSinceLastPurchase,
    sessionClusters,
    maxSessionPurchases,
    avgGap: Math.round(avgGap * 10) / 10,
    maxGap,
    medianGap: Math.round(medianGap * 10) / 10,
    gapRatio: gapRatio !== null ? Math.round(gapRatio * 10) / 10 : null,
  };
}

/**
 * Rule-based archetype classification.
 * @param {Object} metrics - Output from computeBehavioralMetrics
 * @returns {string} Archetype ID
 */
export function classifyArchetype(metrics) {
  const t = ARCHETYPE_THRESHOLDS;

  // Binge-and-gone: single active day with many purchases
  if (
    metrics.activeDays === 1 &&
    metrics.totalPurchases >= t.bingeAndGone.minPurchases
  ) {
    return 'binge-and-gone';
  }

  // Binge episodes: multiple big sessions with gaps
  if (
    metrics.sessionClusters.length >= t.bingeEpisodes.minSessions &&
    metrics.maxSessionPurchases >= t.bingeEpisodes.minSessionPurchases &&
    metrics.maxGap > t.bingeEpisodes.minMaxGap
  ) {
    return 'binge-episodes';
  }

  // Steady periodic: many active days at measured pace
  if (metrics.activeDays >= t.steadyPeriodic.minActiveDays) {
    return 'steady-periodic';
  }

  return 'unclassified';
}

/**
 * Dynamic recency status based on personal purchase rhythm.
 * @param {Object} metrics - Output from computeBehavioralMetrics
 * @returns {string} Status: active, slipping, or churned
 */
export function computeRecencyStatus(metrics) {
  const { daysSinceLastPurchase, avgGap, activeDays, gapRatio } = metrics;

  if (daysSinceLastPurchase === null || daysSinceLastPurchase === undefined) {
    return null;
  }

  // Grace period: within 7 days is always active
  if (daysSinceLastPurchase <= 7) {
    return 'active';
  }

  // Edge case: not enough data for dynamic model
  if (avgGap === 0 || activeDays < 2) {
    // Fall back to simple thresholds
    if (daysSinceLastPurchase < 31) return 'slipping';
    return 'churned';
  }

  // Dynamic model based on personal rhythm
  if (gapRatio <= 2) return 'active';
  if (gapRatio > 2 && daysSinceLastPurchase < 31) return 'slipping';
  return 'churned';
}

/**
 * Main entry point: classify a user from their raw transactions.
 * @param {Array} transactions - Raw transaction array
 * @returns {Object} { archetype, status, metrics }
 */
export function classifyUser(transactions) {
  const metrics = computeBehavioralMetrics(transactions);
  const archetype = classifyArchetype(metrics);
  const status = computeRecencyStatus(metrics);

  return {
    archetype,
    status,
    metrics,
  };
}
