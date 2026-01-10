const MASTER_ITEMS = {
  // --- CONSUMABLES ---
  'spirit_pill_low': {
    name: 'Low-Grade Spirit Pill',
    type: 'consumable',
    effect: { type: 'restore_energy', value: 20 },
    value: 10
  },
  
  // --- WEAPONS ---
  'wooden_sword': {
    name: 'Wooden Sword',
    type: 'equipment',
    slot: 'weapon',
    // Now adds Strength for your new combat formula
    stats: { strength: 5, qiPower: 0 }, 
    value: 50
  },
  'iron_saber': {
    name: 'Iron Saber',
    type: 'equipment',
    slot: 'weapon',
    stats: { strength: 15, qiPower: 2 },
    value: 200
  },
  'jade_sword': {
    name: 'Jade Sword',
    type: 'equipment',
    slot: 'weapon',
    stats: { strength: 10, qi: 15 }, // 'qiPower' renamed to 'qi' to match stat name
    value: 500
  },

  // --- ARMOR ---
  'canvas_robe': {
    name: 'Canvas Robe',
    type: 'equipment',
    slot: 'armor',
    // Adds 1% Evasion
    stats: { defense: 5, maxHp: 20, evasion: 1 }, 
    value: 50
  },
  'silk_robe': {
    name: 'Spirit Silk Robe',
    type: 'equipment',
    slot: 'armor',
    // Adds 5% Evasion
    stats: { defense: 10, qi: 5, maxHp: 50, evasion: 5 }, 
    value: 300
  },
  
  // --- NEW ITEM ---
  'leather_boots': {
    name: 'Leather Boots',
    type: 'equipment',
    slot: 'boots',
    // Pure Evasion item
    stats: { defense: 2, evasion: 3 }, 
    value: 100
  },
  // --- MANUALS / SCROLLS ---
  'gale_palm_manual': {
    name: 'Gale Palm Scroll',
    type: 'manual', // New Type
    // The effect tells the system what to do. 
    // In the future, you could change type to 'gain_xp' for skill books
    effect: { type: 'learn_technique', value: 'gale_palm' }, 
    value: 150
  },
  'poison_needle_manual': {
    name: 'Poison Needle Scroll',
    type: 'manual', // New Type
    // The effect tells the system what to do. 
    // In the future, you could change type to 'gain_xp' for skill books
    effect: { type: 'learn_technique', value: 'poison_needle' }, 
    value: 150
  }
};

module.exports = MASTER_ITEMS;