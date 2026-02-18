import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Package, TrendingUp, Trophy, Wallet } from 'lucide-react';

// Services
import { fetchPackPurchases } from './services/api';
import { fetchLeaderboard } from './services/leaderboardApi';
import { generateMockData } from './utils/mockData';
import { processAnalytics } from './utils/analytics';
import { extractTransactions } from './utils/normalizeResponse';

// Components
import Header from './components/Header';
import KPICard from './components/KPICard';
import UserProfile from './components/UserProfile';
import SpendingMixChart from './components/SpendingMixChart';
import ActivityChart from './components/ActivityChart';
import TransactionTable from './components/TransactionTable';
import InventoryGrid from './components/InventoryGrid';
import LoadingOverlay from './components/LoadingOverlay';
import ErrorMessage from './components/ErrorMessage';
import MockDataBanner from './components/MockDataBanner';
import EmptyState from './components/EmptyState';
import TimeFrameFilter from './components/TimeFrameFilter';
import Login from './components/Login';
import HomePage from './components/HomePage';
import ProfileComments from './components/ProfileComments';
import FreePacksSection from './components/FreePacksSection';
import UserTags from './components/UserTags';

// Config
import { DEFAULT_WALLET, DEFAULT_TRANSACTIONS_LIMIT, DEFAULT_INVENTORY_LIMIT } from './config/constants';
import { getCurrentUser } from './config/users';
import { getUserTags } from './services/supabaseService';

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
  const [userTags, setUserTags] = useState([]); // Tags for current user

  // Pagination state
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [inventoryPage, setInventoryPage] = useState(1);

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

  // Fetch user tags for the current wallet
  const fetchUserTags = async (walletAddress) => {
    if (!walletAddress) {
      setUserTags([]);
      return;
    }

    try {
      const { data, error } = await getUserTags(walletAddress);
      if (error) {
        console.warn("Failed to fetch user tags:", error);
        setUserTags([]);
      } else {
        setUserTags(data || []);
      }
    } catch (err) {
      console.warn("Error fetching user tags:", err);
      setUserTags([]);
    }
  };

  // Handle tags update callback
  const handleTagsUpdate = (newTags) => {
    setUserTags(newTags);
  };

  const fetchData = async (e, identifierOverride = null, options = {}) => {
    if (e) e.preventDefault();

    const identifier = identifierOverride || searchTerm;

    if (!identifier || !identifier.trim()) {
      setError("Please enter a wallet address, username, or email.");
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Update searchTerm if identifier was provided
    if (identifierOverride) {
      setSearchTerm(identifierOverride);
    }

    const txPage = options.transactionsPage ?? transactionsPage;
    const invPage = options.inventoryPage ?? inventoryPage;

    try {
      const jsonData = await fetchPackPurchases(identifier.trim(), {
        transactionsPage: txPage,
        transactionsLimit: DEFAULT_TRANSACTIONS_LIMIT,
        inventoryPage: invPage,
        inventoryLimit: DEFAULT_INVENTORY_LIMIT,
      });
      setData(jsonData);
      setDataSource('api');

      // Fetch leaderboard to check if user is in top 50
      await fetchLeaderboardData();

      // Fetch user tags
      await fetchUserTags(identifier.trim());
    } catch (err) {
      console.warn("API failed, using mock fallback.", {
        error: err.message,
        name: err.name,
        wallet: identifier
      });
      // Fallback to Mock Data matching the structure
      const mock = generateMockData(identifier.trim());

      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 600));

      setData(mock);
      setDataSource('mock');

      // Still try to fetch leaderboard even with mock data
      await fetchLeaderboardData();

      // Fetch user tags
      await fetchUserTags(identifier.trim());
    } finally {
      setLoading(false);
    }
  };

  // Page change handlers
  const handleTransactionsPageChange = (page) => {
    setTransactionsPage(page);
    fetchData(null, null, { transactionsPage: page, inventoryPage });
  };

  const handleInventoryPageChange = (page) => {
    setInventoryPage(page);
    fetchData(null, null, { transactionsPage, inventoryPage: page });
  };

  // Auto-load on mount
  useEffect(() => {
    // Only fetch if we have a search term
    if (searchTerm.trim()) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive analytics from data - no more client-side time frame re-filtering of transactions
  // KPIs come from root-level totalSpent/totalWinnings/rtp; charts use packBreakdown
  const filteredData = useMemo(() => {
    if (!data) return null;

    const { items: transactions } = extractTransactions(data.transactions);

    return {
      ...data,
      transactions,
    };
  }, [data]);

  // Process analytics data
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
            setTransactionsPage(1);
            setInventoryPage(1);
            fetchData(e);
          }}
          loading={loading}
          onLogout={handleLogout}
          currentView={currentView}
          onNavigateHome={() => setCurrentView('home')}
        />
        <HomePage onNavigateToWallet={(walletAddress) => {
          setCurrentView('wallet');
          setTransactionsPage(1);
          setInventoryPage(1);
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
        onSearchSubmit={(e) => {
          setTransactionsPage(1);
          setInventoryPage(1);
          fetchData(e);
        }}
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
                email={data?.email}
                lastInteraction={stats.transactions[0]?.loggedAt}
                tags={userTags}
              />

              <UserTags
                walletAddress={stats.wallet}
                onTagsUpdate={handleTagsUpdate}
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
                  <div className="flex flex-wrap gap-4 mb-8">
                    <KPICard
                      title="Total Spent"
                      value={`$${stats.totalSpent.toLocaleString()}`}
                      subtext={timeFrame === 'all' ? 'Lifetime' : timeFrame === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                      icon={DollarSign}
                    />
                    <KPICard
                      title="Total Winnings"
                      value={`$${stats.totalWinnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      subtext={`RTP: ${stats.rtp.toFixed(1)}%`}
                      icon={Trophy}
                    />
                    <KPICard
                      title="Net Winnings"
                      value={`${stats.netWinnings >= 0 ? '+' : ''}$${stats.netWinnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      subtext={stats.netWinnings >= 0 ? 'Profit' : 'Loss'}
                      icon={Wallet}
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
                    pagination={stats.transactionsPagination}
                    onPageChange={handleTransactionsPageChange}
                    loading={loading}
                  />

                  {/* Inventory Grid */}
                  <div className="mt-8">
                    <InventoryGrid
                      items={stats.inventoryItems}
                      pagination={stats.inventoryPagination}
                      onPageChange={handleInventoryPageChange}
                      loading={loading}
                    />
                  </div>
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
