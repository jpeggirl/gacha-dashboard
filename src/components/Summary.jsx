import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, Users, DollarSign, BarChart3 } from 'lucide-react';
import { fetchReport } from '../services/reportApi';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

const Summary = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReport();
      setReportData(data);
    } catch (err) {
      setError(err.message || 'Failed to load report data');
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  const { today, overall } = reportData;

  // Define current packs (to be highlighted in green)
  const currentPackKeywords = ['Starter Pack', 'Great Pack', 'Rocket Pack', 'Master Pack'];

  // Helper function to check if a pack is current
  const isCurrentPack = (packName) => {
    return currentPackKeywords.some(keyword => packName.includes(keyword));
  };

  // Prepare chart data for pack stats
  const todayPackData = today?.packStats?.map(pack => ({
    name: pack.packName,
    value: pack.count,
    amount: pack.totalSpent,
    winnings: pack.totalWinnings,
    rtp: pack.rtp
  })) || [];

  const overallPackData = overall?.packStats?.map(pack => ({
    name: pack.packName,
    value: pack.count,
    amount: pack.totalSpent,
    winnings: pack.totalWinnings,
    rtp: pack.rtp
  })) || [];

  // Sort packs: current packs first, then old packs
  const sortedOverallPackData = [...overallPackData].sort((a, b) => {
    const aIsCurrent = isCurrentPack(a.name);
    const bIsCurrent = isCurrentPack(b.name);
    
    if (aIsCurrent && !bIsCurrent) return -1; // Current packs first
    if (!aIsCurrent && bIsCurrent) return 1;  // Old packs last
    return 0; // Keep original order within each group
  });

  // Calculate P&L from platform perspective: Revenue (purchases) - Payouts (winnings)
  // Positive = Platform profit, Negative = Platform loss
  const todayPurchase = today?.totalPurchaseAmount || 0;
  const todayWinnings = today?.totalWinnings || 0;
  const todayPL = todayPurchase - todayWinnings;
  
  const overallPurchase = overall?.totalPurchaseAmount || 0;
  const overallWinnings = overall?.totalWinnings || 0;
  const overallPL = overallPurchase - overallWinnings;
  
  // Debug logging
  console.log('[Summary] P&L Calculation:', {
    today: { purchase: todayPurchase, winnings: todayWinnings, pl: todayPL },
    overall: { purchase: overallPurchase, winnings: overallWinnings, pl: overallPL }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <BarChart3 className="text-indigo-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Pack Purchase Summary</h2>
            <p className="text-slate-500 text-sm">Today's and All-Time statistics</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Purchase Amount */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600">Today's Purchases</p>
            <Package className="text-indigo-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${(today?.totalPurchaseAmount || 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {today?.totalCount || 0} packs • {today?.uniqueUsers || 0} users
          </p>
        </div>

        {/* Today's Winnings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600">Today's Winnings</p>
            <DollarSign className="text-purple-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${(today?.totalWinnings || 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            RTP: {(today?.overallRtp || 0).toFixed(2)}%
          </p>
        </div>

        {/* All-Time Purchase Amount */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600">All-Time Purchases</p>
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${(overall?.totalPurchaseAmount || 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {overall?.totalCount || 0} packs
          </p>
        </div>

        {/* All-Time Winnings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600">All-Time Winnings</p>
            <DollarSign className="text-blue-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${(overall?.totalWinnings || 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            RTP: {(overall?.overallRtp || 0).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* P&L Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600">Today's P&L</p>
            <TrendingUp className={todayPL >= 0 ? 'text-green-600' : 'text-red-600'} size={20} />
          </div>
          <p className={`text-2xl font-bold ${todayPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {todayPL >= 0 ? '+' : ''}${todayPL.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {todayPL >= 0 ? 'Platform Profit' : 'Platform Loss'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600">All-Time P&L</p>
            <TrendingUp className={overallPL >= 0 ? 'text-green-600' : 'text-red-600'} size={20} />
          </div>
          <p className={`text-2xl font-bold ${overallPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {overallPL >= 0 ? '+' : ''}${overallPL.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {overallPL >= 0 ? 'Platform Profit' : 'Platform Loss'}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Pack Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Today's Pack Distribution</h3>
          {todayPackData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={todayPackData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {todayPackData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-slate-500">No pack purchases today</div>
          )}
        </div>

        {/* All-Time Pack Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">All-Time Pack Distribution</h3>
          {overallPackData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={overallPackData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {overallPackData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-slate-500">No pack data available</div>
          )}
        </div>
      </div>

      {/* Pack Stats Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Pack Statistics</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Pack</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Today Count</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Today Spent</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Today RTP</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">All-Time Count</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">All-Time Spent</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">All-Time RTP</th>
              </tr>
            </thead>
            <tbody>
              {sortedOverallPackData.map((pack, index) => {
                const todayPack = todayPackData.find(p => p.name === pack.name);
                const isCurrent = isCurrentPack(pack.name);
                return (
                  <tr 
                    key={index} 
                    className={`border-b border-slate-100 hover:bg-slate-50 ${
                      isCurrent ? 'bg-green-50' : ''
                    }`}
                  >
                    <td className={`py-3 px-4 text-sm font-medium ${
                      isCurrent ? 'text-green-700 font-bold' : 'text-slate-900'
                    }`}>
                      {pack.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">
                      {todayPack?.value || 0}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">
                      ${(todayPack?.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">
                      {todayPack ? `${todayPack.rtp.toFixed(2)}%` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">
                      {pack.value.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">
                      ${pack.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">
                      {pack.rtp.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Summary;

