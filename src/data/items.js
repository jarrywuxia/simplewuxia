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
    icon: '/assets/icons/items/weapons/SODA_Icon_Weapons_Axe.png',
    stats: { physicalDamage: 5 },
    price: 50,
    rarity: 'common'
  },
  'iron_saber': {
    id: 'iron_saber',
    name: 'Iron Saber',
    description: 'A heavy blade used by sect guards.',
    type: ITEM_TYPES.WEAPON,
    icon: '/assets/icons/items/weapons/SODA_Icon_Weapons_Slingshot.png',
    stats: { physicalDamage: 15, weight: 10 },
    price: 500,
    rarity: 'uncommon'
  },

  // --- CONSUMABLES ---
  'spirit_pill_low': {
    id: 'spirit_pill_low',
    name: 'Low-Grade Spirit Pill',
    description: 'Restores a small amount of Qi energy.',
    type: ITEM_TYPES.CONSUMABLE,
    icon: '/assets/icons/items/consumables/SODA_Icon_Orbs_Orb3.png',
    onUse: { restoreEnergy: 20 },
    price: 100,
    rarity: 'common'
  }
};

export const getItem = (id) => itemRegistry[id] || null;