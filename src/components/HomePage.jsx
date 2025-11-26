import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Plus, Search, Activity, Wallet } from 'lucide-react';
import { getAnnouncementsFeed } from '../services/supabaseService';
import { supabase, isSupabaseReady } from '../config/supabase';
import Leaderboard from './Leaderboard';

const HomePage = ({ onNavigateToWallet: originalNavigateToWallet }) => {
  // Create a wrapper function that accepts wallet address
  const handleNavigateToWallet = (walletAddress) => {
    if (originalNavigateToWallet && walletAddress) {
      originalNavigateToWallet(walletAddress);
    }
  };
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFeed();
    
    // Only set up real-time subscription if Supabase is configured
    if (isSupabaseReady) {
      const channel = supabase
        .channel('profile-comments-feed')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'profile_comments' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              // Add new comment to the top of the feed
              setFeedItems(prev => [payload.new, ...prev]);
            } else if (payload.eventType === 'DELETE') {
              // Remove deleted comment from feed
              setFeedItems(prev => prev.filter(item => item.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const loadFeed = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await getAnnouncementsFeed();
    if (err) {
      setError('Failed to load feed. Please check your Supabase connection.');
      console.error(err);
    } else {
      setFeedItems(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Activity size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome to GachaAdmin Hub</h1>
                <p className="text-indigo-100">Manage and analyze wallet purchases with ease</p>
              </div>
            </div>
            <button
              onClick={onNavigateToWallet}
              className="mt-4 bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Search size={20} />
              Search Wallet Address
            </button>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="mb-8">
          <Leaderboard onNavigateToWallet={handleNavigateToWallet} />
        </div>

        {/* Live Feed Section - Shows all profile comments from all wallets */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="text-indigo-600" size={24} />
              <h2 className="text-2xl font-bold text-slate-900">Live Feed</h2>
            </div>
            <p className="text-slate-500 text-sm">All profile comments from all wallets, sorted by newest first</p>
          </div>

          {/* Feed List */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-slate-500">Loading feed...</p>
              </div>
            ) : feedItems.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="text-slate-300 mx-auto mb-4" size={48} />
                <p className="text-slate-500">No comments yet. Add comments to wallet profiles to see them here!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold text-sm">
                            {item.author?.charAt(0).toUpperCase() || 'A'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{item.author || 'Admin'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Wallet size={12} className="text-slate-400" />
                            <span className="text-xs text-slate-500 font-mono">
                              {item.wallet_address?.slice(0, 10)}...{item.wallet_address?.slice(-8)}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">
                              {new Date(item.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap mt-2">{item.comment}</p>
                  </div>
                ))}
              </div>
            )}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

