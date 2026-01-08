export const TECH_TYPES = {
  OFFENSE: 'offense',
  DEFENSE: 'defense',
  SUPPORT: 'support'
};

export const TECHNIQUE_REGISTRY = {
  'struggle': {
    id: 'struggle',
    name: 'Desperate Flail',
    description: 'A weak attack. 50% Power, 90% Acc.',
    type: TECH_TYPES.OFFENSE,
    icon: '/assets/icons/techniques/iron_fist.png', 
    cooldown: 10, 
    qiCostBase: 0,
    qiCostPct: 0,
    power: 50,
    accuracy: 90,
    isDefault: true
  },
  'iron_fist': {
    id: 'iron_fist',
    name: 'Iron Fist',
    description: 'Channel Qi into your fist. 120% Str Dmg, 95% Acc. (-5 Qi)',
    type: TECH_TYPES.OFFENSE,
    icon: '/assets/icons/techniques/SODA_Icon_System_Misc_Fist.png',
    cooldown: 3,
    qiCostBase: 5,
    qiCostPct: 0.0,
    power: 120,
    accuracy: 95,
    initialCharge: 0
  },
  'spirit_shield': {
    id: 'spirit_shield',
    name: 'Spirit Shield',
    description: 'Forms a barrier. +15 Shield. (-(10+5%) Qi)',
    type: TECH_TYPES.DEFENSE,
    icon: '/assets/icons/techniques/SODA_Icon_System_Misc_Shield.png',
    cooldown: 8,
    qiCostBase: 10,
    qiCostPct: 0.05, 
    effect: { type: 'shield', value: 15 },
    initialCharge: 0
  },
  'qi_burst': {
    id: 'qi_burst',
    name: 'Qi Burst',
    description: 'Expels pure energy. 150% Qi Dmg, 85% Acc. (-20+10% Qi)',
    type: TECH_TYPES.OFFENSE,
    icon: '/assets/icons/techniques/SODA_Icon_System_Misc_Fist.png', 
    cooldown: 5,
    qiCostBase: 20,
    qiCostPct: 0.1, 
    power: 150,
    accuracy: 85,
    initialCharge: 0
  },
  'gather_qi': {
    id: 'gather_qi',
    name: 'Breath Control',
    description: 'Regulate breathing. +25 Qi.',
    type: TECH_TYPES.SUPPORT,
    icon: '/assets/icons/techniques/SODA_Icon_System_Misc_SilverStar.png',
    cooldown: 6,
    qiCostBase: 0,
    qiCostPct: 0, 
    effect: { type: 'restore_qi', value: 25 },
    initialCharge: 0
  }
};

export const getTechnique = (id) => TECHNIQUE_REGISTRY[id] || null;