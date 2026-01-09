// src/data/items.js

export const ITEM_TYPES = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  BOOTS: 'boots', // Added Boots category
  CONSUMABLE: 'consumable',
  MANUAL: 'manual',
  MATERIAL: 'material'
};

export const itemRegistry = {
  // --- WEAPONS ---
  'wooden_sword': {
    id: 'wooden_sword',
    name: 'Wooden Sword',
    description: 'A practice sword. (+5 Str)',
    type: ITEM_TYPES.WEAPON,
    slot: 'weapon',
    icon: '/assets/icons/items/weapons/SODA_Icons_ShortSword_19.png',
    stats: { strength: 5 },
    rarity: 'common'
  },
  'iron_saber': {
    id: 'iron_saber',
    name: 'Iron Saber',
    description: 'Standard issue guard weapon. (+15 Str, +2 Qi)',
    type: ITEM_TYPES.WEAPON,
    slot: 'weapon',
    icon: '/assets/icons/items/weapons/SODA_Icon_Weapons_Slingshot.png',
    stats: { strength: 15, qi: 2 },
    rarity: 'uncommon'
  },
  'jade_sword': {
    id: 'jade_sword',
    name: 'Jade Sword',
    description: 'Infused with spirit energy. (+10 Str, +15 Qi)',
    type: ITEM_TYPES.WEAPON,
    slot: 'weapon',
    icon: '/assets/icons/items/weapons/SODA_Icon_Weapons_Sword.png',
    stats: { strength: 10, qi: 15 },
    rarity: 'rare'
  },

  // --- ARMOR ---
  'canvas_robe': {
    id: 'canvas_robe',
    name: 'Canvas Robe',
    description: 'Rough clothing. (+5 Def, +20 HP, +1% Eva)',
    type: ITEM_TYPES.ARMOR,
    slot: 'armor',
    icon: '/assets/icons/items/armor/SODA_Icon_Armor_Leather_Chest.png',
    stats: { defense: 5, maxHp: 20, evasion: 1 },
    rarity: 'common'
  },
  'silk_robe': {
    id: 'silk_robe',
    name: 'Spirit Silk Robe',
    description: 'Shimmers with light. (+10 Def, +5 Qi, +50 HP, +5% Eva)',
    type: ITEM_TYPES.ARMOR,
    slot: 'armor',
    icon: '/assets/icons/items/armor/SODA_Icon_Armor_Cloth_Chest.png',
    stats: { defense: 10, qi: 5, maxHp: 50, evasion: 5 },
    rarity: 'rare'
  },

  // --- BOOTS ---
  'leather_boots': {
    id: 'leather_boots',
    name: 'Leather Boots',
    description: 'Lightweight boots for dodging. (+2 Def, +3% Eva)',
    type: ITEM_TYPES.BOOTS,
    slot: 'boots',
    icon: '/assets/icons/items/armor/SODA_Icon_Armor_Leather_Foot.png', // You might need to find a boot icon
    stats: { defense: 2, evasion: 3 },
    rarity: 'common'
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
  },

  // --- MANUALS ---
  'gale_palm_manual': {
    id: 'gale_palm_manual',
    name: 'Gale Palm Manual',
    description: 'An old manual detailing how to manipulate Qi into wind.',
    type: ITEM_TYPES.MANUAL,
    icon: '/assets/icons/items/consumables/SODA_Icon_Books_Paper_Book1.png',
    rarity: 'rare'
  }
};

export const getItem = (id) => itemRegistry[id] || null;