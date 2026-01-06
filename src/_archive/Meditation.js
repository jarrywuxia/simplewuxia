import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  generateQuickMeditationReward, 
  generateDeepMeditationReward,
  checkRealmAdvancement,
  calculateCurrentEnergy 
} from '../meditationSystem';
import { STAT_POINTS_PER_STAGE, DEEP_MEDITATION_COST, XP_PER_STAGE } from '../gameData';

function Meditation({ playerData, onPlayerUpdate }) {
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Update energy on mount and periodically
  useEffect(() => {
    const updateEnergy = async () => {
      const energyData = calculateCurrentEnergy(playerData);
      if (energyData.energy !== playerData.energy) {
        await updateDoc(doc(db, 'players', playerData.userId), energyData);
        onPlayerUpdate();
      }
    };
    
    updateEnergy();
    const interval = setInterval(updateEnergy, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [playerData, onPlayerUpdate]);

  const handleQuickMeditation = async () => {
    if (cooldown > 0 || loading) return;
    
    setLoading(true);
    const rewards = generateQuickMeditationReward(playerData);
    setMessage(rewards.message);
    
    // Calculate new XP and check advancement
    const newExperience = playerData.experience + rewards.experience;
    const newSpiritStones = playerData.spiritStones + rewards.spiritStones;
    
    let updateData = {
      experience: newExperience,
      spiritStones: newSpiritStones,
      lastMeditationTime: Date.now()
    };
    
    // Check for realm advancement
    const advancementCheck = checkRealmAdvancement({ 
      ...playerData, 
      experience: newExperience 
    });
    
    if (advancementCheck.shouldAdvance) {
      updateData.realmIndex = advancementCheck.newRealmIndex;
      updateData.stageIndex = advancementCheck.newStageIndex;
      updateData.experience = newExperience - playerData.experienceNeeded;
      updateData.experienceNeeded = XP_PER_STAGE * (advancementCheck.newRealmIndex + 1);
      updateData.unallocatedPoints = playerData.unallocatedPoints + STAT_POINTS_PER_STAGE;
      
      setMessage(advancementCheck.message + ' You gained ' + STAT_POINTS_PER_STAGE + ' stat points!');
    }
    
    await updateDoc(doc(db, 'players', playerData.userId), updateData);
    await onPlayerUpdate();
    
    setCooldown(10);
    setLoading(false);
  };

  const handleDeepMeditation = async () => {
    if (playerData.energy < DEEP_MEDITATION_COST || loading) return;
    
    setLoading(true);
    const rewards = generateDeepMeditationReward(playerData);
    setMessage(rewards.message);
    
    const newExperience = playerData.experience + rewards.experience;
    const newSpiritStones = playerData.spiritStones + rewards.spiritStones;
    const newEnergy = playerData.energy - DEEP_MEDITATION_COST;
    
    let updateData = {
      experience: newExperience,
      spiritStones: newSpiritStones,
      energy: newEnergy,
      lastEnergyUpdate: Date.now()
    };
    
    const advancementCheck = checkRealmAdvancement({ 
      ...playerData, 
      experience: newExperience 
    });
    
    if (advancementCheck.shouldAdvance) {
      updateData.realmIndex = advancementCheck.newRealmIndex;
      updateData.stageIndex = advancementCheck.newStageIndex;
      updateData.experience = newExperience - playerData.experienceNeeded;
      updateData.experienceNeeded = XP_PER_STAGE * (advancementCheck.newRealmIndex + 1);
      updateData.unallocatedPoints = playerData.unallocatedPoints + STAT_POINTS_PER_STAGE;
      
      setMessage(advancementCheck.message + ' You gained ' + STAT_POINTS_PER_STAGE + ' stat points!');
    }
    
    await updateDoc(doc(db, 'players', playerData.userId), updateData);
    await onPlayerUpdate();
    
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Message Display */}
      {message && (
        <div className="border-l-2 border-accent pl-4 py-2 bg-white">
          <p className="text-ink text-sm italic">{message}</p>
        </div>
      )}
      
      {/* Quick Meditation */}
      <div>
        <button
          onClick={handleQuickMeditation}
          disabled={cooldown > 0 || loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `Quick Meditation (${cooldown}s)` : 'Quick Meditation'}
        </button>
        <p className="text-ink-light text-xs mt-1 mono">
          Small chance for experience and spirit stones
        </p>
      </div>
      
      {/* Deep Meditation */}
      <div>
        <button
          onClick={handleDeepMeditation}
          disabled={playerData.energy < DEEP_MEDITATION_COST || loading}
          className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Deep Meditation ({DEEP_MEDITATION_COST} Energy)
        </button>
        <p className="text-ink-light text-xs mt-1 mono">
          Guaranteed large rewards, costs energy
        </p>
      </div>
    </div>
  );
}

export default Meditation;