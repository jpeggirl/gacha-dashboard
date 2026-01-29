import React from 'react';

const KPICard = ({ title, value, subtext, icon: Icon }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-4 hover:shadow-md transition-shadow min-w-0">
      <div className="min-w-0 flex-1">
        <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider whitespace-normal break-words">
          {title}
        </p>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight break-words">
          {value}
        </h3>
        {subtext && (
          <p className="text-slate-400 text-xs mt-2 leading-tight whitespace-normal break-words">
            {subtext}
          </p>
        )}
      </div>
      <div className="shrink-0 p-3 bg-slate-50 rounded-lg text-slate-600">
        <Icon size={20} />
      </div>
    </div>
  );
};

export default KPICard;

