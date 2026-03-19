import React, { useState, useEffect, useRef } from 'react';
import { Users, RotateCcw, Loader2, ChevronDown } from 'lucide-react';
import ArchetypeBadge from './ArchetypeBadge';
import { ARCHETYPES } from '../config/constants';
import { classifyUser } from '../utils/archetypeClassifier';
import { getUserArchetype, updateUserArchetype } from '../services/supabaseService';
import { getCurrentUser } from '../config/users';

const ICP_LABELS = {
  low: { text: 'Low', className: 'text-rose-600 bg-rose-50' },
  maybe: { text: 'Maybe', className: 'text-amber-600 bg-amber-50' },
  high: { text: 'High', className: 'text-teal-600 bg-teal-50' },
  unknown: { text: 'Unknown', className: 'text-slate-500 bg-slate-50' },
};

const ArchetypeSection = ({ walletAddress, transactions, onArchetypeUpdate }) => {
  const [storedArchetype, setStoredArchetype] = useState(null);
  const [computed, setComputed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const currentUser = getCurrentUser();
  const author = currentUser?.name || 'Admin';

  // Compute archetype from transactions
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const result = classifyUser(transactions);
      setComputed(result);
    } else {
      setComputed(null);
    }
  }, [transactions]);

  // Fetch stored archetype and sync
  useEffect(() => {
    if (!walletAddress) return;

    const fetchAndSync = async () => {
      setLoading(true);
      try {
        const { data } = await getUserArchetype(walletAddress);
        setStoredArchetype(data);

        // If no override and computed differs from stored, save computed result
        if (computed && data && !data.archetype_override) {
          if (data.archetype !== computed.archetype || data.archetype_status !== computed.status) {
            await saveArchetype(computed.archetype, computed.status, false, computed.metrics);
          }
        } else if (computed && !data) {
          // No stored data at all — save initial classification
          await saveArchetype(computed.archetype, computed.status, false, computed.metrics);
        }
      } catch (err) {
        console.warn('Error fetching archetype:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndSync();
  }, [walletAddress, computed]);

  const saveArchetype = async (archetype, status, override, metrics) => {
    setSaving(true);
    try {
      const { data } = await updateUserArchetype(
        walletAddress,
        { archetype, status, override, metrics },
        author
      );
      if (data) {
        setStoredArchetype({
          archetype: data.archetype,
          archetype_status: data.archetype_status,
          archetype_override: data.archetype_override,
          archetype_metrics: data.archetype_metrics,
          archetype_updated_at: data.archetype_updated_at,
        });
        if (onArchetypeUpdate) {
          onArchetypeUpdate({
            archetype: data.archetype,
            status: data.archetype_status,
            override: data.archetype_override,
          });
        }
      }
    } catch (err) {
      console.error('Error saving archetype:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleOverride = async (newArchetype) => {
    setShowDropdown(false);
    const status = computed?.status || storedArchetype?.archetype_status || null;
    await saveArchetype(newArchetype, status, true, computed?.metrics || null);
  };

  const handleResetToAuto = async () => {
    if (!computed) return;
    await saveArchetype(computed.archetype, computed.status, false, computed.metrics);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  if (!walletAddress) return null;

  const displayArchetype = storedArchetype?.archetype || computed?.archetype || 'unclassified';
  const displayStatus = storedArchetype?.archetype_status || computed?.status || null;
  const isOverride = storedArchetype?.archetype_override || false;
  const archetypeConfig = ARCHETYPES[displayArchetype] || ARCHETYPES['unclassified'];
  const icpInfo = ICP_LABELS[archetypeConfig.icpLikelihood] || ICP_LABELS.unknown;
  const metrics = computed?.metrics || null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="text-indigo-600" size={20} />
        <h3 className="text-lg font-bold text-slate-900">Customer Archetype</h3>
        {saving && <Loader2 size={16} className="animate-spin text-slate-400" />}
      </div>

      {loading && !computed ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Classifying...</span>
        </div>
      ) : (
        <>
          {/* Archetype Badge + ICP */}
          <div className="flex items-center gap-3 mb-4">
            <ArchetypeBadge
              archetype={displayArchetype}
              status={displayStatus}
              isOverride={isOverride}
            />
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${icpInfo.className}`}>
              ICP: {icpInfo.text}
            </span>
          </div>

          {/* Auto vs Override note */}
          {isOverride && computed && computed.archetype !== displayArchetype && (
            <div className="mb-4 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              Auto-classifier would assign: <span className="font-semibold">{ARCHETYPES[computed.archetype]?.label || computed.archetype}</span>
            </div>
          )}

          {/* Metrics Breakdown */}
          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <MetricItem label="Active Days" value={metrics.activeDays} />
              <MetricItem label="Sessions" value={metrics.sessionClusters?.length || 0} />
              <MetricItem label="Avg Gap" value={metrics.avgGap ? `${metrics.avgGap}d` : '-'} />
              <MetricItem label="Current Gap" value={metrics.daysSinceLastPurchase !== null ? `${metrics.daysSinceLastPurchase}d` : '-'} />
              <MetricItem label="Max Session" value={metrics.maxSessionPurchases} />
              <MetricItem label="Gap Ratio" value={metrics.gapRatio !== null ? `${metrics.gapRatio}x` : '-'} />
            </div>
          )}

          {/* Override Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                Override
                <ChevronDown size={14} />
              </button>

              {showDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                  <div className="p-1">
                    {Object.values(ARCHETYPES).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => handleOverride(a.id)}
                        className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                          displayArchetype === a.id
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isOverride && (
              <button
                onClick={handleResetToAuto}
                disabled={saving || !computed}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <RotateCcw size={14} />
                Reset to auto
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const MetricItem = ({ label, value }) => (
  <div className="bg-slate-50 rounded-lg px-3 py-2">
    <div className="text-xs text-slate-500">{label}</div>
    <div className="text-sm font-semibold text-slate-900">{value}</div>
  </div>
);

export default ArchetypeSection;
