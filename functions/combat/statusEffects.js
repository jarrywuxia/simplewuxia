// functions/combat/statusEffects.js

const STATUS_EFFECTS = {
  // --- DAMAGE OVER TIME (DoT) ---
  'poison': {
    id: 'poison',
    name: 'Poison',
    type: 'dot',
    tickInterval: 3.0,
    canStack: true,
    maxStacks: 5
    // Note: DoT damage usually relies on the Caster's stats at application time
    // or a flat value passed by the technique.
  },
  'burn': {
    id: 'burn',
    name: 'Burn',
    type: 'dot',
    tickInterval: 2.0,
    canStack: false
  },

  // --- CROWD CONTROL ---
  'stun': {
    id: 'stun',
    name: 'Stunned',
    type: 'control',
    canAct: false,
    canStack: false
  },

  // --- INFINITE SCALING STAT MODIFIERS ---
  
  // 1. Stat Debuff: Reduces Base Strength by %
  'weakness': {
    id: 'weakness',
    name: 'Weakness',
    type: 'stat_mod',
    // Reduces Strength (and thus Attack) by 20%. 
    // This scales infinitely.
    statMod: { strength_pct: -20 }, 
    canStack: false
  },

  // 2. Stat Buff: Increases Base Defense by %
  'iron_skin': {
    id: 'iron_skin',
    name: 'Iron Skin',
    type: 'stat_mod',
    // Increases Defense by 30%.
    // Helps maintain the Mitigation Ratio against strong enemies.
    statMod: { defense_pct: 30 },
    canStack: false
  },

  // 3. Trade-off Buff: More Damage, Less Defense
  'enrage': {
    id: 'enrage',
    name: 'Enrage',
    type: 'stat_mod',
    // Additive Damage Multiplier (+20%)
    // Defense Stat Reduction (-15%)
    statMod: { damage_pct: 20, defense_pct: -15 }, 
    canStack: false
  },
  
  // 4. Pure Stat Debuff
  'sunder': {
    id: 'sunder',
    name: 'Sunder',
    type: 'stat_mod',
    // Reduces Defense by 30%. 
    // Greatly impacts the Mitigation Ratio calculation.
    statMod: { defense_pct: -30 }, 
    canStack: false
  },
  
  'regeneration': {
    id: 'regeneration',
    name: 'Regeneration',
    type: 'hot',
    tickInterval: 4.0,
    canStack: false
  }
};

module.exports = { STATUS_EFFECTS };