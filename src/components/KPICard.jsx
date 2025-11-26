import React from 'react';

const KPICard = ({ title, value, subtext, icon: Icon }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {subtext && (
          <p className="text-slate-400 text-xs mt-2">{subtext}</p>
        )}
      </div>
      <div className="p-3 bg-slate-50 rounded-lg text-slate-600">
        <Icon size={20} />
      </div>
    </div>
  );
};

export default KPICard;

