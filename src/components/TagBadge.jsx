import React from 'react';
import { X } from 'lucide-react';

const TagBadge = ({ tag, onRemove, isRemovable = false, size = 'default' }) => {
  const sizeClasses = {
    small: 'text-xs px-1.5 py-0.5',
    default: 'text-xs px-2 py-1'
  };

  // Tags that should be green
  const greenTags = ['collectors', 'onchain TCG platform users', 'outside abstract', 'rip packs'];
  const isGreenTag = greenTags.includes(tag.toLowerCase());
  
  const bgColor = isGreenTag ? 'bg-green-100' : 'bg-purple-100';
  const textColor = isGreenTag ? 'text-green-700' : 'text-purple-700';
  const hoverBgColor = isGreenTag ? 'hover:bg-green-200' : 'hover:bg-purple-200';

  return (
    <span className={`inline-flex items-center gap-1 ${bgColor} ${textColor} rounded-full font-semibold uppercase tracking-wide ${sizeClasses[size]} ${isRemovable ? 'pr-1' : ''}`}>
      {tag}
      {isRemovable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag);
          }}
          className={`ml-1 ${hoverBgColor} rounded-full p-0.5 transition-colors`}
          title={`Remove ${tag} tag`}
        >
          <X size={12} className={textColor} />
        </button>
      )}
    </span>
  );
};

export default TagBadge;
