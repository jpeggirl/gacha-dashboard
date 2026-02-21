import React from 'react';
import { Package } from 'lucide-react';

const TIER_COLORS = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

const InventoryGrid = ({ items = [], pagination, onPageChange, loading }) => {
  const page = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? items.length;

  const getPsaId = (item) => (
    item?.details?.psaId ||
    item?.details?.certNumber ||
    item?.gradeId ||
    item?.cardId ||
    'N/A'
  );

  const getLocation = (item) => (
    item?.location ||
    item?.vaultLocation ||
    item?.details?.location ||
    item?.details?.vaultLocation ||
    item?.details?.storageLocation ||
    'N/A'
  );

  if (total === 0 && !loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <Package size={32} className="mx-auto text-slate-300 mb-3" />
        <h3 className="text-lg font-bold text-slate-900 mb-1">No Inventory</h3>
        <p className="text-sm text-slate-500">This user has no NFT inventory items.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Inventory</h3>
          <span className="text-xs text-slate-500">{total} item{total !== 1 ? 's' : ''}</span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1 || loading}
              className="rounded border border-slate-200 px-2 py-1 font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              type="button"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages || loading}
              className="rounded border border-slate-200 px-2 py-1 font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Card</th>
              <th className="px-6 py-4">PSA ID</th>
              <th className="px-6 py-4 text-right">Value</th>
              <th className="px-6 py-4">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => {
              const details = item.details || {};
              const tierColor = TIER_COLORS[item.tier] || TIER_COLORS.common;
              const psaId = getPsaId(item);
              const location = getLocation(item);

              return (
                <tr key={item.uuid || item.nftId || item.id || index} className="hover:bg-indigo-50/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 min-w-[260px]">
                      <div className="w-14 h-20 bg-slate-100 rounded overflow-hidden flex-shrink-0 border border-slate-200">
                        {details.img ? (
                          <img
                            src={details.img}
                            alt={details.name || 'Card'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={18} className="text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate" title={details.name}>
                          {details.name || 'Unknown Card'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {details.grade && (
                            <span className="text-[10px] font-medium bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                              {details.grade}
                            </span>
                          )}
                          <span
                            className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${tierColor}20`,
                              color: tierColor,
                            }}
                          >
                            {item.tier || 'common'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-700">{psaId}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    ${item.value?.toFixed(2) ?? '0.00'}
                  </td>
                  <td className="px-6 py-4 text-slate-700">{location}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryGrid;
