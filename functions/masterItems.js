// functions/masterItems.js

const MASTER_ITEMS = {
  'spirit_pill_low': {
    name: 'Low-Grade Spirit Pill',
    type: 'consumable',
    effect: { type: 'restore_energy', value: 20 }
  },
  'wooden_sword': {
    name: 'Wooden Sword',
    type: 'weapon',
    // Weapons aren't "consumed," they are equipped (we'll do this next)
    effect: { type: 'stat_boost', stat: 'strength', value: 5 }
  }
};

module.exports = MASTER_ITEMS;