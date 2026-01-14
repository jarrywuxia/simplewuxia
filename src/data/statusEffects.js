// src/data/statusEffects.js

export const STATUS_REGISTRY = {
  // --- DEBUFFS ---
  'poison': {
    id: 'poison',
    name: 'Poison',
    description: 'Taking {val} damage every {tick}s.',
    color: 'text-emerald-600', 
    icon: '/assets/icons/system/status/SODA_StatusState_Poison.png'
  },
  'burn': {
    id: 'burn',
    name: 'Burn',
    description: 'Taking {val} fire damage every {tick}s.',
    color: 'text-orange-600',
    icon: '/assets/icons/system/status/SODA_StatusState_Poison.png'
  },
  'stun': {
    id: 'stun',
    name: 'Stunned',
    description: 'Cannot act.',
    color: 'text-yellow-600',
    icon: '/assets/icons/system/status/SODA_StatusState_Paralized.png'
  },
  'weakness': {
    id: 'weakness',
    name: 'Weakness',
    // UPDATED: Now indicates percentage
    description: 'Strength reduced by 20%.',
    color: 'text-gray-500',
    icon: '/assets/icons/system/status/SODA_Icon_Status_ATK_Down.png'
  },
  'sunder': {
    id: 'sunder',
    name: 'Sunder',
    // UPDATED: Now indicates percentage
    description: 'Defense reduced by 30%.',
    color: 'text-orange-700',
    icon: '/assets/icons/system/status/SODA_Icon_Status_DEF_Down.png'
  },

  // --- BUFFS ---
  'regeneration': {
    id: 'regeneration',
    name: 'Regeneration',
    description: 'Recovering {val} HP every {tick}s.',
    color: 'text-green-600',
    icon: '/assets/icons/system/status/SODA_StatusState_Heart.png'
  },
  'iron_skin': {
    id: 'iron_skin',
    name: 'Iron Skin',
    // UPDATED: Now indicates percentage
    description: 'Defense increased by 30%.',
    color: 'text-slate-600',
    icon: '/assets/icons/items/armor/SODA_Icon_Armor_Heavy_Chest.png'
  },
  'enrage': {
    id: 'enrage',
    name: 'Enrage',
    // NEW: Matches the backend logic added previously
    description: 'Damage +20%, Defense -15%.',
    color: 'text-red-700',
    icon: '/assets/icons/system/status/SODA_Icon_Status_ATK_Up.png'
  },
  'focused': {
    id: 'focused',
    name: 'Focused',
    description: 'Accuracy increased by +{val}.',
    color: 'text-blue-600',
    icon: '/assets/icons/system/status/SODA_Icon_Status_AGI_Up.png'
  }
};

export const getStatusEffect = (id) => STATUS_REGISTRY[id] || {
  id: 'unknown',
  name: 'Unknown Effect',
  description: '???',
  color: 'text-gray-400',
  icon: null
};