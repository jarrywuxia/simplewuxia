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
    stats: { strength: 10, qiPower: 15 },
    value: 500
  },

  // --- ARMOR ---
  'canvas_robe': {
    name: 'Canvas Robe',
    type: 'equipment',
    slot: 'armor',
    stats: { defense: 5, maxHp: 20 },
    value: 50
  },
  'silk_robe': {
    name: 'Spirit Silk Robe',
    type: 'equipment',
    slot: 'armor',
    stats: { defense: 10, qiPower: 5, maxHp: 50 },
    value: 300
  }
};

module.exports = MASTER_ITEMS;