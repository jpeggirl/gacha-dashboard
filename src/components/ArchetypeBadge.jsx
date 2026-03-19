import React from 'react';
import { Zap, Repeat, Activity } from 'lucide-react';
import { ARCHETYPES } from '../config/constants';

const STATUS_DOTS = {
  active: 'bg-green-500',
  slipping: 'bg-yellow-500',
  churned: 'bg-red-500',
};

const ARCHETYPE_STYLES = {
  'binge-and-gone': {
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    icon: Zap,
  },
  'binge-episodes': {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    icon: Repeat,
  },
  'steady-periodic': {
    bg: 'bg-teal-100',
    text: 'text-teal-700',
    icon: Activity,
  },
  'unclassified': {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    icon: null,
  },
};

const ArchetypeBadge = ({ archetype, status, isOverride = false, size = 'default' }) => {
  const config = ARCHETYPES[archetype] || ARCHETYPES['unclassified'];
  const style = ARCHETYPE_STYLES[archetype] || ARCHETYPE_STYLES['unclassified'];
  const Icon = style.icon;

  const sizeClasses = {
    small: 'text-xs px-2 py-0.5',
    default: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 ${style.bg} ${style.text} rounded-full font-semibold ${sizeClasses[size]}`}>
      {status && (
        <span
          className={`w-2 h-2 rounded-full ${STATUS_DOTS[status] || 'bg-slate-400'}`}
          title={status ? `Status: ${status}` : undefined}
        />
      )}
      {Icon && <Icon size={12} />}
      {config.label}
      {isOverride && (
        <span className="text-[10px] opacity-60 font-normal ml-0.5">manual</span>
      )}
    </span>
  );
};

export default ArchetypeBadge;
