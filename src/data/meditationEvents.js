// Event system for meditation
// Each event has conditions, rewards, messages, and cooldown

export const meditationEvents = [
  // Common peaceful events
  {
    id: 'peaceful_1',
    message: 'You sense the gentle flow of spiritual energy around you.',
    weight: 30,
    cooldown: 5, // seconds
    rewards: {
      experience: { min: 2, max: 10 }
    },
    requirements: {
      minRealmIndex: 0,
    }
  },
  {
    id: 'peaceful_2',
    message: 'Your breathing synchronizes with the rhythm of nature.',
    weight: 30,
    cooldown: 6,
    rewards: {
      experience: { min: 8, max: 18 },
      spiritStones: { min: 2, max: 5 }
    },
    requirements: {
      minRealmIndex: 0,
    }
  },
  {
    id: 'insight_minor',
    message: 'A minor insight flashes through your mind!',
    weight: 15,
    cooldown: 11, // Longer cooldown for better rewards
    rewards: {
      experience: { min: 20, max: 40 },
      spiritStones: { min: 5, max: 10 }
    },
    requirements: {
      minRealmIndex: 0,
    }
  },
  
  // Rare breakthrough events
  {
    id: 'breakthrough_major',
    message: 'The heavens tremble as you achieve a profound breakthrough!',
    weight: 2,
    cooldown: 30, // Much longer cooldown for rare event
    rewards: {
      experience: { min: 100, max: 200 },
      spiritStones: { min: 50, max: 100 }
    },
    requirements: {
      minRealmIndex: 1,
    }
  },
  
  // Advanced realm events
  {
    id: 'celestial_vision',
    message: 'You glimpse the celestial dao and your understanding deepens.',
    weight: 10,
    cooldown: 20,
    rewards: {
      experience: { min: 50, max: 100 },
      spiritStones: { min: 20, max: 40 }
    },
    requirements: {
      minRealmIndex: 3,
    }
  },
  
  // Empty meditation (no progress)
  {
    id: 'distracted',
    message: 'Your mind wanders and you make little progress.',
    weight: 20,
    cooldown: 5, // Short cooldown for poor result
    rewards: {
      experience: { min: 1, max: 3 },
    },
    requirements: {
      minRealmIndex: 0,
    }
  },
  
  // Future encounter placeholder
  {
    id: 'demon_encounter',
    message: 'An inner demon manifests during your meditation!',
    weight: 5,
    cooldown: 60,
    rewards: {
      experience: { min: 0, max: 0 },
    },
    requirements: {
      minRealmIndex: 2,
    },
    encounterType: 'demon',
    enabled: false
  }
];

// Deep meditation events (no cooldown - uses energy instead)
export const deepMeditationEvents = [
  {
    id: 'deep_cultivation',
    message: 'You dive deep into cultivation, absorbing vast amounts of spiritual energy.',
    weight: 40,
    rewards: {
      experience: { min: 80, max: 150 },
      spiritStones: { min: 20, max: 40 }
    },
    requirements: {
      minRealmIndex: 0,
    }
  },
  {
    id: 'deep_epiphany',
    message: 'An epiphany strikes! Your understanding of the dao grows significantly.',
    weight: 30,
    rewards: {
      experience: { min: 120, max: 200 },
      spiritStones: { min: 30, max: 60 }
    },
    requirements: {
      minRealmIndex: 0,
    }
  },
  {
    id: 'deep_breakthrough',
    message: 'Your concentrated effort yields a breakthrough in your cultivation!',
    weight: 10,
    rewards: {
      experience: { min: 200, max: 350 },
      spiritStones: { min: 80, max: 150 }
    },
    requirements: {
      minRealmIndex: 1,
    }
  }
];

// Helper function to select a random event based on player state
export const selectRandomEvent = (eventList, playerData) => {
  const availableEvents = eventList.filter(event => {
    if (event.enabled === false) return false;
    if (event.requirements.minRealmIndex > playerData.realmIndex) {
      return false;
    }
    return true;
  });
  
  const totalWeight = availableEvents.reduce((sum, event) => sum + event.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const event of availableEvents) {
    random -= event.weight;
    if (random <= 0) {
      return event;
    }
  }
  
  return availableEvents[0];
};

// Calculate actual rewards from event template
export const calculateRewards = (event, playerData) => {
  const rewards = {
    experience: 0,
    spiritStones: 0,
    items: []
  };
  
  const realmMultiplier = playerData.realmIndex + 1;
  
  if (event.rewards.experience) {
    const baseXP = Math.floor(
      Math.random() * (event.rewards.experience.max - event.rewards.experience.min + 1) 
      + event.rewards.experience.min
    );
    rewards.experience = baseXP * realmMultiplier;
  }
  
  if (event.rewards.spiritStones) {
    const baseStones = Math.floor(
      Math.random() * (event.rewards.spiritStones.max - event.rewards.spiritStones.min + 1) 
      + event.rewards.spiritStones.min
    );
    rewards.spiritStones = baseStones * realmMultiplier;
  }
  
  return rewards;
};