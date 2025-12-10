import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Package, TrendingUp, CheckCircle2, LogOut } from 'lucide-react';

// Services
import { fetchPackPurchases } from './services/api';
import { fetchLeaderboard } from './services/leaderboardApi';
import { generateMockData } from './utils/mockData';
import { processAnalytics } from './utils/analytics';

// Components
import Header from './components/Header';
import KPICard from './components/KPICard';
import UserProfile from './components/UserProfile';
import SpendingMixChart from './components/SpendingMixChart';
import ActivityChart from './components/ActivityChart';
import TransactionTable from './components/TransactionTable';
import LoadingOverlay from './components/LoadingOverlay';
import ErrorMessage from './components/ErrorMessage';
import MockDataBanner from './components/MockDataBanner';
import EmptyState from './components/EmptyState';
import TimeFrameFilter from './components/TimeFrameFilter';
import Login from './components/Login';
import HomePage from './components/HomePage';
import ProfileComments from './components/ProfileComments';
import FreePacksSection from './components/FreePacksSection';

// Config
import { DEFAULT_WALLET } from './config/constants';
import { getCurrentUser } from './config/users';

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if user is already authenticated
    const authTime = sessionStorage.getItem('admin_auth_time');
    const isAuth = sessionStorage.getItem('admin_authenticated') === 'true';
    
    // Check if session is still valid (8 hours)
    if (isAuth && authTime) {
      const eightHours = 8 * 60 * 60 * 1000;
      const timeElapsed = Date.now() - parseInt(authTime, 10);
      if (timeElapsed < eightHours) {
        return true;
      } else {
        // Session expired
        sessionStorage.removeItem('admin_authenticated');
        sessionStorage.removeItem('admin_auth_time');
        sessionStorage.removeItem('current_username');
        sessionStorage.removeItem('current_user_name');
        return false;
      }
    }
    return false;
  });

  // Get current logged-in user
  const currentUser = getCurrentUser();

  const [searchTerm, setSearchTerm] = useState(DEFAULT_WALLET);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState(null); // 'api' or 'mock'
  const [timeFrame, setTimeFrame] = useState('all'); // '7d', '30d', 'all'
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'wallet'
  const [leaderboardData, setLeaderboardData] = useState([]); // Top 50 leaderboard data

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_auth_time');
    sessionStorage.removeItem('current_username');
    sessionStorage.removeItem('current_user_name');
    setIsAuthenticated(false);
  };

  // Fetch leaderboard to check if user is in top 50
  const fetchLeaderboardData = async () => {
    try {
      const response = await fetchLeaderboard('total');
      let leaderboardData = [];
      
      // Handle different response structures
      if (Array.isArray(response)) {
        leaderboardData = response;
      } else if (response && response.topRankers && Array.isArray(response.topRankers)) {
        leaderboardData = response.topRankers;
      } else if (response && response.data && Array.isArray(response.data)) {
        leaderboardData = response.data;
      } else if (response && response.leaderboard && Array.isArray(response.leaderboard)) {
        leaderboardData = response.leaderboard;
      }
      
      // Get top 50 and ensure they have rank
      const top50 = leaderboardData
        .filter(item => item && item.wallet)
        .slice(0, 50)
        .map((item, index) => ({
          ...item,
          rank: item.rank || index + 1
        }));
      
      setLeaderboardData(top50);
    } catch (err) {
      console.warn("Failed to fetch leaderboard:", err);
      setLeaderboardData([]);
    }
  };

  const fetchData = async (e, walletAddress = null) => {
    if (e) e.preventDefault();
    
    const addressToSearch = walletAddress || searchTerm;
    
    if (!addressToSearch || !addressToSearch.trim()) {
      setError("Please enter a wallet address.");
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    // Update searchTerm if walletAddress was provided
    if (walletAddress) {
      setSearchTerm(walletAddress);
    }
    
    try {
      const jsonData = await fetchPackPurchases(addressToSearch.trim());
      setData(jsonData);
      setDataSource('api');
      
      // Fetch leaderboard to check if user is in top 50
      await fetchLeaderboardData();
    } catch (err) {
      console.warn("API failed, using mock fallback.", {
        error: err.message,
        name: err.name,
        wallet: addressToSearch
      });
      // Fallback to Mock Data matching the structure
      const mock = generateMockData(addressToSearch.trim());
      
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setData(mock);
      setDataSource('mock');
      
      // Still try to fetch leaderboard even with mock data
      await fetchLeaderboardData();
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on mount
  useEffect(() => {
    // Only fetch if we have a search term
    if (searchTerm.trim()) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter transactions based on selected time frame
  const filteredData = useMemo(() => {
    if (!data) return null;

    let filteredTransactions = [...data.transactions];

    if (timeFrame !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      if (timeFrame === '7d') {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (timeFrame === '30d') {
        cutoffDate.setDate(now.getDate() - 30);
      }

      filteredTransactions = data.transactions.filter(tx => {
        const txDate = new Date(tx.loggedAt);
        return txDate >= cutoffDate;
      });
    }

    // Recalculate totals and breakdown from filtered transactions
    const totalSpent = filteredTransactions.reduce((sum, tx) => sum + tx.packAmount, 0);
    const totalPacks = filteredTransactions.length;
    
    // Recalculate pack breakdown from filtered transactions
    const breakdownMap = {};
    filteredTransactions.forEach(tx => {
      // Find the pack name from the original breakdown
      const packInfo = data.packBreakdown.find(p => p.packAmount === tx.packAmount);
      if (packInfo) {
        const packName = packInfo.packName;
        if (!breakdownMap[packName]) {
          breakdownMap[packName] = {
            packName: packName,
            packAmount: tx.packAmount,
            count: 0,
            totalSpent: 0
          };
        }
        breakdownMap[packName].count += 1;
        breakdownMap[packName].totalSpent += tx.packAmount;
      }
    });

    return {
      ...data,
      transactions: filteredTransactions,
      totalSpent,
      totalPacks,
      packBreakdown: Object.values(breakdownMap),
      // Preserve free packs data (not filtered by time frame)
      totalFreePacksRedeemed: data.totalFreePacksRedeemed,
      freePackRedemptions: data.freePackRedemptions || []
    };
  }, [data, timeFrame]);

  // Process analytics data with filtered data
  // Pass original lifetime totalSpent for tier calculation
  const stats = useMemo(() => {
    if (!filteredData) return null;
    const lifetimeTotalSpent = data?.totalSpent || null;
    return processAnalytics(filteredData, lifetimeTotalSpent);
  }, [filteredData, data]);

  // Debug: Log to verify component is rendering
  console.log('App rendering', { loading, hasData: !!data, hasStats: !!stats, error });

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={setIsAuthenticated} />;
  }

  // Show homepage if on home view
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <Header
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchSubmit={(e) => {
            e.preventDefault();
            setCurrentView('wallet');
            fetchData(e);
          }}
          loading={loading}
          onLogout={handleLogout}
          currentView={currentView}
          onNavigateHome={() => setCurrentView('home')}
        />
        <HomePage onNavigateToWallet={(walletAddress) => {
          setCurrentView('wallet');
          fetchData(null, walletAddress);
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={fetchData}
        loading={loading}
        onLogout={handleLogout}
        currentView={currentView}
        onNavigateHome={() => setCurrentView('home')}
        currentUser={currentUser}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative">
        {loading && <LoadingOverlay />}

        <ErrorMessage message={error} />

        <div className={`transition-opacity duration-300 ${loading ? 'opacity-20' : 'opacity-100'}`}>
          {stats ? (
            <>
              {!loading && dataSource === 'mock' && (
                <MockDataBanner wallet={stats.wallet} />
              )}

              <UserProfile
                tier={stats.tier}
                wallet={stats.wallet}
                username={stats.username}
                lastInteraction={stats.transactions[0]?.loggedAt}
                isTop50={leaderboardData.some(item => 
                  (item.wallet || item.wallet_address || '').toLowerCase() === stats.wallet.toLowerCase()
                )}
                hasFreePacks={(stats.totalFreePacksRedeemed || 0) > 0}
              />

              <FreePacksSection
                totalFreePacksRedeemed={stats.totalFreePacksRedeemed}
                freePacks={stats.freePacks}
              />

              <TimeFrameFilter
                selectedTimeFrame={timeFrame}
                onTimeFrameChange={setTimeFrame}
              />

              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
                <div>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <KPICard 
                      title="Total Spent" 
                      value={`$${stats.totalSpent.toLocaleString()}`} 
                      subtext={timeFrame === 'all' ? 'Lifetime Revenue' : timeFrame === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                      icon={DollarSign}
                    />
                    <KPICard 
                      title="Packs Purchased" 
                      value={stats.totalPacks} 
                      subtext={timeFrame === 'all' ? 'Total Volume' : timeFrame === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                      icon={Package}
                    />
                    <KPICard 
                      title="Avg Order Value" 
                      value={`$${stats.avgOrderValue.toFixed(0)}`} 
                      subtext="Per Transaction"
                      icon={TrendingUp}
                    />
                    <KPICard 
                      title="Top Purchase" 
                      value={stats.pieData[0]?.name || 'N/A'} 
                      subtext={`${stats.pieData[0]?.count || 0} times`}
                      icon={CheckCircle2}
                    />
                  </div>

                  {/* Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <SpendingMixChart pieData={stats.pieData} />
                    <ActivityChart chartData={stats.chartData} />
                  </div>

                  {/* Transaction Table */}
                  <TransactionTable
                    transactions={stats.transactions}
                    priceToNameMap={stats.priceToNameMap}
                    freePacks={stats.freePacks}
                  />
                </div>

                {/* Profile Comments Sidebar */}
                <div className="xl:sticky xl:top-24 h-fit">
                  <ProfileComments walletAddress={stats.wallet} />
                </div>
              </div>
            </>
          ) : (
            !loading && !error && <EmptyState />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

