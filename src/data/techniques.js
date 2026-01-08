export const TECH_TYPES = {
  OFFENSE: 'offense',
  DEFENSE: 'defense',
  SUPPORT: 'support'
};

export const TECHNIQUE_REGISTRY = {
  'struggle': {
    id: 'struggle',
    name: 'Desperate Flail',
    description: 'A weak attack used when completely drained of Qi.',
    type: TECH_TYPES.OFFENSE,
    icon: '/assets/icons/techniques/iron_fist.png', // Placeholder
    cooldown: 10, 
    qiCostBase: 0,
    qiCostPct: 0,
    damageBase: 5,
    damageScale: 0.5,
    isDefault: true
  },
  'iron_fist': {
    id: 'iron_fist',
    name: 'Iron Fist',
    description: 'Channel Qi into your fist for a heavy blow. +10 Damage, -5 Qi, 3s CD',
    type: TECH_TYPES.OFFENSE,
    icon: '/assets/icons/techniques/SODA_Icon_System_Misc_Fist.png', // Placeholder
    cooldown: 3,
    qiCostBase: 5,
    qiCostPct: 0.0,
    damageBase: 10,
    damageScale: 0,
    initialCharge: 0
  },
  'spirit_shield': {
    id: 'spirit_shield',
    name: 'Spirit Shield',
    description: 'Forms a barrier to reduce incoming damage. +15 Shield, -(10+5%) Qi, 8s CD',
    type: TECH_TYPES.DEFENSE,
    icon: '/assets/icons/techniques/SODA_Icon_System_Misc_Shield.png', // Placeholder
    cooldown: 8,
    qiCostBase: 10,
    qiCostPct: 0.05, 
    effect: { type: 'shield', value: 15 },
    initialCharge: 0
  },
  'qi_burst': {
    id: 'qi_burst',
    name: 'Qi Burst',
    description: 'Expels a wave of energy.',
    type: TECH_TYPES.OFFENSE,
    icon: '/assets/icons/techniques/SODA_Icon_System_Misc_Fist.png', // Placeholder
    cooldown: 5,
    qiCostBase: 20,
    qiCostPct: 0.1, 
    damageBase: 50,
    damageScale: 0,
    initialCharge: 0
  },
  'gather_qi': {
    id: 'gather_qi',
    name: 'Breath Control',
    description: 'Regulate breathing to restore a burst of Qi. +25 Qi, 6s CD',
    type: TECH_TYPES.SUPPORT,
    icon: '/assets/icons/techniques/SODA_Icon_System_Misc_SilverStar.png', // Placeholder
    cooldown: 6,
    qiCostBase: 0,
    qiCostPct: 0, 
    effect: { type: 'restore_qi', value: 25 },
    initialCharge: 0
  }
};

export const getTechnique = (id) => TECHNIQUE_REGISTRY[id] || null;