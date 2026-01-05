import { REALMS, XP_PER_STAGE } from '../gameData';

// Random reward generation
export const generateQuickMeditationReward = (playerData) => {
  const rewards = {
    experience: 0,
    spiritStones: 0,
    item: null,
    message: ''
  };

  // Base rewards scale with realm
  const realmMultiplier = playerData.realmIndex + 1;
  
  // 70% chance for XP
  if (Math.random() < 0.7) {
    rewards.experience = Math.floor(Math.random() * 5 + 2) * realmMultiplier;
    rewards.message = `You gain ${rewards.experience} experience from your meditation.`;
  }
  
  // 40% chance for spirit stones
  if (Math.random() < 0.4) {
    rewards.spiritStones = Math.floor(Math.random() * 3 + 1) * realmMultiplier;
    if (rewards.message) rewards.message += ` `;
    rewards.message += `You absorb ${rewards.spiritStones} spirit stones from the ambient qi.`;
  }
  
  // 5% chance for rare event
  if (Math.random() < 0.05) {
    const events = [
      'You experience a breakthrough in understanding!',
      'A celestial phenomenon grants you insight!',
      'You sense a disturbance in the spiritual realm...'
    ];
    rewards.experience += 20 * realmMultiplier;
    rewards.spiritStones += 10 * realmMultiplier;
    rewards.message = events[Math.floor(Math.random() * events.length)];
  }
  
  if (!rewards.message) {
    rewards.message = 'Your meditation is peaceful, but yields little progress.';
  }
  
  return rewards;
};

export const generateDeepMeditationReward = (playerData) => {
  const rewards = {
    experience: 0,
    spiritStones: 0,
    item: null,
    message: ''
  };

  const realmMultiplier = playerData.realmIndex + 1;
  
  // Deep meditation always gives good rewards
  rewards.experience = Math.floor(Math.random() * 20 + 30) * realmMultiplier;
  rewards.spiritStones = Math.floor(Math.random() * 10 + 5) * realmMultiplier;
  
  rewards.message = `Deep meditation grants you ${rewards.experience} experience and ${rewards.spiritStones} spirit stones.`;
  
  // 15% chance for bonus
  if (Math.random() < 0.15) {
    rewards.experience += 50 * realmMultiplier;
    rewards.message += ' You achieve a minor epiphany!';
  }
  
  return rewards;
};

// Check if player should advance to next stage
export const checkRealmAdvancement = (playerData) => {
  if (playerData.experience >= playerData.experienceNeeded) {
    const currentRealm = REALMS[playerData.realmIndex];
    const newStageIndex = playerData.stageIndex + 1;
    
    // Check if advancing within current realm
    if (newStageIndex < currentRealm.stages.length) {
      return {
        shouldAdvance: true,
        newRealmIndex: playerData.realmIndex,
        newStageIndex: newStageIndex,
        message: `You have advanced to ${currentRealm.name} - ${currentRealm.stages[newStageIndex]}!`
      };
    }
    
    // Check if advancing to next realm
    if (playerData.realmIndex + 1 < REALMS.length) {
      return {
        shouldAdvance: true,
        newRealmIndex: playerData.realmIndex + 1,
        newStageIndex: 0,
        message: `Breakthrough! You have ascended to ${REALMS[playerData.realmIndex + 1].name} - Early!`
      };
    }
    
    // Max realm reached
    return {
      shouldAdvance: false,
      message: 'You have reached the peak of mortal cultivation!'
    };
  }
  
  return { shouldAdvance: false };
};

// Calculate energy regen
export const calculateCurrentEnergy = (playerData, maxEnergy = 100) => {
  const now = Date.now();
  const timeSinceLastUpdate = now - playerData.lastEnergyUpdate;
  const minutesPassed = timeSinceLastUpdate / (1000 * 60);
  const energyGained = Math.floor(minutesPassed / 5); // 1 energy per 5 minutes
  
  const newEnergy = Math.min(playerData.energy + energyGained, maxEnergy);
  
  return {
    energy: newEnergy,
    lastEnergyUpdate: now
  };
};