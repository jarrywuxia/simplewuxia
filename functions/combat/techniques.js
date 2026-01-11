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
    power: 50,
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
    power: 120,
    accuracy: 95,
    scalingStat: 'strength',
    initialCharge: 0,
    effects: []
  },

  // --- STATUS EFFECT TECHNIQUES ---
  
  // 1. Single Debuff
  'poison_needle': {
    id: 'poison_needle',
    name: 'Poison Needle',
    type: TECH_TYPES.OFFENSE,
    cooldown: 7,
    qiCostBase: 8,
    qiCostPct: 0.0,
    power: 40,
    accuracy: 100,
    scalingStat: 'strength',
    effects: [
      { 
        type: 'apply_status', 
        target: 'enemy', 
        id: 'poison', 
        duration: 12, 
        value: 5 
      }
    ]
  },

  // 2. Single Buff
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
        duration: 10, 
        value: 10 
      }
    ]
  },

  // 3. NEW: Multi-Debuff Example
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
        value: 5 
      },
      { 
        type: 'apply_status', 
        target: 'enemy', 
        id: 'weakness', 
        duration: 9, 
        value: 5 
      },
      { 
        type: 'apply_status', 
        target: 'enemy', 
        id: 'stun', 
        duration: 9
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
      { type: 'shield', value: 15 }
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
      { type: 'restore_qi', value: 25 }
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
    scalingStat: 'qi', 
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