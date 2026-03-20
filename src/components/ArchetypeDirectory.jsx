import React, { useState, useEffect } from 'react';
import { Users, Loader2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { supabase, isSupabaseReady } from '../config/supabase';
import { ARCHETYPES } from '../config/constants';
import { fetchLeaderboard } from '../services/leaderboardApi';
import ArchetypeBadge from './ArchetypeBadge';

const ArchetypeDirectory = ({ onNavigateToWallet }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedArchetype, setExpandedArchetype] = useState(null);
  const [usernameMap, setUsernameMap] = useState({}); // wallet -> username

  useEffect(() => {
    fetchProfiles();
    fetchUsernames();
  }, []);

  const fetchUsernames = async () => {
    try {
      const response = await fetchLeaderboard('total');
      const list = Array.isArray(response) ? response : response?.topRankers || response?.data || [];
      const map = {};
      list.forEach(item => {
        const wallet = item.wallet || item.wallet_address;
        if (wallet && item.username) {
          map[wallet.toLowerCase()] = item.username;
        }
      });
      setUsernameMap(map);
    } catch (err) {
      console.warn('Failed to fetch usernames for archetype directory:', err);
    }
  };

  const fetchProfiles = async () => {
    if (!isSupabaseReady) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('wallet_address, tags, archetype, archetype_status, archetype_override, nickname')
        .not('archetype', 'is', null);

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching archetype profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group profiles by archetype
  const grouped = {};
  for (const key of Object.keys(ARCHETYPES)) {
    grouped[key] = [];
  }
  for (const profile of profiles) {
    const arch = profile.archetype || 'unclassified';
    if (!grouped[arch]) grouped[arch] = [];
    grouped[arch].push(profile);
  }

  // Order: steady-periodic first (ICP), then binge-episodes, binge-and-gone, unclassified
  const displayOrder = ['steady-periodic', 'binge-episodes', 'binge-and-gone', 'unclassified'];

  const toggleExpand = (archetype) => {
    setExpandedArchetype(expandedArchetype === archetype ? null : archetype);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-indigo-500" />
        <span className="ml-3 text-slate-500">Loading archetypes...</span>
      </div>
    );
  }

  const totalClassified = profiles.filter(p => p.archetype && p.archetype !== 'unclassified').length;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Customer Archetypes</h2>
        <p className="text-sm text-slate-500 mt-1">
          {totalClassified} classified user{totalClassified !== 1 ? 's' : ''} across {Object.keys(ARCHETYPES).length - 1} archetypes
        </p>
      </div>

      <div className="space-y-4">
        {displayOrder.map((archetypeId) => {
          const config = ARCHETYPES[archetypeId];
          const users = grouped[archetypeId] || [];
          const isExpanded = expandedArchetype === archetypeId;

          return (
            <div
              key={archetypeId}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Header row — always visible */}
              <button
                onClick={() => users.length > 0 && toggleExpand(archetypeId)}
                className={`w-full flex items-center justify-between p-5 text-left transition-colors ${
                  users.length > 0 ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'
                }`}
              >
                <div className="flex items-center gap-4">
                  <ArchetypeBadge archetype={archetypeId} />
                  <div>
                    <p className="text-sm text-slate-500">{config.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-slate-900">{users.length}</span>
                  <span className="text-sm text-slate-500">user{users.length !== 1 ? 's' : ''}</span>
                  {users.length > 0 && (
                    isExpanded
                      ? <ChevronUp size={18} className="text-slate-400" />
                      : <ChevronDown size={18} className="text-slate-400" />
                  )}
                </div>
              </button>

              {/* Expanded user list */}
              {isExpanded && users.length > 0 && (
                <div className="border-t border-slate-100">
                  <div className="divide-y divide-slate-100">
                    {users.map((user) => {
                      const twitterUsername = usernameMap[user.wallet_address.toLowerCase()];
                      const displayName = twitterUsername || user.nickname || null;

                      return (
                      <div
                        key={user.wallet_address}
                        className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => onNavigateToWallet(user.wallet_address)}
                            className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline truncate"
                            title={user.wallet_address}
                          >
                            {displayName ? (
                              <span className="font-semibold">
                                {twitterUsername ? `@${twitterUsername.replace(/^@/, '')}` : displayName}
                              </span>
                            ) : (
                              <span className="font-mono">{user.wallet_address}</span>
                            )}
                          </button>
                          {user.archetype_override && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                              manual
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          {user.tags && user.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              {user.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                              {user.tags.length > 2 && (
                                <span className="text-[10px] text-slate-400">
                                  +{user.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                          <button
                            onClick={() => onNavigateToWallet(user.wallet_address)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="View wallet"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ArchetypeDirectory;
