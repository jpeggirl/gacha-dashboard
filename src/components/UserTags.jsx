import React, { useState, useEffect } from 'react';
import { Tag, Plus, Loader2 } from 'lucide-react';
import { getUserTags, addUserTag, removeUserTag, getAllTags } from '../services/supabaseService';
import { DEFAULT_TAGS } from '../config/constants';
import TagBadge from './TagBadge';
import { getCurrentUser } from '../config/users';

const UserTags = ({ walletAddress, onTagsUpdate }) => {
  const [tags, setTags] = useState([]);
  const [availableTags, setAvailableTags] = useState(DEFAULT_TAGS);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [customTag, setCustomTag] = useState('');

  const currentUser = getCurrentUser();
  const author = currentUser?.name || 'Admin';

  useEffect(() => {
    if (walletAddress) {
      loadTags();
      loadAllTags();
    }
  }, [walletAddress]);

  const loadTags = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getUserTags(walletAddress);
      if (fetchError) throw fetchError;
      setTags(data || []);
    } catch (err) {
      console.error('Error loading tags:', err);
      setError('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const loadAllTags = async () => {
    try {
      const { data, error: fetchError } = await getAllTags();
      if (!fetchError && data) {
        // Combine default tags with tags from database, remove duplicates
        const allTags = [...new Set([...DEFAULT_TAGS, ...data])];
        setAvailableTags(allTags.sort());
      }
    } catch (err) {
      console.error('Error loading all tags:', err);
      // Don't show error to user, just use defaults
    }
  };

  const handleAddTag = async (tag) => {
    if (!tag || !tag.trim()) return;
    if (tags.includes(tag.trim())) return; // Already has this tag

    setAdding(true);
    setError(null);
    try {
      const { data, error: addError } = await addUserTag(walletAddress, tag.trim(), author);
      if (addError) throw addError;
      
      // Update local state
      const newTags = [...tags, tag.trim()];
      setTags(newTags);
      setShowDropdown(false);
      setCustomTag('');
      
      // Notify parent component
      if (onTagsUpdate) {
        onTagsUpdate(newTags);
      }
      
      // Refresh available tags
      loadAllTags();
    } catch (err) {
      console.error('Error adding tag:', err);
      setError('Failed to add tag');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveTag = async (tag) => {
    setLoading(true);
    setError(null);
    try {
      const { error: removeError } = await removeUserTag(walletAddress, tag);
      if (removeError) throw removeError;
      
      // Update local state
      const newTags = tags.filter(t => t !== tag);
      setTags(newTags);
      
      // Notify parent component
      if (onTagsUpdate) {
        onTagsUpdate(newTags);
      }
    } catch (err) {
      console.error('Error removing tag:', err);
      setError('Failed to remove tag');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomTagSubmit = (e) => {
    e.preventDefault();
    if (customTag.trim()) {
      handleAddTag(customTag.trim());
    }
  };

  const unassignedTags = availableTags.filter(tag => !tags.includes(tag));

  if (!walletAddress) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="text-indigo-600" size={20} />
        <h3 className="text-lg font-bold text-slate-900">User Tags</h3>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading && tags.length === 0 ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading tags...</span>
        </div>
      ) : (
        <>
          {/* Current Tags */}
          <div className="mb-4">
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <TagBadge
                    key={tag}
                    tag={tag}
                    onRemove={handleRemoveTag}
                    isRemovable={true}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No tags assigned</p>
            )}
          </div>

          {/* Add Tag Section */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={adding}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {adding ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Add Tag</span>
                </>
              )}
            </button>

            {showDropdown && !adding && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                <div className="p-2 max-h-48 overflow-y-auto">
                  {unassignedTags.length > 0 ? (
                    <>
                      <p className="text-xs text-slate-500 px-2 py-1 font-semibold">Suggested Tags</p>
                      {unassignedTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleAddTag(tag)}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 rounded transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 px-2 py-1">All suggested tags assigned</p>
                  )}
                </div>
                <div className="border-t border-slate-200 p-2">
                  <form onSubmit={handleCustomTagSubmit}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        placeholder="Enter custom tag..."
                        className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!customTag.trim()}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default UserTags;
