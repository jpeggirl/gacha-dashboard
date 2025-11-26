import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { TRANSACTION_LIMIT } from '../config/constants';

const TransactionTable = ({ transactions, priceToNameMap }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-900">Transaction Logs</h3>
        <div className="flex gap-2">
          <span className="text-xs text-slate-500 self-center">
            Showing last {TRANSACTION_LIMIT} entries
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 w-32">Date</th>
              <th className="px-6 py-4">Pack Name (Inferred)</th>
              <th className="px-6 py-4">TxHash</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <tr key={tx.txHash} className="hover:bg-indigo-50/30 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-700">
                      {new Date(tx.loggedAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(tx.loggedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-indigo-900 bg-indigo-50 px-2 py-1 rounded">
                    {priceToNameMap[tx.packAmount] || 'Unknown Bundle'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <a
                    href={`https://abscan.org/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-indigo-600 hover:text-indigo-800 hover:underline max-w-xs truncate block"
                    title={tx.txHash}
                  >
                    {tx.txHash}
                  </a>
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-700">
                  ${tx.packAmount}
                </td>
                <td className="px-6 py-4 text-right">
                  <a
                    href={`https://abscan.org/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-indigo-600 transition-colors"
                    title="View on AbScan"
                  >
                    <ArrowUpRight size={16} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;

