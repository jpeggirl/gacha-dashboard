import React from 'react';
import { Search } from 'lucide-react';

const EmptyState = () => {
  return (
    <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
      <div className="bg-slate-100 p-4 rounded-full inline-block mb-4">
        <Search size={32} className="text-slate-400" />
      </div>
      <h3 className="text-lg font-medium text-slate-900">Ready to Analyze</h3>
      <p className="text-slate-500 mt-2">Enter a wallet address above to inspect player behavior.</p>
    </div>
  );
};

export default EmptyState;

