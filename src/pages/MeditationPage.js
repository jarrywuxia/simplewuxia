import React, { useState, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { DEEP_MEDITATION_COST } from '../gameData';
import FloatingReward from '../components/FloatingReward';

const QUICK_MEDITATION_COOLDOWN = 10;

function MeditationPage({ playerData, onPlayerUpdate }) {
  const [cooldown, setCooldown] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageId, setMessageId] = useState(0);
  const [displayedWords, setDisplayedWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRewards, setShowRewards] = useState(null);

  // Memoize the callback to prevent infinite re-renders
  const hideRewards = useCallback(() => {
    setShowRewards(null);
  }, []);

  // Calculate initial cooldown based on last meditation time from Server Data
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastMeditation = now - (playerData.lastMeditationTime || 0);
    
    // Use the duration saved by server, or default to 10
    const duration = playerData.lastCooldownDuration || QUICK_MEDITATION_COOLDOWN;
    const remainingCooldown = duration - Math.floor(timeSinceLastMeditation / 1000);
    
    if (remainingCooldown > 0) {
      setCooldown(remainingCooldown);
    }
  }, [playerData.lastMeditationTime, playerData.lastCooldownDuration]);

  // Cooldown timer tick
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

  // --- SERVER INTERACTION ---

  const handleMeditation = async (type) => {
    if (loading) return;
    if (type === 'quick' && cooldown > 0) return;
    if (type === 'deep' && playerData.energy < DEEP_MEDITATION_COST) return;

    setLoading(true);

    try {
      // 1. Call the Cloud Function
      const meditateFn = httpsCallable(functions, 'meditate');
      const result = await meditateFn({ type });
      const data = result.data;

      // 2. Show Rewards (Visual only)
      setShowRewards({
        experience: data.rewards.experience,
        spiritStones: data.rewards.spiritStones
      });

      // 3. Display Server Message
      displayMessage(data.message);

      // 4. Update Cooldown if exists
      if (data.cooldown) {
        setCooldown(data.cooldown);
      }

      // 5. Force update the UI with new player data
      // (The server updated DB, but we trigger a refresh to be sure)
      await onPlayerUpdate();

    } catch (error) {
      console.error("Meditation error:", error);
      // Handle specific error codes if you want
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
      {/* Floating reward popup */}
      {showRewards && (
        <FloatingReward 
          rewards={showRewards} 
          onComplete={hideRewards}
        />
      )}

      {/* Message Display Box */}
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

      {/* Meditation Buttons */}
      <div className="space-y-3">
        <div>
          <button
            onClick={() => handleMeditation('quick')}
            disabled={cooldown > 0 || loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-lg py-3"
          >
            {cooldown > 0 ? (
              <>
                <img src="/assets/icons/system/S_Ice06.png" alt="" className="w-5 h-5 inline-block mr-2" /> Quick Meditation ({cooldown}s)
              </>
            ) : (
              <>
                <img src="/assets/icons/system/S_Ice06.png" alt="" className="w-5 h-5 inline-block mr-2" /> Quick Meditation
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