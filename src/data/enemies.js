// src/data/enemies.js

export const ENEMIES = [
  { 
    id: 'training_dummy', 
    name: 'Wooden Dummy', 
    combatPower: 10, 
    desc: 'Does not hit back.',
    // ADD THIS
    icon: '/assets/icons/system/SODA_Icon_Orbs_Orb6.png', 
    stats: { 
      maxHp: 200, 
      strength: 0,
      defense: 0,
      qi: 0,
      evasion: 0 
    },
    loadout: [null, null, null, null, null] 
  },
  { 
    id: 'spirit_rat', 
    name: 'Spirit Rat', 
    combatPower: 45, 
    desc: 'A common pest filled with Qi.',
    // ADD THIS
    icon: '/assets/icons/system/S_Ice06.png',
    stats: { 
      maxHp: 150, 
      strength: 8,
      defense: 2,
      qi: 30,
      evasion: 10 
    },
    loadout: ['iron_fist', 'gather_qi', null, null, null]
  }
];

export const getEnemy = (id) => ENEMIES.find(e => e.id === id);