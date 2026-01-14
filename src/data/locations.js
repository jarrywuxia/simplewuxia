// src/data/locations.js

export const LOCATIONS = {
  // 1. RENAME HERE
  'longtian_village': {
    id: 'longtian_village',
    name: 'Longtian Village',
    description: 'A peaceful village surrounded by bamboo. The Qi here is sparse.',
    type: 'safe_zone',
    requirements: { minRealm: 0 },
    connectedTo: ['spirit_forest_outskirts'],
    enemies: [
      { id: 'training_dummy', weight: 100 } 
    ],
    shopId: 'village_merchant', 
    npcId: 'village_elder'
  },
  
  'spirit_forest_outskirts': {
    id: 'spirit_forest_outskirts',
    name: 'Spirit Forest Outskirts',
    description: 'The edge of the great forest. Weak spirit beasts roam here.',
    type: 'wild',
    requirements: { minRealm: 0 },
    // 2. UPDATE CONNECTION HERE
    connectedTo: ['longtian_village', 'spirit_forest_depths'], 
    enemies: [
      { id: 'spirit_rat', weight: 80 },
      { id: 'wood_wolf', weight: 20 }
    ],
    shopId: null,
    npcId: null
  },

  'spirit_forest_depths': {
    id: 'spirit_forest_depths',
    name: 'Spirit Forest Depths',
    description: 'Thick Qi mist covers the ground. Danger lurks in the shadows.',
    type: 'wild',
    requirements: { minRealm: 1 }, 
    connectedTo: ['spirit_forest_outskirts'],
    enemies: [
      { id: 'wood_wolf', weight: 50 },
      { id: 'iron_boar', weight: 50 } 
    ],
    shopId: 'hermit_trader',
    npcId: null
  }
};