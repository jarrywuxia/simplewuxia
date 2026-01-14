// src/gameData.js

export const REALMS = [
  { 
    name: 'Spirit Gathering', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [100, 120, 140, 160, 200] 
  },
  { 
    name: 'Body Refinement', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [300, 350, 400, 450, 600] 
  },
  { 
    name: 'Foundation Establishment', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [1000, 1200, 1400, 1600, 2000] 
  },
  { 
    name: 'Golden Core', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [3000, 3500, 4000, 4500, 6000] 
  },
  { 
    name: 'Nascent Soul', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [10000, 12000, 14000, 16000, 25000] 
  },
  { 
    name: 'Unity', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [50000, 60000, 70000, 80000, 100000] 
  },
  { 
    name: 'Incarnation', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [200000, 250000, 300000, 350000, 500000] 
  },
  { 
    name: 'Divine', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [1000000, 1200000, 1400000, 1600000, 2000000] 
  },
  { 
    name: 'Heavenly Tribulation', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [5000000, 6000000, 7000000, 8000000, 10000000] 
  },
  { 
    name: 'Tribulation Transcendent', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [20000000, 25000000, 30000000, 35000000, 50000000] 
  },
  { 
    name: 'Voidbreak', 
    stages: ['Initial', 'Early', 'Intermediate', 'Late', 'Peak'],
    stageXp: [100000000, 120000000, 140000000, 160000000, 200000000] 
  }
];

// NOTE: This constant is largely deprecated by the stageXp arrays above,
// but kept as a fallback for the "Initial" stage if arrays fail.
export const XP_PER_STAGE = 100;

// Energy config
export const MAX_ENERGY = 100;
export const ENERGY_REGEN_RATE = 5; // minutes per 1 energy
export const DEEP_MEDITATION_COST = 20;

// Stat points per stage advancement
export const STAT_POINTS_PER_STAGE = 5;

// Initial player data structure
export const createNewPlayer = (userId, displayName) => ({
  userId,
  displayName,
  createdAt: Date.now(),
  
  // Realm progression
  realmIndex: 0, // Spirit Gathering
  stageIndex: 0, // Initial
  experience: 0,
  // Start with 100 XP needed (matches Spirit Gathering - Initial)
  experienceNeeded: 100,
  
  // COMBAT & TECHNIQUE DATA
  learnedTechniques: ['iron_fist', 'gather_qi', 'spirit_shield'], // Everyone starts with this
  
  // The 5 Slots (null means empty)
  equippedTechniques: [
    'iron_fist', // Slot 1
    'gather_qi', // Slot 2
    'spirit_shield',        // Slot 3
    null,        // Slot 4
    null         // Slot 5
  ],
  
  // STATS
  // 'qi' is now the direct value for your Max Qi pool
  stats: {
    strength: 5,
    defense: 5,
    qi: 50, // Starts at 50
    maxHp: 100,
  },
  
  currentHp: 100,
  
  // Points to allocate
  unallocatedPoints: 0,
  
  // Resources
  energy: MAX_ENERGY,
  lastEnergyUpdate: Date.now(),
  spiritStones: 0,
  bankedSpiritStones: 0,
  
  // Meditation
  lastMeditationTime: 0,
  currentLocation: 'bamboo-grove', // starting location
  
  // Inventory & Equipment
  inventory: [],
  equipment: {
    weapon: null,
    armor: null,
    helmet: null,
    boots: null,
    ring: null,
    amulet: null,
  },
  artifacts: [],
  
  // Combat
  inSeclusion: false, // safe mode
});