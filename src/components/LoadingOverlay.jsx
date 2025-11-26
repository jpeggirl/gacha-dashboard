import React from 'react';
import { RefreshCw } from 'lucide-react';

const LoadingOverlay = () => {
  return (
    <div className="absolute inset-0 bg-slate-50/80 z-20 flex items-center justify-center backdrop-blur-sm rounded-lg min-h-[400px]">
      <div className="flex flex-col items-center animate-pulse">
        <RefreshCw className="animate-spin text-indigo-600 mb-2" size={32} />
        <p className="text-sm font-medium text-indigo-800">Querying Block & Database...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;

