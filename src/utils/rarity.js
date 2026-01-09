// src/utils/rarity.js

export const RARITY_STYLES = {
  common: {
    text: 'text-slate-600',
    border: 'border-slate-300',
    bg: 'bg-slate-50',
    ring: 'ring-slate-200',
    shadow: 'shadow-slate-100',
    label: 'Common'
  },
  uncommon: {
    text: 'text-emerald-700',
    border: 'border-emerald-400',
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-200',
    shadow: 'shadow-emerald-100',
    label: 'Uncommon'
  },
  rare: {
    text: 'text-sky-700',
    border: 'border-sky-400',
    bg: 'bg-sky-50',
    ring: 'ring-sky-200',
    shadow: 'shadow-sky-100',
    label: 'Rare'
  },
  epic: {
    text: 'text-purple-700',
    border: 'border-purple-400',
    bg: 'bg-purple-50',
    ring: 'ring-purple-200',
    shadow: 'shadow-purple-100',
    label: 'Epic'
  },
  legendary: {
    text: 'text-amber-700',
    border: 'border-amber-500',
    bg: 'bg-amber-50',
    ring: 'ring-amber-200',
    shadow: 'shadow-amber-100',
    label: 'Legendary'
  },
  mythical: {
    text: 'text-rose-700',
    border: 'border-rose-500',
    bg: 'bg-rose-50',
    ring: 'ring-rose-200',
    shadow: 'shadow-rose-100',
    label: 'Mythical'
  }
};

export const getRarityStyles = (rarity) => {
  const key = rarity ? rarity.toLowerCase() : 'common';
  return RARITY_STYLES[key] || RARITY_STYLES['common'];
};