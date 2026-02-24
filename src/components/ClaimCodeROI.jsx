import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart3, CheckCircle, Circle, ArrowUpDown, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import { fetchClaimCodeBatch, fetchPackPurchases } from '../services/api';
import { extractTransactions } from '../utils/normalizeResponse';
import { CLAIM_CODE_COST, CLAIM_CODE_CONVERSION_THRESHOLD, CAMPAIGN_START_DATE, CAMPAIGN_CLAIM_CODES } from '../config/constants';
import KPICard from './KPICard';
import { DollarSign, Percent, Hash, TrendingUp, Receipt, UserPlus, UserCheck } from 'lucide-react';

const CODES_PER_PAGE = 20;
const WALLET_BATCH_SIZE = 5;

// --- localStorage cache for wallet spend data ---
const CACHE_KEY = 'claimcode_wallet_spend';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const loadWalletCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const entries = JSON.parse(raw);
    const now = Date.now();
    const valid = {};
    for (const [wallet, entry] of Object.entries(entries)) {
      if (entry?.cachedAt && (now - entry.cachedAt) < CACHE_TTL_MS) {
        valid[wallet] = entry;
      }
    }
    return valid;
  } catch {
    return {};
  }
};

const saveToWalletCache = (newEntries) => {
  try {
    const existing = loadWalletCache();
    const now = Date.now();
    const merged = { ...existing };
    for (const [wallet, info] of Object.entries(newEntries)) {
      if (info && typeof info.totalSpent === 'number') {
        merged[wallet] = { ...info, cachedAt: now };
      }
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
};

const clearWalletCache = () => {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
};

// --- Code field extractors ---

// Handle both nested (claim.redeemWallet) and flat (redeemWallet) API shapes
const getCodeWallet = (code) =>
  code.claim?.redeemWallet || code.claim?.walletAddress ||
  code.redeemWallet || code.walletAddress || code.wallet ||
  code.redeemedBy || null;

const isCodeRedeemed = (code) => {
  if (code.claim) return true;
  if (typeof code.isRedeemed === 'boolean') return code.isRedeemed;
  if (code.status === 'redeemed' || code.status === 'claimed') return true;
  return false;
};

const getCodeDate = (code) => {
  const raw = code.claim?.claimedAt || code.claim?.redeemedAt ||
    code.claimedAt || code.redeemedAt || code.createdAt || null;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

const getCodeIdentifier = (code) => code.code || code.id || '';

const ClaimCodeROI = ({ onNavigateToWallet }) => {
  const [codes, setCodes] = useState([]);
  const [walletSpend, setWalletSpend] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletProgress, setWalletProgress] = useState({ done: 0, total: 0 });
  const [cacheStats, setCacheStats] = useState({ fromCache: 0, fetched: 0 });
  const [refreshKey, setRefreshKey] = useState(0); // bump to force re-fetch

  // Table state
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all codes, then load wallet spend (cached first, then API for the rest)
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      setWalletSpend({});
      setWalletProgress({ done: 0, total: 0 });
      setCacheStats({ fromCache: 0, fetched: 0 });

      try {
        const allCodes = await fetchClaimCodeBatch(CAMPAIGN_CLAIM_CODES);
        if (cancelled) return;

        // Deduplicate by code identifier
        const seen = new Set();
        const campaignCodes = allCodes.filter((c) => {
          const id = getCodeIdentifier(c);
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        });

        setCodes(campaignCodes);
        setLoading(false);

        // Collect unique wallets and their earliest claim dates
        const walletSet = new Set();
        const walletClaimDate = {};
        campaignCodes.forEach((c) => {
          if (isCodeRedeemed(c)) {
            const w = getCodeWallet(c)?.toLowerCase();
            const d = getCodeDate(c);
            if (w) {
              walletSet.add(w);
              if (d && (!walletClaimDate[w] || d < walletClaimDate[w])) {
                walletClaimDate[w] = d;
              }
            }
          }
        });

        const uniqueWallets = Array.from(walletSet);
        if (uniqueWallets.length === 0) return;

        // Check cache — separate into cached vs needs-fetch
        const cache = loadWalletCache();
        const cachedResults = {};
        const walletsToFetch = [];

        for (const wallet of uniqueWallets) {
          const cached = cache[wallet];
          if (cached && typeof cached.totalSpent === 'number') {
            // Strip the cachedAt field before putting in state
            const { cachedAt, ...spendData } = cached;
            cachedResults[wallet] = spendData;
          } else {
            walletsToFetch.push(wallet);
          }
        }

        // Apply cached data immediately
        const fromCacheCount = Object.keys(cachedResults).length;
        if (fromCacheCount > 0) {
          setWalletSpend(cachedResults);
        }

        console.log(`[ClaimCodeROI] ${fromCacheCount} wallets from cache, ${walletsToFetch.length} to fetch`);

        if (walletsToFetch.length === 0) {
          setCacheStats({ fromCache: fromCacheCount, fetched: 0 });
          return;
        }

        setWalletProgress({ done: 0, total: walletsToFetch.length });

        // Fetch uncached wallets in batches
        const allNewEntries = {};
        for (let i = 0; i < walletsToFetch.length; i += WALLET_BATCH_SIZE) {
          if (cancelled) return;

          const batch = walletsToFetch.slice(i, i + WALLET_BATCH_SIZE);
          const results = await Promise.allSettled(
            batch.map((wallet) => fetchPackPurchases(wallet, { transactionsLimit: 100 }))
          );

          if (cancelled) return;

          const updates = {};
          results.forEach((r, idx) => {
            const wallet = batch[idx];
            if (r.status === 'fulfilled') {
              const data = r.value;
              const totalSpent = data.totalSpent ?? data.totalPurchaseAmount ?? 0;
              const claimDate = walletClaimDate[wallet];

              const { items: txs } = extractTransactions(data.transactions);
              let preClaimSpend = 0;
              let postClaimSpend = 0;

              if (claimDate && txs.length > 0) {
                txs.forEach((tx) => {
                  const txDate = tx.loggedAt ? new Date(tx.loggedAt) : null;
                  const amount = tx.packAmount || 0;
                  if (txDate && txDate < claimDate) {
                    preClaimSpend += amount;
                  } else {
                    postClaimSpend += amount;
                  }
                });
              } else {
                postClaimSpend = totalSpent;
              }

              updates[wallet] = {
                totalSpent,
                isNewUser: claimDate ? preClaimSpend === 0 : false,
                preClaimSpend,
                postClaimSpend,
              };
            } else {
              updates[wallet] = null; // Failed — will show '--'
            }
          });

          Object.assign(allNewEntries, updates);
          setWalletSpend((prev) => ({ ...prev, ...updates }));
          setWalletProgress((prev) => ({
            ...prev,
            done: Math.min(prev.done + batch.length, prev.total)
          }));
        }

        // Save newly fetched entries to cache
        saveToWalletCache(allNewEntries);
        setCacheStats({ fromCache: fromCacheCount, fetched: walletsToFetch.length });
      } catch (err) {
        if (!cancelled) {
          console.error('[ClaimCodeROI] Error:', err);
          setError(err.message || 'Failed to load claim codes');
          setLoading(false);
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const handleRefresh = useCallback(() => {
    clearWalletCache();
    setRefreshKey((k) => k + 1);
  }, []);

  // Derived KPIs
  const kpis = useMemo(() => {
    const redeemed = codes.filter(isCodeRedeemed);
    const redeemedCount = redeemed.length;
    const campaignCost = redeemedCount * CLAIM_CODE_COST;

    const walletsSeen = new Set();
    let totalRevenue = 0;
    let convertedCount = 0;
    let newUserCount = 0;
    let newUserSpend = 0;
    let existingUserCount = 0;
    let existingUserSpend = 0;
    redeemed.forEach((c) => {
      const w = getCodeWallet(c)?.toLowerCase();
      if (w && !walletsSeen.has(w)) {
        walletsSeen.add(w);
        const info = walletSpend[w];
        if (info && typeof info.totalSpent === 'number') {
          totalRevenue += info.totalSpent;
          if (info.totalSpent > CLAIM_CODE_CONVERSION_THRESHOLD) convertedCount++;
          if (info.isNewUser) {
            newUserCount++;
            newUserSpend += info.totalSpent;
          } else {
            existingUserCount++;
            existingUserSpend += info.totalSpent;
          }
        }
      }
    });

    const walletsLoaded = Array.from(walletsSeen).filter(w => {
      const info = walletSpend[w];
      return info && typeof info.totalSpent === 'number';
    }).length;
    const conversionRate = walletsLoaded > 0 ? (convertedCount / walletsLoaded) * 100 : 0;
    const revenueContribution = totalRevenue * 0.15;
    const netROI = campaignCost > 0 ? ((revenueContribution - campaignCost) / campaignCost) * 100 : 0;

    return { redeemedCount, convertedCount, conversionRate, walletsLoaded, campaignCost, totalRevenue, revenueContribution, netROI, newUserCount, newUserSpend, existingUserCount, existingUserSpend };
  }, [codes, walletSpend]);

  // Sorted + filtered + paginated rows
  const sortedCodes = useMemo(() => {
    const filtered = searchQuery.trim()
      ? codes.filter((c) => getCodeIdentifier(c).toLowerCase().includes(searchQuery.trim().toLowerCase()))
      : codes;
    const sorted = [...filtered].sort((a, b) => {
      let aVal, bVal;
      switch (sortKey) {
        case 'code':
          aVal = getCodeIdentifier(a).toLowerCase();
          bVal = getCodeIdentifier(b).toLowerCase();
          return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case 'status':
          aVal = isCodeRedeemed(a) ? 1 : 0;
          bVal = isCodeRedeemed(b) ? 1 : 0;
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        case 'date': {
          const da = getCodeDate(a);
          const db = getCodeDate(b);
          aVal = da ? da.getTime() : 0;
          bVal = db ? db.getTime() : 0;
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        }
        case 'spend': {
          const wa = getCodeWallet(a)?.toLowerCase();
          const wb = getCodeWallet(b)?.toLowerCase();
          aVal = wa && walletSpend[wa]?.totalSpent != null ? walletSpend[wa].totalSpent : -1;
          bVal = wb && walletSpend[wb]?.totalSpent != null ? walletSpend[wb].totalSpent : -1;
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        }
        default:
          return 0;
      }
    });
    return sorted;
  }, [codes, sortKey, sortDir, walletSpend, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(sortedCodes.length / CODES_PER_PAGE));
  const pagedCodes = sortedCodes.slice((page - 1) * CODES_PER_PAGE, page * CODES_PER_PAGE);

  const handleSort = useCallback((key) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return key;
      }
      setSortDir('desc');
      return key;
    });
    setPage(1);
  }, []);

  const SortIcon = ({ column }) => {
    if (sortKey !== column) return <ArrowUpDown size={12} className="text-slate-300" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-indigo-600" />
      : <ChevronDown size={12} className="text-indigo-600" />;
  };

  const walletFetchInProgress = walletProgress.total > 0 && walletProgress.done < walletProgress.total;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-slate-500">Loading claim code data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="text-indigo-600" size={24} />
          <h2 className="text-2xl font-bold text-slate-900">Claim Code ROI</h2>
        </div>
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-indigo-600" size={24} />
            <h2 className="text-2xl font-bold text-slate-900">Claim Code ROI</h2>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={walletFetchInProgress}
            className="inline-flex items-center gap-1.5 rounded border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            title="Clear cache and re-fetch all wallet data"
          >
            <RefreshCw size={12} className={walletFetchInProgress ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-slate-500 text-sm">Campaign performance — {CAMPAIGN_CLAIM_CODES.length} codes at $15/code</p>
          {cacheStats.fromCache > 0 && !walletFetchInProgress && (
            <span className="text-xs text-slate-400">
              {cacheStats.fromCache} cached, {cacheStats.fetched} refreshed
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {walletFetchInProgress && (
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Loading wallet spend data...</span>
            <span>{walletProgress.done}/{walletProgress.total} wallets</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(walletProgress.done / walletProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="p-6">
        {codes.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="text-slate-300 mx-auto mb-4" size={48} />
            <p className="text-slate-500">No claim codes found for this campaign period.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 mb-6">
              <KPICard
                title="Codes Redeemed"
                value={kpis.redeemedCount.toLocaleString()}
                subtext="Since Feb 10"
                icon={Hash}
              />
              <KPICard
                title="Conversion Rate"
                value={walletFetchInProgress ? 'Loading...' : `${kpis.conversionRate.toFixed(1)}%`}
                subtext={
                  walletFetchInProgress
                    ? 'Calculating...'
                    : `${kpis.convertedCount} of ${kpis.walletsLoaded} spent >$${CLAIM_CODE_CONVERSION_THRESHOLD}`
                }
                icon={Percent}
              />
              <KPICard
                title="Campaign Cost"
                value={`$${kpis.campaignCost.toLocaleString()}`}
                subtext={`$${CLAIM_CODE_COST} per code`}
                icon={Receipt}
              />
              <KPICard
                title="Redeemer Spending"
                value={walletFetchInProgress ? 'Loading...' : `$${kpis.totalRevenue.toLocaleString()}`}
                subtext="Total spent by redeemers"
                icon={DollarSign}
              />
              <KPICard
                title="New User Spending"
                value={walletFetchInProgress ? 'Loading...' : `$${kpis.newUserSpend.toLocaleString()}`}
                subtext={walletFetchInProgress ? 'Calculating...' : `${kpis.newUserCount} new user${kpis.newUserCount !== 1 ? 's' : ''}`}
                icon={UserPlus}
              />
              <KPICard
                title="Existing User Spending"
                value={walletFetchInProgress ? 'Loading...' : `$${kpis.existingUserSpend.toLocaleString()}`}
                subtext={walletFetchInProgress ? 'Calculating...' : `${kpis.existingUserCount} existing user${kpis.existingUserCount !== 1 ? 's' : ''}`}
                icon={UserCheck}
              />
              <KPICard
                title="Contribution to Net Revenue"
                value={walletFetchInProgress ? 'Loading...' : `$${kpis.revenueContribution.toLocaleString()}`}
                subtext="15% of redeemer spending"
                icon={TrendingUp}
              />
              <KPICard
                title="Net ROI"
                value={walletFetchInProgress ? 'Loading...' : `${kpis.netROI >= 0 ? '+' : ''}${kpis.netROI.toFixed(1)}%`}
                subtext={
                  walletFetchInProgress
                    ? 'Calculating...'
                    : `$${(kpis.revenueContribution - kpis.campaignCost).toLocaleString()} net`
                }
                icon={Percent}
              />
            </div>

            {/* Codes Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search by code..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    className="rounded border border-slate-200 px-2.5 py-1 text-xs text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200 w-44"
                  />
                  <span className="text-xs text-slate-500">
                    Showing {sortedCodes.length === 0 ? 0 : Math.min((page - 1) * CODES_PER_PAGE + 1, sortedCodes.length)}-{Math.min(page * CODES_PER_PAGE, sortedCodes.length)} of {sortedCodes.length} codes
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded border border-slate-200 px-2 py-1 font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span>Page {page} of {totalPages}</span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded border border-slate-200 px-2 py-1 font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
                    <tr>
                      <th
                        className="px-6 py-3 cursor-pointer select-none hover:text-indigo-600"
                        onClick={() => handleSort('code')}
                      >
                        <span className="flex items-center gap-1">Code <SortIcon column="code" /></span>
                      </th>
                      <th
                        className="px-6 py-3 cursor-pointer select-none hover:text-indigo-600"
                        onClick={() => handleSort('status')}
                      >
                        <span className="flex items-center gap-1">Status <SortIcon column="status" /></span>
                      </th>
                      <th className="px-6 py-3">Wallet</th>
                      <th className="px-6 py-3">Type</th>
                      <th
                        className="px-6 py-3 cursor-pointer select-none hover:text-indigo-600"
                        onClick={() => handleSort('date')}
                      >
                        <span className="flex items-center gap-1">Redeemed At <SortIcon column="date" /></span>
                      </th>
                      <th
                        className="px-6 py-3 text-right cursor-pointer select-none hover:text-indigo-600"
                        onClick={() => handleSort('spend')}
                      >
                        <span className="flex items-center gap-1 justify-end">User Spend <SortIcon column="spend" /></span>
                      </th>
                      <th className="px-6 py-3 text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagedCodes.map((code, idx) => {
                      const codeId = getCodeIdentifier(code);
                      const redeemed = isCodeRedeemed(code);
                      const wallet = getCodeWallet(code);
                      const walletKey = wallet?.toLowerCase();
                      const date = getCodeDate(code);
                      const spendInfo = walletKey != null ? walletSpend[walletKey] : undefined;
                      const spend = spendInfo?.totalSpent;
                      const spendKnown = typeof spend === 'number';
                      const net = spendKnown ? spend - CLAIM_CODE_COST : null;

                      return (
                        <tr key={codeId || idx} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-6 py-3 font-mono text-xs text-slate-700">{codeId}</td>
                          <td className="px-6 py-3">
                            {redeemed ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-semibold border border-emerald-200">
                                <CheckCircle size={12} />
                                Redeemed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs font-semibold">
                                <Circle size={12} />
                                Unused
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            {wallet ? (
                              <button
                                onClick={() => onNavigateToWallet?.(wallet)}
                                className="font-mono text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                                title={wallet}
                              >
                                {wallet.slice(0, 6)}...{wallet.slice(-4)}
                              </button>
                            ) : (
                              <span className="text-slate-300">--</span>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            {redeemed && spendInfo && typeof spendInfo.isNewUser === 'boolean' ? (
                              spendInfo.isNewUser ? (
                                <span className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold border border-blue-200">
                                  New
                                </span>
                              ) : (
                                <span className="inline-flex items-center bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-semibold border border-amber-200">
                                  Existing
                                </span>
                              )
                            ) : (
                              <span className="text-slate-300">--</span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-xs text-slate-500">
                            {date ? date.toLocaleDateString() : '--'}
                          </td>
                          <td className="px-6 py-3 text-right font-bold">
                            {!redeemed ? (
                              <span className="text-slate-300">--</span>
                            ) : spendKnown ? (
                              <span className="text-slate-700">${spend.toLocaleString()}</span>
                            ) : spendInfo === null ? (
                              <span className="text-slate-300">--</span>
                            ) : (
                              <span className="text-slate-400 animate-pulse">...</span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-right font-bold">
                            {!redeemed ? (
                              <span className="text-slate-300">--</span>
                            ) : net !== null ? (
                              <span className={net >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                                {net >= 0 ? '+' : ''}${net.toLocaleString()}
                              </span>
                            ) : spendInfo === null ? (
                              <span className="text-slate-300">--</span>
                            ) : (
                              <span className="text-slate-400 animate-pulse">...</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {pagedCodes.length === 0 && (
                      <tr>
                        <td className="px-6 py-6 text-center text-slate-500" colSpan={7}>
                          No codes to display.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClaimCodeROI;
