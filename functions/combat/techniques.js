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
    isDefault: true
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
    initialCharge: 0
  },

  // --- NEW: STATUS EFFECT TECHNIQUES ---
  
  // 1. DEBUFF EXAMPLE (Poison)
  'poison_needle': {
    id: 'poison_needle',
    name: 'Poison Needle',
    type: TECH_TYPES.OFFENSE,
    cooldown: 7,
    qiCostBase: 8,
    qiCostPct: 0.0,
    power: 40, // Low initial damage
    accuracy: 100,
    scalingStat: 'strength',
    // SCALABLE EFFECT DEFINITION
    effect: { 
      type: 'apply_status', 
      target: 'enemy', // Apply to opponent
      id: 'poison',    // Matches ID in statusEffects.js
      duration: 12,    // Lasts 12 seconds
      value: 5         // 5 Damage per tick
    }
  },

  // 2. BUFF EXAMPLE (Stat Mod)
  'stone_skin': {
    id: 'stone_skin',
    name: 'Stone Skin',
    type: TECH_TYPES.DEFENSE,
    cooldown: 15,
    qiCostBase: 12,
    qiCostPct: 0.05,
    power: 0,
    // SCALABLE EFFECT DEFINITION
    effect: { 
      type: 'apply_status', 
      target: 'self',      // Apply to user
      id: 'iron_skin',     // Matches ID in statusEffects.js
      duration: 10,        // Lasts 10 seconds
      value: 10            // Adds 10 Defense (passed to statMod)
    }
  },

  // --- EXISTING SUPPORT/DEFENSE ---
  'spirit_shield': {
    id: 'spirit_shield',
    name: 'Spirit Shield',
    type: TECH_TYPES.DEFENSE,
    cooldown: 8,
    qiCostBase: 10,
    qiCostPct: 0.05,
    // Legacy effect type 'shield' is still handled by simulator for now,
    // but in the future could be converted to a status effect "Shielded"
    effect: { type: 'shield', value: 15 }, 
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
    type: TECH_TYPES.OFFENSE,
    cooldown: 4,
    qiCostBase: 10,
    qiCostPct: 0.05,
    power: 110,
    accuracy: 95,
    scalingStat: 'qi', 
    initialCharge: 0
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
    initialCharge: 0
  }
};

module.exports = { TECH_TYPES, TECHNIQUE_REGISTRY };