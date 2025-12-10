import React, { useState, useMemo } from 'react';
import { Gift, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

const FreePacksSection = ({ totalFreePacksRedeemed, freePacks = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate first redemption date
  const firstRedemptionDate = useMemo(() => {
    const datesWithRedemption = freePacks
      .filter(pack => pack.redeemedAt)
      .map(pack => new Date(pack.redeemedAt))
      .sort((a, b) => a - b); // Sort ascending to get earliest first
    
    return datesWithRedemption.length > 0 ? datesWithRedemption[0] : null;
  }, [freePacks]);

  if (!totalFreePacksRedeemed || totalFreePacksRedeemed === 0) {
    return null;
  }

  const hasFreePacksData = freePacks && freePacks.length > 0;
  // Always make it clickable if there are free packs redeemed, even if detailed data isn't available yet
  const isClickable = totalFreePacksRedeemed > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div 
        className={`p-6 ${isClickable ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
        onClick={() => isClickable && setIsExpanded(!isExpanded)}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={(e) => {
          if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
              <Gift size={20} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Free Packs Redeemed</h3>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-slate-500">
                  {totalFreePacksRedeemed} {totalFreePacksRedeemed === 1 ? 'pack' : 'packs'} claimed
                </p>
                {firstRedemptionDate && (
                  <>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Calendar size={12} />
                      <span>
                        First redeemed {firstRedemptionDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          {isClickable && (
            <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium pointer-events-none">
              {isExpanded ? (
                <>
                  <span>Hide Details</span>
                  <ChevronUp size={16} />
                </>
              ) : (
                <>
                  <span>Show Details</span>
                  <ChevronDown size={16} />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 pt-0">
          <div className="pt-4 border-t border-slate-100">
            {hasFreePacksData ? (
              <div className="space-y-3">
                {freePacks.map((pack, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-700">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="font-mono text-sm font-semibold text-slate-900">
                        {pack.code}
                      </div>
                      {pack.redeemedAt ? (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <Calendar size={12} />
                          <span>
                            Redeemed {new Date(pack.redeemedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 mt-0.5">
                          Redemption date not available
                        </div>
                      )}
                    </div>
                  </div>
                  {pack.redeemedAt && (
                    <div className="text-xs text-slate-400">
                      {new Date(pack.redeemedAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              ))}
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-slate-500">
                <p>Detailed free pack information is not available.</p>
                <p className="text-xs text-slate-400 mt-1">
                  {totalFreePacksRedeemed} {totalFreePacksRedeemed === 1 ? 'pack' : 'packs'} {totalFreePacksRedeemed === 1 ? 'was' : 'were'} redeemed, but code details are not available.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FreePacksSection;
