import React, { useMemo, useState, useEffect } from 'react';
import { ArrowUpRight, Gift } from 'lucide-react';
import { TRANSACTION_LIMIT } from '../config/constants';

const TransactionTable = ({ transactions = [], priceToNameMap, freePacks = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Create a Set of free pack transaction hashes for exact matching
  // freePacks array contains objects with txHash from freePackRedemptions
  const freePackTxHashes = new Set();
  freePacks.forEach(pack => {
    if (pack.txHash) {
      freePackTxHashes.add(pack.txHash.toLowerCase());
    }
  });

  // Get amount from transaction (new API uses 'amount', legacy uses 'packAmount')
  const getTxAmount = (tx) => tx.amount ?? tx.packAmount ?? 0;

  // Get pack name from transaction (new API includes packName directly)
  const getPackName = (tx) => {
    if (tx.packName) return tx.packName;
    const amount = getTxAmount(tx);
    return priceToNameMap[amount] || 'Unknown Pack';
  };

  // Check if a transaction is a free pack
  // Match by txHash (most accurate) or by amount being 0 (fallback)
  const isFreePack = (tx) => {
    // If transaction has explicit flag
    if (tx.isFreePack !== undefined) {
      return tx.isFreePack;
    }
    
    // Primary method: Match by txHash (most accurate)
    if (tx.txHash && freePackTxHashes.has(tx.txHash.toLowerCase())) {
      return true;
    }
    
    // Fallback: If amount is 0, it's likely a free pack
    // (but only if we don't have free pack data, otherwise trust the txHash matching)
    if (freePackTxHashes.size === 0 && getTxAmount(tx) === 0) {
      return true;
    }
    
    return false;
  };

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return transactions;
    }
    return transactions.filter((tx) => (tx.txHash || '').toLowerCase().includes(query));
  }, [transactions, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / TRANSACTION_LIMIT));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * TRANSACTION_LIMIT;
  const endIndex = startIndex + TRANSACTION_LIMIT;
  const pagedTransactions = filteredTransactions.slice(startIndex, endIndex);

  useEffect(() => {
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [safePage, currentPage]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const showingStart = filteredTransactions.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(endIndex, filteredTransactions.length);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-slate-50/50">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Transaction Logs</h3>
          <span className="text-xs text-slate-500">
            Showing {showingStart}-{showingEnd} of {filteredTransactions.length} entries
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by TxHash"
              className="w-56 sm:w-72 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safePage === 1}
              className="rounded border border-slate-200 px-2 py-1 font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safePage === totalPages}
              className="rounded border border-slate-200 px-2 py-1 font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 block md:table">
          <thead className="hidden md:table-header-group bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 w-32">Date</th>
              <th className="px-6 py-4">Pack Name</th>
              <th className="px-6 py-4">TxHash</th>
              <th className="px-6 py-4 text-right">Spent</th>
              <th className="px-6 py-4 text-right">Winnings</th>
              <th className="px-6 py-4 text-right">Net</th>
              <th className="px-6 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group md:divide-y md:divide-slate-100">
            {pagedTransactions.map((tx) => {
              const amount = getTxAmount(tx);
              const winnings = tx.totalWinnings || 0;
              const net = winnings - amount;
              
              return (
                <tr key={tx.txHash} className="group hover:bg-indigo-50/30 transition-colors border-b border-slate-100 md:border-0 block md:table-row">
                  <td className="px-6 py-3 md:py-4 block md:table-cell">
                    <div className="flex items-start justify-between gap-4 md:block">
                      <span className="text-xs font-semibold uppercase text-slate-400 md:hidden">Date</span>
                      <div className="flex flex-col text-right md:text-left">
                        <span className="font-medium text-slate-700">
                          {new Date(tx.loggedAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(tx.loggedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 md:py-4 block md:table-cell">
                    <div className="flex items-start justify-between gap-4 md:block">
                      <span className="text-xs font-semibold uppercase text-slate-400 md:hidden">Pack</span>
                      <div className="flex flex-wrap items-center gap-2 justify-end md:justify-start">
                        <span className="font-medium text-indigo-900 bg-indigo-50 px-2 py-1 rounded">
                          {getPackName(tx)}
                        </span>
                        {tx.collection && (
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded capitalize">
                            {tx.collection}
                          </span>
                        )}
                        {isFreePack(tx) && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-semibold border border-emerald-200">
                            <Gift size={12} />
                            Free Pack
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 md:py-4 block md:table-cell">
                    <div className="flex items-start justify-between gap-4 md:block">
                      <span className="text-xs font-semibold uppercase text-slate-400 md:hidden">TxHash</span>
                      <a
                        href={`https://abscan.org/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-indigo-600 hover:text-indigo-800 hover:underline max-w-xs truncate block text-right md:text-left"
                        title={tx.txHash}
                      >
                        {tx.txHash}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-3 md:py-4 block md:table-cell md:text-right">
                    <div className="flex items-start justify-between gap-4 md:block">
                      <span className="text-xs font-semibold uppercase text-slate-400 md:hidden">Spent</span>
                      {isFreePack(tx) ? (
                        <span className="font-bold text-emerald-600">Free</span>
                      ) : (
                        <span className="font-bold text-slate-700">${amount.toLocaleString()}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 md:py-4 block md:table-cell md:text-right">
                    <div className="flex items-start justify-between gap-4 md:block">
                      <span className="text-xs font-semibold uppercase text-slate-400 md:hidden">Winnings</span>
                      <span className="font-bold text-emerald-600">
                        ${winnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 md:py-4 block md:table-cell md:text-right">
                    <div className="flex items-start justify-between gap-4 md:block">
                      <span className="text-xs font-semibold uppercase text-slate-400 md:hidden">Net</span>
                      <span className={`font-bold ${net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {net >= 0 ? '+' : ''}${net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 md:py-4 block md:table-cell md:text-right">
                    <div className="flex items-start justify-between gap-4 md:block">
                      <span className="text-xs font-semibold uppercase text-slate-400 md:hidden">Link</span>
                      <a
                        href={`https://abscan.org/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-300 hover:text-indigo-600 transition-colors"
                        title="View on AbScan"
                      >
                        <ArrowUpRight size={16} />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
            {pagedTransactions.length === 0 && (
              <tr className="block md:table-row">
                <td className="px-6 py-6 text-center text-slate-500 md:table-cell" colSpan={7}>
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;

