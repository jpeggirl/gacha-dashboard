import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const spent = payload.find(p => p.dataKey === 'amount')?.value || 0;
    const winnings = payload.find(p => p.dataKey === 'winnings')?.value || 0;
    const net = winnings - spent;
    
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
        <p className="font-semibold text-slate-900 mb-2">{label}</p>
        <p className="text-sm text-indigo-600">Spent: ${spent.toLocaleString()}</p>
        <p className="text-sm text-emerald-600">Winnings: ${winnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p className={`text-sm font-semibold ${net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          Net: {net >= 0 ? '+' : ''}${net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

const ActivityChart = ({ chartData }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `$${value}`} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => value === 'amount' ? 'Spent' : 'Winnings'}
            />
            <Bar 
              dataKey="amount" 
              name="Spent"
              fill="#6366f1" 
              radius={[4, 4, 0, 0]} 
              barSize={30} 
            />
            <Bar 
              dataKey="winnings" 
              name="Winnings"
              fill="#10b981" 
              radius={[4, 4, 0, 0]} 
              barSize={30} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActivityChart;

