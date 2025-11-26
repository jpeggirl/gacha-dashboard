import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, ExternalLink, RefreshCw } from 'lucide-react';
import { fetchLeaderboard } from '../services/leaderboardApi';

const Leaderboard = () => {
  const [leaderboardType, setLeaderboardType] = useState('total'); // 'total' or 'weekly'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [leaderboardType]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchLeaderboard(leaderboardType);
      console.log('[Leaderboard] Raw API response:', response);
      
      // Handle different response structures:
      // - Total endpoint returns: [{...}, {...}] (direct array)
      // - Weekly endpoint returns: {topRankers: [{...}, {...}], myRank: null, myRankNum: -1}
      let leaderboardData = [];
      
      if (Array.isArray(response)) {
        // Total endpoint - direct array
        leaderboardData = response;
      } else if (response && response.topRankers && Array.isArray(response.topRankers)) {
        // Weekly endpoint - wrapped in topRankers
        leaderboardData = response.topRankers;
      } else if (response && response.data && Array.isArray(response.data)) {
        // Alternative structure with data property
        leaderboardData = response.data;
      } else if (response && response.leaderboard && Array.isArray(response.leaderboard)) {
        // Alternative structure with leaderboard property
        leaderboardData = response.leaderboard;
      }
      
      // Ensure data is sorted by total_purchase_amount (descending)
      // The API should already be sorted, but we'll sort it again to be sure
      leaderboardData = leaderboardData
        .filter(item => item && item.wallet) // Filter out invalid entries
        .sort((a, b) => (b.total_purchase_amount || 0) - (a.total_purchase_amount || 0))
        .map((item, index) => ({
          ...item,
          rank: item.rank || index + 1 // Use API rank if available, otherwise calculate
        }));
      
      console.log('[Leaderboard] Processed data:', {
        type: leaderboardType,
        count: leaderboardData.length,
        firstItem: leaderboardData[0],
        sample: leaderboardData.slice(0, 3)
      });
      setData(leaderboardData);
    } catch (err) {
      setError(err.message || 'Failed to load leaderboard');
      console.error('Error loading leaderboard:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Format Twitter username to URL
  const getTwitterUrl = (username) => {
    if (!username) return null;
    // Remove @ if present
    const cleanUsername = username.replace(/^@/, '');
    return `https://twitter.com/${cleanUsername}`;
  };

  // Get rank emoji
  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="text-indigo-600" size={24} />
            <h2 className="text-2xl font-bold text-slate-900">Leaderboard</h2>
          </div>
          <button
            onClick={loadLeaderboard}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        {/* Toggle between Total and Weekly */}
        <div className="flex gap-2">
          <button
            onClick={() => setLeaderboardType('total')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              leaderboardType === 'total'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar size={16} />
            All Time
          </button>
          <button
            onClick={() => setLeaderboardType('weekly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              leaderboardType === 'weekly'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar size={16} />
            Weekly
          </button>
        </div>
      </div>

      {/* Leaderboard Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="text-slate-300 mx-auto mb-4" size={48} />
            <p className="text-slate-500">No leaderboard data available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((item) => {
              const rank = item.rank || 1;
              const twitterUrl = getTwitterUrl(item.username);
              const displayName = item.username || 'Anonymous';
              const totalPurchaseAmount = item.total_purchase_amount || 0;
              const totalWinValue = item.total_win_value || 0;
              const wallet = item.wallet || item.wallet_address || '';
              
              // Calculate P&L: total spent - win amount
              const pnl = totalPurchaseAmount - totalWinValue;
              const isProfit = pnl < 0; // Negative P&L means profit (spent less than won)
              
              return (
                <div
                  key={item.wallet || item.wallet_address || item.rank}
                  className={`p-4 rounded-lg border transition-all ${
                    rank <= 3
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-12 text-center">
                        <span className="text-lg font-bold text-slate-700">
                          {getRankEmoji(rank)}
                        </span>
                      </div>
                      
                      {/* Username/Twitter */}
                      <div className="flex-1 min-w-0">
                        {twitterUrl && item.username ? (
                          <a
                            href={twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors group"
                          >
                            <span className="truncate">@{displayName.replace(/^@/, '')}</span>
                            <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ) : (
                          <span className="text-slate-700 font-semibold">{displayName}</span>
                        )}
                        {wallet && (
                          <p className="text-xs text-slate-500 font-mono mt-1">
                            {wallet.slice(0, 6)}...{wallet.slice(-4)}
                          </p>
                        )}
                      </div>
                      
                      {/* Total Spent */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-lg font-bold text-slate-900">
                          ${totalPurchaseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-500">
                          Total Spent
                        </p>
                        {totalWinValue > 0 && (
                          <p className="text-xs text-indigo-600 mt-1">
                            Win: ${totalWinValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        )}
                        {item.wins_count && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {item.wins_count.toLocaleString()} {item.wins_count === 1 ? 'win' : 'wins'}
                          </p>
                        )}
                      </div>
                      
                      {/* P&L */}
                      <div className="flex-shrink-0 text-right ml-6">
                        <p className={`text-lg font-bold ${
                          isProfit 
                            ? 'text-green-600' 
                            : pnl > 0 
                              ? 'text-red-600' 
                              : 'text-slate-600'
                        }`}>
                          {isProfit ? '+' : ''}${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-500">
                          P&L
                        </p>
                        <p className={`text-xs mt-1 ${
                          isProfit 
                            ? 'text-green-600' 
                            : pnl > 0 
                              ? 'text-red-600' 
                              : 'text-slate-400'
                        }`}>
                          {isProfit ? 'Profit' : pnl > 0 ? 'Loss' : 'Break Even'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

