// functions/data/locations.js

const LOCATIONS = {
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
    questIds: ['intro_quest']
  },
  
  'spirit_forest_outskirts': {
    id: 'spirit_forest_outskirts',
    name: 'Spirit Forest Outskirts',
    description: 'The edge of the great forest. Weak spirit beasts roam here.',
    type: 'wild',
    requirements: { minRealm: 0 },
    // UPDATE CONNECTION HERE TOO
    connectedTo: ['longtian_village', 'spirit_forest_depths'],
    enemies: [
      { id: 'spirit_rat', weight: 80 },
      { id: 'wood_wolf', weight: 20 } 
    ],
    shopId: null,
    questIds: []
  },
  
  // ... rest of file (spirit_forest_depths) stays the same
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
    questIds: []
  }
};

module.exports = { LOCATIONS };