import React, { useState, useEffect, useMemo } from 'react';
import { Users, Download, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { fetchAcquisitionFunnel } from '../services/posthogApi';

const SortIcon = ({ column, sortConfig }) => {
  if (sortConfig.key !== column) {
    return <ChevronUp size={14} className="text-slate-300" />;
  }
  return sortConfig.direction === 'asc'
    ? <ChevronUp size={14} className="text-indigo-600" />
    : <ChevronDown size={14} className="text-indigo-600" />;
};

const AcquisitionFunnelTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [mediumFilter, setMediumFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'total_revenue', direction: 'desc' });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchAcquisitionFunnel();
      // Filter out rows where source is "unknown"
      setData(rows.filter(row => row.utm_source !== 'unknown'));
    } catch (err) {
      console.error('[AcquisitionFunnel]', err);
      setError(err.message);
    } finally {
      setLoading(false);
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

  const exportCSV = () => {
    const headers = ['utm_source', 'utm_medium', 'utm_campaign', 'referring_domain', 'country', 'unique_buyers', 'total_purchases', 'total_revenue'];
    const csvRows = [headers.join(',')];
    sorted.forEach(row => {
      csvRows.push(headers.map(h => {
        const val = row[h] ?? '';
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acquisition_funnel_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { key: 'utm_source', label: 'Source' },
    { key: 'utm_medium', label: 'Medium' },
    { key: 'utm_campaign', label: 'Campaign' },
    { key: 'referring_domain', label: 'Referrer' },
    { key: 'country', label: 'Country' },
    { key: 'unique_buyers', label: 'Buyers', numeric: true },
    { key: 'total_purchases', label: 'Purchases', numeric: true },
    { key: 'total_revenue', label: 'Revenue', numeric: true }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Users className="text-indigo-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Acquisition Funnel</h2>
              <p className="text-slate-500 text-sm">New paying users by acquisition channel (since Feb 2026)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
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
            <button
              onClick={exportCSV}
              disabled={data.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={14} />
              CSV
            </button>
          </div>
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
                onClick={loadData}
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
                    <td className="px-4 py-3 text-slate-700">{row.utm_source}</td>
                    <td className="px-4 py-3 text-slate-700">{row.utm_medium}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate" title={row.utm_campaign}>
                      {row.utm_campaign}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.referring_domain}</td>
                    <td className="px-4 py-3 text-slate-700">{row.country}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{row.unique_buyers?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{row.total_purchases?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">${row.total_revenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td colSpan={5} className="px-4 py-3 font-semibold text-slate-700">
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
