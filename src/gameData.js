// src/gameData.js

export const REALMS = [
  { name: 'Spirit Gathering', stages: ['Early', 'Intermediate', 'Late', 'Peak'] },
  { name: 'Body Refinement', stages: ['Early', 'Intermediate', 'Late', 'Peak'] },
  { name: 'Foundation Establishment', stages: ['Early', 'Intermediate', 'Late', 'Peak'] },
  { name: 'Nascent Soul', stages: ['Early', 'Intermediate', 'Late', 'Peak'] },
  { name: 'Unity', stages: ['Early', 'Intermediate', 'Late', 'Peak'] },
  { name: 'Incarnation', stages: ['Early', 'Intermediate', 'Late', 'Peak'] },
  { name: 'Divine', stages: ['Early', 'Intermediate', 'Late', 'Peak'] },
  { name: 'Heavenly Tribulation', stages: ['Early', 'Intermediate', 'Late', 'Peak'] }
];

// XP needed for each stage (scales up)
export const XP_PER_STAGE = 100; // Base XP, increases each realm

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
  stageIndex: 0, // Early
  experience: 0,
  experienceNeeded: XP_PER_STAGE,
  
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