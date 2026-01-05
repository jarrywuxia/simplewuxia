import { REALMS } from '../gameData';
import { meditationEvents, deepMeditationEvents, selectRandomEvent, calculateRewards } from '../data/meditationEvents';

// New event-based reward generation
export const generateQuickMeditationReward = (playerData) => {
  const event = selectRandomEvent(meditationEvents, playerData);
  const rewards = calculateRewards(event, playerData);
  
  return {
    ...rewards,
    message: event.message,
    eventId: event.id,
    cooldown: event.cooldown // Return the cooldown
  };
};

export const generateDeepMeditationReward = (playerData) => {
  const event = selectRandomEvent(deepMeditationEvents, playerData);
  const rewards = calculateRewards(event, playerData);
  
  return {
    ...rewards,
    message: event.message,
    eventId: event.id
  };
};

// Check if player should advance to next stage
export const checkRealmAdvancement = (playerData) => {
  if (playerData.experience >= playerData.experienceNeeded) {
    const currentRealm = REALMS[playerData.realmIndex];
    const newStageIndex = playerData.stageIndex + 1;
    
    if (newStageIndex < currentRealm.stages.length) {
      return {
        shouldAdvance: true,
        newRealmIndex: playerData.realmIndex,
        newStageIndex: newStageIndex,
        message: `You have advanced to ${currentRealm.name} - ${currentRealm.stages[newStageIndex]}!`
      };
    }
    
    if (playerData.realmIndex + 1 < REALMS.length) {
      return {
        shouldAdvance: true,
        newRealmIndex: playerData.realmIndex + 1,
        newStageIndex: 0,
        message: `Breakthrough! You have ascended to ${REALMS[playerData.realmIndex + 1].name} - Early!`
      };
    }
    
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
  const energyGained = Math.floor(minutesPassed / 5);
  
  const newEnergy = Math.min(playerData.energy + energyGained, maxEnergy);
  
  return {
    energy: newEnergy,
    lastEnergyUpdate: now
  };
};