import React from 'react';
import { User, Wallet, ExternalLink } from 'lucide-react';

// Format Twitter username to URL
const getTwitterUrl = (username) => {
  if (!username) return null;
  // Remove @ if present
  const cleanUsername = username.replace(/^@/, '');
  return `https://twitter.com/${cleanUsername}`;
};

const UserProfile = ({ tier, wallet, username, lastInteraction, isTop50 = false, hasFreePacks = false }) => {
  const twitterUrl = getTwitterUrl(username);
  const displayName = username || 'Anonymous';

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-200 pb-6">
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-full border-2 shadow-sm bg-white border-slate-100">
          <User size={32} className="text-slate-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {twitterUrl && username ? (
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors group"
              >
                <h2 className="text-3xl font-bold text-slate-900">@{displayName.replace(/^@/, '')}</h2>
                <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ) : (
              <h2 className="text-3xl font-bold text-slate-900">{displayName}</h2>
            )}
            {isTop50 && (
              <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                VIP
              </span>
            )}
            {hasFreePacks && (
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                Free Pack
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
            <Wallet size={14} />
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {wallet}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <div className="text-right hidden md:block">
          <p className="text-xs text-slate-400 uppercase font-semibold">Last Interaction</p>
          <p className="text-sm font-medium text-slate-700">
            {lastInteraction ? new Date(lastInteraction).toLocaleString() : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

