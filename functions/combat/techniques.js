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
    cooldown: 10,
    qiCostBase: 0,
    qiCostPct: 0,
    
    // --- NEW STATS ---
    power: 50,          // 50% of Atk
    accuracy: 90,       // 90% Base Accuracy
    scalingStat: 'strength', // Uses Strength as "Atk"
    
    isDefault: true
  },
  'iron_fist': {
    id: 'iron_fist',
    name: 'Iron Fist',
    type: TECH_TYPES.OFFENSE,
    cooldown: 3,
    qiCostBase: 5,
    qiCostPct: 0.0,
    
    // --- NEW STATS ---
    power: 120,         // 120% of Atk
    accuracy: 95,       // 95% Base Accuracy
    scalingStat: 'strength',
    
    initialCharge: 0
  },
  'spirit_shield': {
    id: 'spirit_shield',
    name: 'Spirit Shield',
    type: TECH_TYPES.DEFENSE,
    cooldown: 8,
    qiCostBase: 10,
    qiCostPct: 0.05,
    effect: { type: 'shield', value: 15 }, 
    // Shield doesn't use accuracy/power usually, but we keep the object clean
    initialCharge: 0
  },
  'qi_burst': {
    id: 'qi_burst',
    name: 'Qi Burst',
    type: TECH_TYPES.OFFENSE,
    cooldown: 5,
    qiCostBase: 20,
    qiCostPct: 0.1,
    
    // --- NEW STATS ---
    power: 150,         // 150% of Atk (High damage)
    accuracy: 85,       // 85% Accuracy (Less accurate than punch)
    scalingStat: 'strength',  // Uses Strength as "Atk" power
    
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
  },
  'gale_palm': {
    id: 'gale_palm',
    name: 'Gale Palm',
    type: 'offense',
    cooldown: 4,
    qiCostBase: 10,
    qiCostPct: 0.05,
    power: 110,
    accuracy: 95,
    scalingStat: 'qi', // Scales with Qi instead of Strength!
    initialCharge: 0
  }
};

module.exports = { TECHNIQUE_REGISTRY };