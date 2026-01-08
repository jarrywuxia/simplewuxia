// functions/meditationSystem.js

// --- 1. THE DATA (Your Events) ---

const meditationEvents = [
  {
    id: 'peaceful_1',
    message: 'You sense the gentle flow of spiritual energy around you.',
    weight: 30,
    cooldown: 5,
    rewards: { experience: { min: 2, max: 10 } },
    requirements: { minRealmIndex: 0 }
  },
  {
    id: 'peaceful_2',
    message: 'Your breathing synchronizes with the rhythm of nature.',
    weight: 30,
    cooldown: 6,
    rewards: { 
      experience: { min: 8, max: 18 }, 
      spiritStones: { min: 2, max: 5 },
      // 5% chance to find a low-grade spirit pill
      loot: [{ id: 'spirit_pill_low', chance: 0.05 }] 
    },
    requirements: { minRealmIndex: 0 }
  },
  {
    id: 'insight_minor',
    message: 'A minor insight flashes through your mind!',
    weight: 15,
    cooldown: 5,
    rewards: { 
      experience: { min: 20, max: 40 }, 
      spiritStones: { min: 5, max: 10 },
      // 15% chance for a pill
      loot: [{ id: 'spirit_pill_low', chance: 0.15 }]
    },
    requirements: { minRealmIndex: 0 }
  },
  {
    id: 'breakthrough_major',
    message: 'The heavens tremble as you achieve a profound breakthrough!',
    weight: 2,
    cooldown: 7, 
    rewards: { 
      experience: { min: 100, max: 200 }, 
      spiritStones: { min: 50, max: 100 },
      // High chance for a weapon if you achieve a major breakthrough
      loot: [{ id: 'wooden_sword', chance: 0.5 }]
    },
    requirements: { minRealmIndex: 1 }
  },
  {
    id: 'celestial_vision',
    message: 'You glimpse the celestial dao and your understanding deepens.',
    weight: 10,
    cooldown: 7,
    rewards: { 
      experience: { min: 50, max: 100 }, 
      spiritStones: { min: 20, max: 40 },
      loot: [{ id: 'spirit_pill_low', chance: 0.3 }]
    },
    requirements: { minRealmIndex: 3 }
  },
  {
    id: 'distracted',
    message: 'Your mind wanders and you make little progress.',
    weight: 20,
    cooldown: 5,
    rewards: { experience: { min: 1, max: 3 } },
    requirements: { minRealmIndex: 0 }
  }
];

const deepMeditationEvents = [
  {
    id: 'deep_cultivation',
    message: 'You dive deep into cultivation, absorbing vast amounts of spiritual energy.',
    weight: 40,
    rewards: { 
      experience: { min: 80, max: 150 }, 
      spiritStones: { min: 20, max: 40 },
      loot: [{ id: 'spirit_pill_low', chance: 0.4 }]
    },
    requirements: { minRealmIndex: 0 }
  },
  {
    id: 'deep_epiphany',
    message: 'An epiphany strikes! Your understanding of the dao grows significantly.',
    weight: 30,
    rewards: { 
      experience: { min: 120, max: 200 }, 
      spiritStones: { min: 30, max: 60 },
      loot: [{ id: 'spirit_pill_low', chance: 0.6 }]
    },
    requirements: { minRealmIndex: 0 }
  },
  {
    id: 'deep_breakthrough',
    message: 'Your concentrated effort yields a breakthrough in your cultivation!',
    weight: 10,
    rewards: { 
      experience: { min: 200, max: 350 }, 
      spiritStones: { min: 80, max: 150 },
      // Guaranteed item on deep breakthrough
      loot: [{ id: 'wooden_sword', chance: 1.0 }]
    },
    requirements: { minRealmIndex: 1 }
  }
];

// --- 2. THE LOGIC (Helpers) ---

const selectRandomEvent = (eventList, playerData) => {
  const availableEvents = eventList.filter(event => {
    if (event.enabled === false) return false;
    const playerRealm = playerData.realmIndex || 0;
    if (event.requirements.minRealmIndex > playerRealm) return false;
    return true;
  });
  
  const totalWeight = availableEvents.reduce((sum, event) => sum + event.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const event of availableEvents) {
    random -= event.weight;
    if (random <= 0) return event;
  }
  return availableEvents[0];
};

const calculateRewards = (event, playerData) => {
  const rewards = { experience: 0, spiritStones: 0 };
  const realmMultiplier = (playerData.realmIndex || 0) + 1;
  
  if (event.rewards.experience) {
    const baseXP = Math.floor(Math.random() * (event.rewards.experience.max - event.rewards.experience.min + 1) + event.rewards.experience.min);
    rewards.experience = baseXP * realmMultiplier;
  }
  
  if (event.rewards.spiritStones) {
    const baseStones = Math.floor(Math.random() * (event.rewards.spiritStones.max - event.rewards.spiritStones.min + 1) + event.rewards.spiritStones.min);
    rewards.spiritStones = baseStones * realmMultiplier;
  }
  
  return rewards;
};

const calculateLoot = (event) => {
  if (!event.rewards.loot) return null;
  
  for (const itemEntry of event.rewards.loot) {
    if (Math.random() < itemEntry.chance) {
      return itemEntry.id; 
    }
  }
  return null;
};

// --- NEW: Passive Regeneration Logic ---
exports.calculatePassiveRegen = (playerData) => {
  const MAX_ENERGY = 100;
  const REGEN_RATE_MINUTES = 5; // 1 Energy per 5 Minutes
  
  const now = Date.now();
  // Default to 'now' if it's a new character with no timestamp
  const lastUpdate = playerData.lastEnergyUpdate || now;
  
  const msDiff = now - lastUpdate;
  const minutesPassed = msDiff / (1000 * 60);
  
  // How many full points of energy were gained?
  const energyGained = Math.floor(minutesPassed / REGEN_RATE_MINUTES);
  
  if (energyGained > 0) {
      let newEnergy = (playerData.energy || 0) + energyGained;
      
      // Cap at Max
      if (newEnergy > MAX_ENERGY) {
          newEnergy = MAX_ENERGY;
          // If we hit max, reset the timer to now (so we don't bank "extra" time)
          return { energy: newEnergy, lastEnergyUpdate: now };
      }
      
      // Otherwise, we only advance the timer by the EXACT amount of energy gained.
      // If 9 minutes passed (regaining 1 energy), we keep the 4 extra minutes "banked"
      // for the next update.
      const timeConsumed = energyGained * REGEN_RATE_MINUTES * 60 * 1000;
      
      return {
          energy: newEnergy,
          lastEnergyUpdate: lastUpdate + timeConsumed
      };
  }
  
  // No energy gained yet
  return { 
      energy: playerData.energy || 0, 
      lastEnergyUpdate: lastUpdate 
  };
};

// --- 3. EXPORTS (Public Functions) ---

exports.generateQuickMeditationReward = (playerData) => {
  const event = selectRandomEvent(meditationEvents, playerData);
  const rewards = calculateRewards(event, playerData);
  const lootId = calculateLoot(event);
  
  return {
    ...rewards,
    message: event.message,
    eventId: event.id,
    cooldown: event.cooldown,
    item: lootId 
  };
};

exports.generateDeepMeditationReward = (playerData) => {
  const event = selectRandomEvent(deepMeditationEvents, playerData);
  const rewards = calculateRewards(event, playerData);
  const lootId = calculateLoot(event);
  
  return {
    ...rewards,
    message: event.message,
    eventId: event.id,
    item: lootId 
  };
};