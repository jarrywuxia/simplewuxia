const ENEMIES = {
  'training_dummy': {
    id: 'training_dummy',
    name: 'Wooden Dummy',
    stats: {
      maxHp: 200,
      strength: 0,
      defense: 0,
      qi: 0,
      evasion: 0 // Cannot dodge
    },
    loadout: [], 
    rewards: { exp: 10, stones: 0 }
  },
  'spirit_rat': {
    id: 'spirit_rat',
    name: 'Spirit Rat',
    stats: {
      maxHp: 150,
      strength: 8,
      defense: 2,
      qi: 30,
      evasion: 10 // 10% chance to dodge standard attacks
    },
    loadout: ['iron_fist', 'gather_qi'], 
    rewards: { exp: 25, stones: 5 }
  }
};

module.exports = { ENEMIES };