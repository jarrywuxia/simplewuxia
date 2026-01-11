// src/data/statusEffects.js

export const STATUS_REGISTRY = {
  // --- DEBUFFS ---
  'poison': {
    id: 'poison',
    name: 'Poison',
    description: 'Taking {val} damage every {tick}s.',
    // Using a green color for UI text
    color: 'text-emerald-600', 
    // Generic "Bio/Poison" icon
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
    description: 'Strength reduced by {val}.',
    color: 'text-gray-500',
    icon: '/assets/icons/system/status/SODA_Icon_Status_ATK_Down.png'
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
    description: 'Defense increased by +{val}.',
    color: 'text-slate-600',
    // Reusing the Armor icon represents "tough skin" well
    icon: '/assets/icons/items/armor/SODA_Icon_Armor_Heavy_Chest.png'
  },
  'focused': {
    id: 'focused',
    name: 'Focused',
    description: 'Accuracy increased by +{val}.',
    color: 'text-blue-600',
    icon: '/assets/icons/system/status/SODA_Icon_Status_AGI_Up.png'
  },
  'sunder': {
    id: 'sunder',
    name: 'Sunder',
    description: 'Defense reduced by {val}%.',
    color: 'text-orange-700',
    icon: '/assets/icons/system/status/SODA_Icon_Status_DEF_Down.png'
  }
};

export const getStatusEffect = (id) => STATUS_REGISTRY[id] || {
  id: 'unknown',
  name: 'Unknown Effect',
  description: '???',
  color: 'text-gray-400',
  icon: null
};