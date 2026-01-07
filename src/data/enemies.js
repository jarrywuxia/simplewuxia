// src/data/enemies.js

export const ENEMIES = [
  { 
    id: 'training_dummy', 
    name: 'Wooden Dummy', 
    combatPower: 10, 
    desc: 'Does not hit back.',
    stats: { 
      maxHp: 200, 
      qi: 0 // Dummy has no Qi
    }
  },
  { 
    id: 'spirit_rat', 
    name: 'Spirit Rat', 
    combatPower: 25, 
    desc: 'A common pest filled with Qi.',
    stats: { 
      maxHp: 150, 
      qi: 30 // Rat has 30 Qi
    }
  }
];

export const getEnemy = (id) => ENEMIES.find(e => e.id === id);