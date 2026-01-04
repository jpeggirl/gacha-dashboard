import React from 'react';
import { X } from 'lucide-react';

const TagBadge = ({ tag, onRemove, isRemovable = false, size = 'default' }) => {
  const sizeClasses = {
    small: 'text-xs px-1.5 py-0.5',
    default: 'text-xs px-2 py-1'
  };

  return (
    <span className={`inline-flex items-center gap-1 bg-purple-100 text-purple-700 rounded-full font-semibold uppercase tracking-wide ${sizeClasses[size]} ${isRemovable ? 'pr-1' : ''}`}>
      {tag}
      {isRemovable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag);
          }}
          className="ml-1 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
          title={`Remove ${tag} tag`}
        >
          <X size={12} className="text-purple-700" />
        </button>
      )}
    </span>
  );
};

export default TagBadge;
