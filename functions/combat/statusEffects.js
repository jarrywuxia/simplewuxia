// functions/combat/statusEffects.js

/**
 * STATUS EFFECT REGISTRY
 * 
 * Scalability Guide:
 * - type: 'dot' (Damage over Time), 'hot' (Heal over Time), 'stat_mod' (Buff/Debuff), 'control' (Stun/Freeze)
 * - canStack: If true, applying it again adds a separate instance or increments a counter.
 * - canAct: If false, the entity skips their turn (for Stuns).
 * - statMod: Object containing { statName: value } to apply while active.
 */

const STATUS_EFFECTS = {
  // --- DAMAGE OVER TIME (DoT) ---
  'poison': {
    id: 'poison',
    name: 'Poison',
    type: 'dot',
    tickInterval: 3.0, // Damage happens every 3 seconds
    canStack: true,    // You can be poisoned multiple times
    maxStacks: 5
    // Note: Damage value is usually determined by the Technique that applied it
  },
  'burn': {
    id: 'burn',
    name: 'Burn',
    type: 'dot',
    tickInterval: 2.0,
    canStack: false    // Re-applying usually just resets duration
  },

  // --- CROWD CONTROL (CC) ---
  'stun': {
    id: 'stun',
    name: 'Stunned',
    type: 'control',
    canAct: false,     // The crucial flag for the simulator
    canStack: false
  },

  // --- STAT MODIFIERS (Buffs/Debuffs) ---
  'weakness': {
    id: 'weakness',
    name: 'Weakness',
    type: 'stat_mod',
    statMod: { strength: -5 }, // Simulator will look for this object
    canStack: false
  },
  'iron_skin': {
    id: 'iron_skin',
    name: 'Iron Skin',
    type: 'stat_mod',
    statMod: { defense: 10 },
    canStack: false
  },
  'enrage': {
    id: 'enrage',
    name: 'Enrage',
    type: 'stat_mod',
    statMod: { strength: 15, defense: -5 }, // Trade-off buff
    canStack: false
  },
  'regeneration': {
    id: 'regeneration',
    name: 'Regeneration',
    type: 'buff',
    tickInterval: 4.0,
    canStack: false
  },
  'sunder': {
    id: 'sunder',
    name: 'Sunder',
    type: 'stat_mod',
    // Apply -30% to Defense
    statMod: { defense_pct: -30 }, 
    canStack: false
  }
};

module.exports = { STATUS_EFFECTS };