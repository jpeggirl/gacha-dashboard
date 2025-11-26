import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { CHART_COLORS } from '../config/constants';

const SpendingMixChart = ({ pieData }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <PieIcon size={18} className="text-slate-400" />
          Spending Mix
        </h3>
      </div>
      <div className="h-64 w-full flex items-center justify-center relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${value}`} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="block text-2xl font-bold text-slate-800">{pieData.length}</span>
            <span className="text-xs text-slate-500 uppercase">Types</span>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2">
        {pieData.map((entry, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="text-slate-600 truncate max-w-[120px]" title={entry.name}>
                {entry.name}
              </span>
            </div>
            <span className="font-medium text-slate-900">
              ${entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpendingMixChart;

