import React from 'react';
import { Search, Activity, RefreshCw, LogOut, Home, User } from 'lucide-react';

const Header = ({ searchTerm, onSearchChange, onSearchSubmit, loading, onLogout, currentView, onNavigateHome, currentUser }) => {
  return (
    <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-10 border-b border-slate-700">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-inner">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                GachaAdmin <span className="text-indigo-400">Hub</span>
              </h1>
            </div>
          </div>
          {currentView === 'wallet' && onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
              title="Go to Home"
            >
              <Home size={16} />
              <span>Home</span>
            </button>
          )}
        </div>

        <div className="w-full md:w-auto flex items-center gap-2">
          <form onSubmit={onSearchSubmit} className="flex-1 md:flex-initial flex items-center gap-2">
          <div className="relative flex-1 md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by Wallet, Username, or Email"
              className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-md leading-5 bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:bg-slate-700 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out font-mono"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:transform active:scale-95"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : 'Search'}
            </button>
          </form>
          
          {onLogout && (
            <div className="flex items-center gap-3">
              {currentUser && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 rounded-md">
                  <User size={14} className="text-slate-300" />
                  <span className="text-sm text-slate-200 font-medium">{currentUser.name}</span>
                </div>
              )}
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 shadow-md active:transform active:scale-95"
                title="Logout"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

