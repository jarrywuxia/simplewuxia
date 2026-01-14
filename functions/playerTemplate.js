// functions/playerTemplate.js

const MAX_ENERGY = 100;

exports.getNewPlayerData = (userId, displayName) => ({
  userId,
  displayName,
  createdAt: Date.now(),
  
  // Realm progression
  realmIndex: 0, 
  stageIndex: 0, 
  experience: 0,
  experienceNeeded: 100,
  
  // COMBAT & TECHNIQUE DATA
  learnedTechniques: ['iron_fist', 'gather_qi', 'spirit_shield'],
  
  equippedTechniques: [
    'iron_fist', 
    'gather_qi', 
    'spirit_shield', 
    null, 
    null
  ],
  
  // STATS - SECURE STARTING VALUES
  stats: {
    strength: 5,
    defense: 5,
    qi: 50, 
    maxHp: 100,
    evasion: 0, // NEW: Starts at 0, cannot be allocated
  },
  
  currentHp: 100,
  unallocatedPoints: 0,
  
  // Resources
  energy: MAX_ENERGY,
  lastEnergyUpdate: Date.now(),
  spiritStones: 0,
  bankedSpiritStones: 0,
  
  // Metadata
  lastMeditationTime: 0,
  currentLocation: 'longtian_village', 
  
  inventory: [],
  equipment: {
    weapon: null,
    armor: null,
    helmet: null,
    boots: null,
    ring: null,
    amulet: null,
  },
  
  inSeclusion: false
});