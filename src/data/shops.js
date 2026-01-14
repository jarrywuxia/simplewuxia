// src/data/shops.js
export const SHOPS = {
  'village_merchant': {
    id: 'village_merchant',
    name: 'Village Merchant',
    description: 'A humble stall selling basic necessities.',
    inventory: [
      { itemId: 'spirit_pill_low', price: 10 },
      { itemId: 'wooden_sword', price: 50 },
      { itemId: 'canvas_robe', price: 50 },
      { itemId: 'leather_boots', price: 100 } // New item from previous update
    ]
  },
  'hermit_trader': {
    id: 'hermit_trader',
    name: 'Wandering Hermit',
    description: 'He carries rare goods from the depths of the forest.',
    inventory: [
      { itemId: 'iron_saber', price: 250 },
      { itemId: 'gale_palm_manual', price: 500 }
    ]
  }
};