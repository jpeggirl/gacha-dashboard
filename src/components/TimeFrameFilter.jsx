import React from 'react';
import { Calendar } from 'lucide-react';

const TIME_FRAMES = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'All Time', value: 'all' }
];

const TimeFrameFilter = ({ selectedTimeFrame, onTimeFrameChange }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
      <div className="flex items-center gap-2 text-slate-600">
        <Calendar size={18} />
        <span className="text-sm font-medium">Time Frame:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {TIME_FRAMES.map((frame) => (
          <button
            key={frame.value}
            onClick={() => onTimeFrameChange(frame.value)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedTimeFrame === frame.value
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-indigo-300'
            }`}
          >
            {frame.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeFrameFilter;

