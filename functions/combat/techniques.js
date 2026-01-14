// functions/combat/techniques.js

const TECH_TYPES = {
  OFFENSE: 'offense',
  DEFENSE: 'defense',
  SUPPORT: 'support'
};

const TECHNIQUE_REGISTRY = {
  // --- BASIC MOVES ---
  'struggle': {
    id: 'struggle',
    name: 'Desperate Flail',
    type: TECH_TYPES.OFFENSE,
    cooldown: 10,
    qiCostBase: 0,
    qiCostPct: 0,
    power: 50, // 50% of Atk
    accuracy: 90,
    scalingStat: 'strength',
    isDefault: true,
    effects: []
  },
  'iron_fist': {
    id: 'iron_fist',
    name: 'Iron Fist',
    type: TECH_TYPES.OFFENSE,
    cooldown: 3,
    qiCostBase: 5,
    qiCostPct: 0.0,
    power: 120, // 120% of Atk (1.2 multiplier)
    accuracy: 95,
    scalingStat: 'strength',
    initialCharge: 0,
    effects: []
  },

  // --- STATUS EFFECT TECHNIQUES ---
  'poison_needle': {
    id: 'poison_needle',
    name: 'Poison Needle',
    type: TECH_TYPES.OFFENSE,
    cooldown: 8,
    qiCostBase: 8,
    qiCostPct: 0.0,
    power: 40, // Immediate hit damage (40% of Str)
    accuracy: 100,
    scalingStat: 'strength',
    effects: [
      { 
        type: 'apply_status', 
        target: 'enemy', 
        id: 'poison', 
        duration: 12, 
        // CHANGED: Removed 'value: 5'
        // ADDED: 'power: 30' -> Each tick deals 30% of your Str (Snapshotted)
        power: 30 
      }
    ]
  },

  'stone_skin': {
    id: 'stone_skin',
    name: 'Stone Skin',
    type: TECH_TYPES.DEFENSE,
    cooldown: 15,
    qiCostBase: 12,
    qiCostPct: 0.05,
    power: 0,
    effects: [
      { 
        type: 'apply_status', 
        target: 'self', 
        id: 'iron_skin', 
        duration: 10 
        // No 'value' needed for % buff, it's defined in statusEffects.js
      }
    ]
  },

  'venomous_strike': {
    id: 'venomous_strike',
    name: 'Venomous Strike',
    type: TECH_TYPES.OFFENSE,
    cooldown: 1,
    qiCostBase: 15,
    qiCostPct: 0.0,
    power: 80,
    accuracy: 90,
    scalingStat: 'strength',
    effects: [
      { 
        type: 'apply_status', 
        target: 'enemy', 
        id: 'poison', 
        duration: 9, 
        // Poison scaling: 20% of Str per tick
        power: 20 
      },
      { 
        type: 'apply_status', 
        target: 'enemy', 
        id: 'weakness', 
        duration: 9
      },
      { 
        type: 'apply_status', 
        target: 'enemy', 
        id: 'stun', 
        duration: 2
      }
    ]
  },

  // --- SUPPORT/DEFENSE ---
  'spirit_shield': {
    id: 'spirit_shield',
    name: 'Spirit Shield',
    type: TECH_TYPES.DEFENSE,
    cooldown: 8,
    qiCostBase: 10,
    qiCostPct: 0.05,
    initialCharge: 0,
    effects: [
      { type: 'shield', value: 15 } // Shields might typically stay flat or scale with Max HP in future
    ]
  },
  'gather_qi': {
    id: 'gather_qi',
    name: 'Breath Control',
    type: TECH_TYPES.SUPPORT,
    cooldown: 6,
    qiCostBase: 0,
    qiCostPct: 0,
    initialCharge: 0,
    effects: [
      { type: 'restore_qi', value: 15 }
    ]
  },
  'gale_palm': {
    id: 'gale_palm',
    name: 'Gale Palm',
    type: TECH_TYPES.OFFENSE,
    cooldown: 4,
    qiCostBase: 10,
    qiCostPct: 0.05,
    power: 110,
    accuracy: 95,
    scalingStat: 'qi', // Uses QI instead of Strength
    initialCharge: 0,
    effects: []
  },
  'qi_burst': {
    id: 'qi_burst',
    name: 'Qi Burst',
    type: TECH_TYPES.OFFENSE,
    cooldown: 5,
    qiCostBase: 20,
    qiCostPct: 0.1,
    power: 150,
    accuracy: 85,
    scalingStat: 'strength',
    initialCharge: 0,
    effects: []
  }
};

module.exports = { TECH_TYPES, TECHNIQUE_REGISTRY };