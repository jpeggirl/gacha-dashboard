import React from 'react';
import { AlertCircle } from 'lucide-react';

const MockDataBanner = ({ wallet }) => {
  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500 shadow-sm">
      <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
      <div>
        <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-1">
          Disclaimer: Simulation Mode Active
        </h4>
        <p className="text-sm text-amber-700 leading-relaxed">
          The production API could not be reached (likely due to browser CORS restrictions). 
          The data shown below is <span className="font-bold">generated mock data</span> for 
          demonstration purposes only and does not reflect the actual purchase history for wallet{' '}
          <span className="font-mono text-xs bg-amber-100 px-1 rounded">{wallet}</span>.
        </p>
      </div>
    </div>
  );
};

export default MockDataBanner;

