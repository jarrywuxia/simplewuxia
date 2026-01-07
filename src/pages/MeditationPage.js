import React, { useState, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { DEEP_MEDITATION_COST } from '../gameData';
import { getItem } from '../data/items'; 
import FloatingReward from '../components/FloatingReward';
import ItemModal from '../components/ItemModal'; 

const QUICK_MEDITATION_COOLDOWN = 10;

function MeditationPage({ playerData, onPlayerUpdate }) {
  const [cooldown, setCooldown] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageId, setMessageId] = useState(0);
  const [displayedWords, setDisplayedWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRewards, setShowRewards] = useState(null);
  const [recentLoot, setRecentLoot] = useState(null); 
  const [selectedItem, setSelectedItem] = useState(null);

  const hideRewards = useCallback(() => {
    setShowRewards(null);
  }, []);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastMeditation = now - (playerData.lastMeditationTime || 0);
    const duration = playerData.lastCooldownDuration || QUICK_MEDITATION_COOLDOWN;
    const remainingCooldown = duration - Math.floor(timeSinceLastMeditation / 1000);
    
    if (remainingCooldown > 0) {
      setCooldown(remainingCooldown);
    }
  }, [playerData.lastMeditationTime, playerData.lastCooldownDuration]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (!currentMessage) {
      setDisplayedWords([]);
      return;
    }

    const words = currentMessage.split(' ');
    const timeouts = [];

    words.forEach((word, index) => {
      const timer = setTimeout(() => {
        setDisplayedWords(prev => [...prev, word]);
      }, index * 150);
      timeouts.push(timer);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [messageId, currentMessage]);

  const displayMessage = (msg) => {
    setDisplayedWords([]);
    setCurrentMessage(msg);
    setMessageId(prev => prev + 1);
  };

  const handleMeditation = async (type) => {
    if (loading) return;
    if (type === 'quick' && cooldown > 0) return;
    if (type === 'deep' && playerData.energy < DEEP_MEDITATION_COST) return;

    setLoading(true);
    setRecentLoot(null);

    try {
      const meditateFn = httpsCallable(functions, 'meditate');
      const result = await meditateFn({ type });
      const data = result.data;

      setShowRewards({
        experience: data.rewards.experience,
        spiritStones: data.rewards.spiritStones
      });

      if (data.rewards.item) {
        setRecentLoot(getItem(data.rewards.item));
      }

      displayMessage(data.message);

      if (data.cooldown) {
        setCooldown(data.cooldown);
      }

      await onPlayerUpdate();

    } catch (error) {
      console.error("Meditation error:", error);
      if (error.code === 'failed-precondition') {
        displayMessage("You cannot meditate right now.");
      } else {
        displayMessage("A mysterious force disrupts your cultivation... (Server Error)");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {showRewards && (
        <FloatingReward 
          rewards={showRewards} 
          onComplete={hideRewards}
        />
      )}

      <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      <div className="card flex flex-col justify-center items-center text-center p-6 bg-gradient-to-br from-white to-gray-50">
        <p className="text-ink-light italic text-sm mb-3">You meditate...</p>
        <div className="w-full flex items-center justify-center">
          {currentMessage ? (
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

      {recentLoot && (
        <div 
          onClick={() => setSelectedItem(recentLoot)}
          className="bg-amber-50 border-2 border-amber-900 p-3 shadow-lg flex items-center justify-between cursor-pointer animate-fadeIn hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 p-1 border border-amber-900 shadow-inner flex items-center justify-center overflow-hidden">
              {recentLoot.icon ? (
                <img 
                  src={recentLoot.icon} 
                  alt="" 
                  className="w-full h-full object-contain" 
                  style={{ imageRendering: 'pixelated' }} 
                />
              ) : (
                <span className="text-xl">{recentLoot.type === 'weapon' ? '⚔️' : '💊'}</span>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase opacity-70 text-amber-900">Discovery!</p>
              <h4 className="font-bold font-serif leading-none text-amber-950">{recentLoot.name}</h4>
            </div>
          </div>
          <span className="text-[9px] font-bold border border-amber-900/40 px-2 py-1 uppercase tracking-tighter text-amber-900">View Info</span>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <button
            onClick={() => handleMeditation('quick')}
            disabled={cooldown > 0 || loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-lg py-3"
          >
            {cooldown > 0 ? (
              <>
                <img src="/assets/icons/system/S_Ice06.png" alt="" className="w-5 h-5 inline-block mr-2" style={{ imageRendering: 'pixelated' }} /> Quick Meditation ({cooldown}s)
              </>
            ) : (
              <>
                <img src="/assets/icons/system/S_Ice06.png" alt="" className="w-5 h-5 inline-block mr-2" style={{ imageRendering: 'pixelated' }} /> Quick Meditation
              </>
            )}
          </button>
          <p className="text-ink-light text-xs mt-2 mono text-center">
            {cooldown > 0 ? 'Recuperating...' : 'Small chance for experience and spirit stones'}
          </p>
        </div>
        
        <div>
          <button
            onClick={() => handleMeditation('deep')}
            disabled={playerData.energy < DEEP_MEDITATION_COST || loading}
            className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed text-lg py-3"
          >
            <img src="/assets/icons/system/SODA_Icon_System_Misc_Electric.png" alt="" width="32" height="32" className="w-5 h-5 inline-block mr-2" style={{imageRendering:'pixelated'}} /> Deep Meditation ({DEEP_MEDITATION_COST} Energy)
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