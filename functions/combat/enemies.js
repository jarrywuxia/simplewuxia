const ENEMIES = {
  'training_dummy': {
    id: 'training_dummy',
    name: 'Wooden Dummy',
    stats: {
      maxHp: 200,
      strength: 0,
      defense: 0,
      qi: 0,
    },
    loadout: [], // Does nothing
    rewards: { exp: 10, stones: 0 }
  },
  'spirit_rat': {
    id: 'spirit_rat',
    name: 'Spirit Rat',
    stats: {
      maxHp: 150,
      strength: 8,
      defense: 2,
      qi: 30, // Low Qi pool
    },
    // It bites, then tries to recover breath, then bites again
    loadout: ['iron_fist', 'gather_qi'], 
    rewards: { exp: 25, stones: 5 }
  }
};

module.exports = { ENEMIES };