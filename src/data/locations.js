// functions/data/locations.js

/* 
  FUTURE PROOFING:
  - requirements: Used to gate areas (e.g., "Must be Foundation Establishment")
  - connectedTo: The navigation graph
  - enemies: Weighted spawn table for the Explore system
  - shopId: ID of the shop available here (for future)
  - resources: Mining/Gathering tables (for future)
*/

const LOCATIONS = {
  'bamboo_village': {
    id: 'bamboo_village',
    name: 'Bamboo Village',
    description: 'A peaceful village surrounded by emerald bamboo. Ideally suited for new cultivators.',
    type: 'safe_zone', // combat disabled? or just safe
    requirements: { minRealm: 0 },
    connectedTo: ['spirit_forest_outskirts'],
    // Enemies found here (weight = chance to appear)
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
    connectedTo: ['bamboo_village', 'spirit_forest_depths'],
    enemies: [
      { id: 'spirit_rat', weight: 80 },
      { id: 'wood_wolf', weight: 20 } // You'll need to create this enemy later
    ],
    shopId: null,
    questIds: []
  },

  'spirit_forest_depths': {
    id: 'spirit_forest_depths',
    name: 'Spirit Forest Depths',
    description: 'Thick Qi mist covers the ground. Danger lurks in the shadows.',
    type: 'wild',
    requirements: { minRealm: 1 }, // Requires Realm Index 1 (Body Refinement / Next Stage)
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