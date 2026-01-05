import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  generateQuickMeditationReward, 
  generateDeepMeditationReward,
  checkRealmAdvancement,
  calculateCurrentEnergy 
} from '../utils/meditationSystem';
import { STAT_POINTS_PER_STAGE, DEEP_MEDITATION_COST, XP_PER_STAGE } from '../gameData';

function MeditationPage({ playerData, onPlayerUpdate }) {
  const [cooldown, setCooldown] = useState(0);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
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

  const addMessage = (msg) => {
    setMessages(prev => [
      { text: msg, id: Date.now() + Math.random() }, // Add randomness to ensure uniqueness
      ...prev
    ].slice(0, 10));
  };

  const handleQuickMeditation = async () => {
    if (cooldown > 0 || loading) return;
    
    setLoading(true);
    const rewards = generateQuickMeditationReward(playerData);
    addMessage(rewards.message);
    
    const newExperience = playerData.experience + rewards.experience;
    const newSpiritStones = playerData.spiritStones + rewards.spiritStones;
    
    let updateData = {
      experience: newExperience,
      spiritStones: newSpiritStones,
      lastMeditationTime: Date.now()
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
      
      addMessage('🌟 ' + advancementCheck.message + ' You gained ' + STAT_POINTS_PER_STAGE + ' stat points!');
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
    addMessage(rewards.message);
    
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
      
      addMessage('🌟 ' + advancementCheck.message + ' You gained ' + STAT_POINTS_PER_STAGE + ' stat points!');
    }
    
    await updateDoc(doc(db, 'players', playerData.userId), updateData);
    await onPlayerUpdate();
    
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-2xl font-bold text-ink mb-4 font-serif border-b border-border pb-2">
          Meditation Chamber
        </h2>
        
        <p className="text-ink-light italic mb-4 text-sm">
          Focus your mind and absorb the spiritual energy of the world...
        </p>

        {/* Meditation Buttons */}
        <div className="space-y-3">
          <div>
            <button
              onClick={handleQuickMeditation}
              disabled={cooldown > 0 || loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? `Quick Meditation (${cooldown}s)` : 'Quick Meditation'}
            </button>
            <p className="text-ink-light text-xs mt-1 mono">
              10 second cooldown • Small rewards
            </p>
          </div>
          
          <div>
            <button
              onClick={handleDeepMeditation}
              disabled={playerData.energy < DEEP_MEDITATION_COST || loading}
              className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Deep Meditation ({DEEP_MEDITATION_COST} Energy)
            </button>
            <p className="text-ink-light text-xs mt-1 mono">
              Costs {DEEP_MEDITATION_COST} energy • Guaranteed large rewards
            </p>
          </div>
        </div>
      </div>

      {/* Message Log */}
      {messages.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-ink mb-3 font-serif border-b border-border pb-2">
            Cultivation Log
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {messages.map(msg => (
              <div key={msg.id} className="border-l-2 border-accent pl-3 py-1 bg-white text-sm">
                <p className="text-ink mono">{msg.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MeditationPage;