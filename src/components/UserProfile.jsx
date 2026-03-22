import React, { useState, useRef, useEffect } from 'react';
import { User, Wallet, ExternalLink, Mail, Pencil, Check, X } from 'lucide-react';
import TagBadge from './TagBadge';
import ArchetypeBadge from './ArchetypeBadge';

// Format Twitter username to URL
const getTwitterUrl = (username) => {
  if (!username) return null;
  // Remove @ if present
  const cleanUsername = username.replace(/^@/, '');
  return `https://twitter.com/${cleanUsername}`;
};

const UserProfile = ({ tier, wallet, username, email, lastInteraction, tags = [], archetype, nickname, onNicknameUpdate, dataSource }) => {
  const twitterUrl = getTwitterUrl(username);
  const displayName = username || nickname || 'Anonymous';
  const canEditName = !username && dataSource !== 'mock'; // Only editable when no twitter/username and not mock data

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(nickname || '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === nickname) {
      setEditing(false);
      setEditValue(nickname || '');
      return;
    }
    setSaving(true);
    try {
      if (onNicknameUpdate) {
        await onNicknameUpdate(trimmed);
      }
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditValue(nickname || '');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-200 pb-6 min-w-0">
      <div className="flex items-start sm:items-center gap-4 min-w-0">
        <div className="p-4 rounded-full border-2 shadow-sm bg-white border-slate-100">
          <User size={32} className="text-slate-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {twitterUrl && username ? (
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors group min-w-0"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">
                  @{displayName.replace(/^@/, '')}
                </h2>
                <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ) : editing ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter name..."
                  className="text-2xl sm:text-3xl font-bold text-slate-900 border-b-2 border-indigo-500 outline-none bg-transparent px-1 py-0 min-w-[120px]"
                  disabled={saving}
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Save"
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Cancel"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/name">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">
                  {displayName}
                </h2>
                {canEditName && (
                  <button
                    onClick={() => {
                      setEditValue(nickname || '');
                      setEditing(true);
                    }}
                    className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover/name:opacity-100"
                    title="Edit name"
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>
            )}
            {archetype && archetype.archetype && archetype.archetype !== 'unclassified' && (
              <ArchetypeBadge
                archetype={archetype.archetype}
                status={archetype.status}
                isOverride={archetype.override}
                size="small"
              />
            )}
            {tags && tags.length > 0 && tags.map((tag) => (
              <TagBadge key={tag} tag={tag} size="small" />
            ))}
          </div>
          <div className="flex items-start sm:items-center gap-2 text-slate-500 text-sm mt-1 min-w-0">
            <Wallet size={14} />
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 break-all">
              {wallet}
            </span>
          </div>
          {email && (
            <div className="flex items-center gap-2 text-slate-500 text-sm mt-1 min-w-0">
              <Mail size={14} />
              <span className="text-slate-600 break-all">
                {email}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <div className="text-right hidden md:block">
          <p className="text-xs text-slate-400 uppercase font-semibold">Last Interaction</p>
          <p className="text-sm font-medium text-slate-700">
            {lastInteraction ? new Date(lastInteraction).toLocaleString() : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
