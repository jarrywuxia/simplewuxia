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
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageId, setMessageId] = useState(0); // Unique ID to force re-render
  const [displayedWords, setDisplayedWords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Word-by-word reveal effect
  useEffect(() => {
    if (!currentMessage) {
      setDisplayedWords([]);
      return;
    }

    const words = currentMessage.split(' ');
    // We do not setDisplayedWords([]) here because we want the 
    // new component instance (triggered by key change) to start empty naturally
    
    const timeouts = [];

    words.forEach((word, index) => {
      const timer = setTimeout(() => {
        setDisplayedWords(prev => [...prev, word]);
      }, index * 150); // 150ms delay between each word
      timeouts.push(timer);
    });

    // Cleanup function to stop typing if component unmounts or message changes quickly
    return () => timeouts.forEach(clearTimeout);
  }, [messageId, currentMessage]);

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
    const interval = setInterval(updateEnergy, 60000);
    return () => clearInterval(interval);
  }, [playerData, onPlayerUpdate]);

  const displayMessage = (msg) => {
    setDisplayedWords([]); // Clear words immediately
    setCurrentMessage(msg);
    setMessageId(prev => prev + 1); // Increment ID to force full DOM rebuild
  };

  const handleQuickMeditation = async () => {
    if (cooldown > 0 || loading) return;
    
    setLoading(true);
    const rewards = generateQuickMeditationReward(playerData);
    
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
      const overflow = newExperience - playerData.experienceNeeded;
      updateData.realmIndex = advancementCheck.newRealmIndex;
      updateData.stageIndex = advancementCheck.newStageIndex;
      updateData.experience = overflow;
      updateData.experienceNeeded = XP_PER_STAGE * (advancementCheck.newRealmIndex + 1);
      updateData.unallocatedPoints = playerData.unallocatedPoints + STAT_POINTS_PER_STAGE;
      
      displayMessage('🌟 ' + advancementCheck.message + ' You gained ' + STAT_POINTS_PER_STAGE + ' stat points!');
    } else {
      displayMessage(rewards.message);
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
      const overflow = newExperience - playerData.experienceNeeded;
      updateData.realmIndex = advancementCheck.newRealmIndex;
      updateData.stageIndex = advancementCheck.newStageIndex;
      updateData.experience = overflow;
      updateData.experienceNeeded = XP_PER_STAGE * (advancementCheck.newRealmIndex + 1);
      updateData.unallocatedPoints = playerData.unallocatedPoints + STAT_POINTS_PER_STAGE;
      
      displayMessage('🌟 ' + advancementCheck.message + ' You gained ' + STAT_POINTS_PER_STAGE + ' stat points!');
    } else {
      displayMessage(rewards.message);
    }
    
    await updateDoc(doc(db, 'players', playerData.userId), updateData);
    await onPlayerUpdate();
    
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Message Display Box - SimpleMMO style with word-by-word reveal */}
      <div className="card flex flex-col justify-center items-center text-center p-6 bg-gradient-to-br from-white to-gray-50">
        <p className="text-ink-light italic text-sm mb-3">You meditate...</p>
        <div className="w-full flex items-center justify-center">
          {currentMessage ? (
            // key={messageId} forces this element to be destroyed and recreated every time
            // a new message comes in, ensuring the animation starts fresh.
            <p key={messageId} className="text-ink font-serif text-lg leading-relaxed">
              {currentMessage.split(' ').map((word, index) => (
                <span
                  key={index}
                  className="inline-block mr-1"
                  style={{
                    opacity: displayedWords.length > index ? 1 : 0,
                    transition: 'opacity 0.5s ease-in'
                  }}
                >
                  {word}
                </span>
              ))}
            </p>
          ) : (
            <p className="text-ink-light italic">
              Focus your mind and cultivate your spirit...
            </p>
          )}
        </div>
      </div>

      {/* Meditation Buttons */}
      <div className="space-y-3">
        <div>
          <button
            onClick={handleQuickMeditation}
            disabled={cooldown > 0 || loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-lg py-3"
          >
            {cooldown > 0 ? (
              <>
                🧘 Quick Meditation ({cooldown}s)
              </>
            ) : (
              <>
                🧘 Quick Meditation
              </>
            )}
          </button>
          <p className="text-ink-light text-xs mt-2 mono text-center">
            10 second cooldown • Small rewards
          </p>
        </div>
        
        <div>
          <button
            onClick={handleDeepMeditation}
            disabled={playerData.energy < DEEP_MEDITATION_COST || loading}
            className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed text-lg py-3"
          >
            ⚡ Deep Meditation ({DEEP_MEDITATION_COST} Energy)
          </button>
          <p className="text-ink-light text-xs mt-2 mono text-center">
            Costs {DEEP_MEDITATION_COST} energy • Guaranteed large rewards
          </p>
        </div>
      </div>
    </div>
  );
}

export default MeditationPage;