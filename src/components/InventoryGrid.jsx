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

      <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item, index) => {
          const details = item.details || {};
          const tierColor = TIER_COLORS[item.tier] || TIER_COLORS.common;

          return (
            <div
              key={item.id || index}
              className="relative bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Tier color indicator */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: tierColor }}
              />

              {/* Card image */}
              <div className="aspect-[5/7] bg-slate-100 overflow-hidden">
                {details.img ? (
                  <img
                    src={details.img}
                    alt={details.name || 'Card'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={24} className="text-slate-300" />
                  </div>
                )}
              </div>

              {/* Card details */}
              <div className="p-3">
                <p className="text-sm font-semibold text-slate-900 truncate" title={details.name}>
                  {details.name || 'Unknown Card'}
                </p>

                <div className="flex flex-wrap gap-1 mt-1.5">
                  {details.year && (
                    <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {details.year}
                    </span>
                  )}
                  {details.grade && (
                    <span className="text-[10px] font-medium bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                      {details.grade}
                    </span>
                  )}
                  {item.variety && (
                    <span className="text-[10px] font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                      {item.variety}
                    </span>
                  )}
                </div>

                {details.set && (
                  <p className="text-[10px] text-slate-400 mt-1 truncate" title={details.set}>
                    {details.set}
                  </p>
                )}

                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-slate-900">
                    ${item.value?.toFixed(2) ?? '0.00'}
                  </span>
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
          );
        })}
      </div>
    </div>
  );
};

export default InventoryGrid;
