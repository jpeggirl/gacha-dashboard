import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Users, Download, ChevronUp, ChevronDown, Filter, Wallet, RefreshCw, Calendar } from 'lucide-react';
import { fetchAcquisitionFunnel, getAcquisitionFunnelCache, saveAcquisitionFunnelCache, mergeAcquisitionData, isCacheStale } from '../services/posthogApi';

const DEFAULT_SINCE = '2026-02-01';

const DATE_PRESETS = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Since Feb 2026', value: 'all' },
  { label: 'Custom', value: 'custom' },
];

const getSinceDate = (preset, customFrom) => {
  if (preset === 'all') return DEFAULT_SINCE;
  if (preset === 'custom') return customFrom || DEFAULT_SINCE;
  const days = preset === '7d' ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const SortIcon = ({ column, sortConfig }) => {
  if (sortConfig.key !== column) {
    return <ChevronUp size={14} className="text-slate-300" />;
  }
  return sortConfig.direction === 'asc'
    ? <ChevronUp size={14} className="text-indigo-600" />
    : <ChevronDown size={14} className="text-indigo-600" />;
};

const WalletDropdown = ({ wallets, onNavigateToWallet }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!wallets || wallets.length === 0) return <span>0</span>;

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="text-indigo-600 hover:text-indigo-800 font-medium underline decoration-dotted underline-offset-2 cursor-pointer"
      >
        {wallets.length.toLocaleString()}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[280px] max-h-[240px] overflow-y-auto">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
            {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
          </div>
          {wallets.map((w, i) => (
            <button
              key={i}
              onClick={() => { onNavigateToWallet(w); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm font-mono text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition-colors"
            >
              <Wallet size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">{w}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const AcquisitionFunnelTable = ({ onNavigateToWallet }) => {
  const [data, setData] = useState([]);
  const [perWalletData, setPerWalletData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cachedAt, setCachedAt] = useState(null);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [mediumFilter, setMediumFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'first_seen', direction: 'desc' });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  // Date range state
  const [datePreset, setDatePreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const [includeNonPaying, setIncludeNonPaying] = useState(false);

  useEffect(() => {
    loadData('all');
  }, []);

  const isDefaultRange = (preset) => preset === 'all';

  const loadData = async (preset, fromOverride) => {
    setError(null);
    const sinceDate = getSinceDate(preset, fromOverride);
    const useCache = isDefaultRange(preset);

    // For default range, try cache first
    if (useCache) {
      const cache = getAcquisitionFunnelCache();
      if (cache) {
        setData(cache.data);
        setPerWalletData([]);
        setCachedAt(cache.cachedAt);
        setLoading(false);

        if (!isCacheStale(cache.cachedAt)) {
          return;
        }

        setRefreshing(true);
        try {
          const freshRows = await fetchAcquisitionFunnel({ sinceDate: cache.cachedAt });
          if (freshRows.length > 0) {
            const merged = mergeAcquisitionData(cache.data, freshRows);
            saveAcquisitionFunnelCache(merged);
            setData(merged);
          } else {
            saveAcquisitionFunnelCache(cache.data);
          }
          setCachedAt(new Date().toISOString());
        } catch (err) {
          console.warn('[AcquisitionFunnel] Incremental refresh failed, using cached data:', err.message);
        } finally {
          setRefreshing(false);
        }
        return;
      }
    }

    // Fresh fetch (no cache or non-default range)
    setLoading(true);
    setPerWalletData([]);
    try {
      const result = await fetchAcquisitionFunnel({ sinceDate });
      // result is always grouped array for non-email fetches
      const rows = result;
      if (useCache) {
        saveAcquisitionFunnelCache(rows);
      }
      setData(rows);
      setCachedAt(useCache ? new Date().toISOString() : null);
    } catch (err) {
      console.error('[AcquisitionFunnel]', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDatePresetChange = (preset) => {
    setDatePreset(preset);
    setPage(1);
    if (preset !== 'custom') {
      loadData(preset);
    }
  };

  const handleCustomDateApply = () => {
    if (customFrom) {
      setPage(1);
      loadData('custom', customFrom);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
    setPage(1);
  };

  // Unique values for dropdown filters
  const sourceOptions = useMemo(() => [...new Set(data.map(r => r.utm_source))].sort(), [data]);
  const mediumOptions = useMemo(() => [...new Set(data.map(r => r.utm_medium))].sort(), [data]);

  const filtered = useMemo(() => {
    return data.filter(row => {
      if (sourceFilter !== 'all' && row.utm_source !== sourceFilter) return false;
      if (mediumFilter !== 'all' && row.utm_medium !== mediumFilter) return false;
      return true;
    });
  }, [data, sourceFilter, mediumFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (sortConfig.key === 'first_seen') {
        const aTime = aVal ? new Date(aVal).getTime() : 0;
        const bTime = bVal ? new Date(bVal).getTime() : 0;
        return sortConfig.direction === 'asc' ? aTime - bTime : bTime - aTime;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal ?? '');
      const bStr = String(bVal ?? '');
      return sortConfig.direction === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
    return arr;
  }, [filtered, sortConfig]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totals = useMemo(() => ({
    unique_buyers: filtered.reduce((s, r) => s + (r.unique_buyers || 0), 0),
    total_purchases: filtered.reduce((s, r) => s + (r.total_purchases || 0), 0),
    total_revenue: filtered.reduce((s, r) => s + (r.total_revenue || 0), 0)
  }), [filtered]);

  const exportCSV = async () => {
    setExporting(true);
    try {
      // Fetch per-wallet detail with emails for the current date range
      const sinceDate = getSinceDate(datePreset, customFrom);
      const result = await fetchAcquisitionFunnel({ sinceDate, includeEmails: true, includeNonPaying });
      let rows = result.perWallet || [];
      if (sourceFilter !== 'all') {
        rows = rows.filter(r => r.utm_source === sourceFilter);
      }
      if (mediumFilter !== 'all') {
        rows = rows.filter(r => r.utm_medium === mediumFilter);
      }

      const headers = ['wallet', 'email', 'utm_source', 'utm_medium', 'utm_campaign', 'referring_domain', 'country', 'total_purchases', 'total_spent', 'first_purchase_at', 'first_seen_at'];
      const csvRows = [headers.join(',')];
      rows.forEach(row => {
        csvRows.push(headers.map(h => {
          const val = row[h] ?? '';
          const str = String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filterSuffix = [
        sourceFilter !== 'all' ? sourceFilter : '',
        mediumFilter !== 'all' ? mediumFilter : '',
      ].filter(Boolean).join('_');
      a.download = `acquisition_detail_${new Date().toISOString().slice(0, 10)}${filterSuffix ? '_' + filterSuffix : ''}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[AcquisitionFunnel] CSV export failed:', err);
      setError('CSV export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (val) => {
    if (!val) return '\u2014';
    const d = new Date(val);
    if (isNaN(d)) return '\u2014';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const columns = [
    { key: 'first_seen', label: 'First Seen' },
    { key: 'utm_source', label: 'Source' },
    { key: 'utm_medium', label: 'Medium' },
    { key: 'utm_campaign', label: 'Campaign' },
    { key: 'referring_domain', label: 'Referrer' },
    { key: 'country', label: 'Country' },
    { key: 'unique_buyers', label: 'Buyers', numeric: true },
    { key: 'total_purchases', label: 'Purchases', numeric: true },
    { key: 'total_revenue', label: 'Purchase', numeric: true }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Users className="text-indigo-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Acquisition Funnel</h2>
              <div className="flex items-center gap-2">
                <p className="text-slate-500 text-sm">New paying users by acquisition channel</p>
                {refreshing && (
                  <span className="inline-flex items-center gap-1 text-xs text-indigo-500">
                    <RefreshCw size={12} className="animate-spin" />
                    Updating...
                  </span>
                )}
                {cachedAt && !refreshing && !loading && (
                  <span className="text-xs text-slate-400">
                    Updated {new Date(cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Date range presets */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar size={16} />
            <span className="text-sm font-medium">Date Range:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {DATE_PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => handleDatePresetChange(p.value)}
                disabled={loading}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  datePreset === p.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-indigo-300'
                } disabled:opacity-50`}
              >
                {p.label}
              </button>
            ))}
            {datePreset === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-slate-400 text-sm">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  placeholder="now"
                  className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleCustomDateApply}
                  disabled={!customFrom || loading}
                  className="px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters + export */}
        <div className="flex items-center gap-3 flex-wrap mt-3">
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-400" />
            <select
              value={sourceFilter}
              onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
              className="px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All Sources</option>
              {sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={mediumFilter}
              onChange={e => { setMediumFilter(e.target.value); setPage(1); }}
              className="px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All Mediums</option>
              {mediumOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeNonPaying}
              onChange={e => setIncludeNonPaying(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Include non-paying visitors
          </label>
          <button
            onClick={exportCSV}
            disabled={data.length === 0 || exporting}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Loading acquisition data...</p>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => loadData(datePreset, customFrom)}
                className="mt-2 text-sm text-red-600 underline hover:text-red-800"
              >
                Retry
              </button>
            </div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <Users className="text-slate-300 mx-auto mb-4" size={48} />
            <p className="text-slate-500">No acquisition data found.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {columns.map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={`px-4 py-3 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap ${col.numeric ? 'text-right' : 'text-left'}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        <SortIcon column={col.key} sortConfig={sortConfig} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{formatDate(row.first_seen)}</td>
                    <td className="px-4 py-3 text-slate-700">{row.utm_source}</td>
                    <td className="px-4 py-3 text-slate-700">{row.utm_medium}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate" title={row.utm_campaign}>
                      {row.utm_campaign}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.referring_domain}</td>
                    <td className="px-4 py-3 text-slate-700">{row.country}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      <WalletDropdown wallets={row.wallets} onNavigateToWallet={onNavigateToWallet} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{row.total_purchases?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">${row.total_revenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td colSpan={6} className="px-4 py-3 font-semibold text-slate-700">
                    Totals ({filtered.length} rows)
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{totals.unique_buyers.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{totals.total_purchases.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700">${totals.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AcquisitionFunnelTable;
