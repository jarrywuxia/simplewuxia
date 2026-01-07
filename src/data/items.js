// src/data/items.js

export const ITEM_TYPES = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  CONSUMABLE: 'consumable',
  MATERIAL: 'material'
};

export const itemRegistry = {
  // --- WEAPONS ---
  'wooden_sword': {
    id: 'wooden_sword',
    name: 'Wooden Sword',
    description: 'A practice sword carved from a sturdy branch.',
    type: ITEM_TYPES.WEAPON,
    slot: 'weapon',
    icon: '/assets/icons/items/weapons/SODA_Icon_Weapons_Axe.png', // Placeholder
    stats: { strength: 5 },
    rarity: 'common'
  },
  'iron_saber': {
    id: 'iron_saber',
    name: 'Iron Saber',
    description: 'A heavy blade used by sect guards.',
    type: ITEM_TYPES.WEAPON,
    slot: 'weapon',
    icon: '/assets/icons/items/weapons/SODA_Icon_Weapons_Slingshot.png', // Placeholder
    stats: { strength: 15, qiPower: 2 },
    rarity: 'uncommon'
  },
  'jade_sword': {
    id: 'jade_sword',
    name: 'Jade Sword',
    description: 'A blade infused with spirit energy.',
    type: ITEM_TYPES.WEAPON,
    slot: 'weapon',
    icon: '/assets/icons/items/weapons/SODA_Icon_Weapons_Sword.png', // Placeholder
    stats: { strength: 10, qiPower: 15 },
    rarity: 'rare'
  },

  // --- ARMOR ---
  'canvas_robe': {
    id: 'canvas_robe',
    name: 'Canvas Robe',
    description: 'Rough clothing worn by outer disciples.',
    type: ITEM_TYPES.ARMOR,
    slot: 'armor',
    icon: '/assets/icons/items/armor/SODA_Icon_Armor_Leather_Chest.png',
    stats: { defense: 5, maxHp: 20 },
    rarity: 'common'
  },
  'silk_robe': {
    id: 'silk_robe',
    name: 'Spirit Silk Robe',
    description: 'Shimmers with a faint internal light.',
    type: ITEM_TYPES.ARMOR,
    slot: 'armor',
    icon: '/assets/icons/items/armor/SODA_Icon_Armor_Cloth_Chest.png',
    stats: { defense: 10, qiPower: 5, maxHp: 50 },
    rarity: 'rare'
  },

  // --- CONSUMABLES ---
  'spirit_pill_low': {
    id: 'spirit_pill_low',
    name: 'Low-Grade Spirit Pill',
    description: 'Restores a small amount of Qi energy.',
    type: ITEM_TYPES.CONSUMABLE,
    icon: '/assets/icons/items/consumables/SODA_Icon_Orbs_Orb3.png',
    onUse: { restoreEnergy: 20 },
    rarity: 'common'
  }
};

export const getItem = (id) => itemRegistry[id] || null;