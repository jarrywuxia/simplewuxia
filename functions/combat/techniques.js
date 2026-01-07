const TECH_TYPES = {
  OFFENSE: 'offense',
  DEFENSE: 'defense',
  SUPPORT: 'support'
};

const TECHNIQUE_REGISTRY = {
  'struggle': {
    id: 'struggle',
    name: 'Desperate Flail',
    type: TECH_TYPES.OFFENSE,
    cooldown: 1, 
    qiCostBase: 0,
    qiCostPct: 0,
    damageBase: 5,    // NEW: Flat 5 Damage
    damageScale: 0.5, // + 50% Strength
    isDefault: true
  },
  'iron_fist': {
    id: 'iron_fist',
    name: 'Iron Fist',
    type: TECH_TYPES.OFFENSE,
    cooldown: 3,
    qiCostBase: 5,
    qiCostPct: 0.0,
    damageBase: 10,   // NEW: Base 15
    damageScale: 0,
    initialCharge: 0
  },
  'spirit_shield': {
    id: 'spirit_shield',
    name: 'Spirit Shield',
    type: TECH_TYPES.DEFENSE,
    cooldown: 8,
    qiCostBase: 10,
    qiCostPct: 0.05, 
    effect: { type: 'shield', value: 15 }, // Increased flat shield
    initialCharge: 0
  },
  'qi_burst': {
    id: 'qi_burst',
    name: 'Qi Burst',
    type: TECH_TYPES.OFFENSE,
    cooldown: 5,
    qiCostBase: 20,
    qiCostPct: 0.1,
    damageBase: 50,   // NEW: High Flat Damage
    damageScale: 0,   // 0% Strength Scaling (Pure Magic)
    initialCharge: 0
  },
  'gather_qi': {
    id: 'gather_qi',
    name: 'Breath Control',
    type: TECH_TYPES.SUPPORT,
    cooldown: 6,
    qiCostBase: 0,
    qiCostPct: 0,
    effect: { type: 'restore_qi', value: 25 },
    initialCharge: 0
  }
};

module.exports = { TECHNIQUE_REGISTRY };