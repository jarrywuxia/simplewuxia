import React, { useEffect, useState, useRef } from 'react';

function FloatingReward({ rewards, onComplete }) {
  const [animationStage, setAnimationStage] = useState('initial');
  const onCompleteRef = useRef(onComplete);
  
  // Calculate a random starting height between ~28% and 38%
  // This runs once when component mounts
  const [topPos] = useState(() => {
    return (38 + Math.random() * 6) + '%';
  });

  // Keep the ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // 1. Start Rising
    const fadeInTimer = setTimeout(() => {
      setAnimationStage('visible');
    }, 50);
    
    // 2. Start Fading Out (wait 2 seconds)
    const fadeOutTimer = setTimeout(() => {
      setAnimationStage('fading');
    }, 2000);
    
    // 3. Complete
    const completeTimer = setTimeout(() => {
      onCompleteRef.current(); // Use ref instead of prop directly
    }, 3000);
    
    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, []); // Empty dependency array - only run once on mount

  const getAnimationClasses = () => {
    switch (animationStage) {
      case 'initial':
        return 'opacity-0 translate-y-0';
      case 'visible':
        // Move up 6 units
        return 'opacity-100 -translate-y-9';
      case 'fading':
        // Fade out but drift slightly higher (-translate-y-8)
        return 'opacity-0 -translate-y-10'; 
      default:
        return 'opacity-0 translate-y-0';
    }
  };

  return (
    <div 
      style={{ top: topPos }}
      className={`fixed left-1/2 transform -translate-x-1/2 z-50 transition-all duration-1000 ease-out pointer-events-none ${getAnimationClasses()}`}
    >
      {/* Reverted to font-bold for better visibility */}
      <div className="flex flex-col items-center gap-1 font-serif font-bold">
        
        {rewards.experience > 0 && (
          // Changed to solid Black
          // Added a small white drop-shadow to ensure the black text is readable if background is dark
          <div className="text-sm text-black" style={{ textShadow: '1px 1px 0px rgba(97, 97, 97, 0.8)' }}>
            +{rewards.experience} XP
          </div>
        )}
        
        {rewards.spiritStones > 0 && (
          // Blue light (sky-400) with a glow effect
          <div className="text-xs text-sky-400" style={{ textShadow: '0px 0px 8px rgba(56, 189, 248, 0.6)' }}>
            +{rewards.spiritStones} <img src="/assets/icons/system/SODA_Icon_Orbs_Orb6.png" alt="" width="32" height="32" className="w-5 h-5 inline-block mr-2" style={{imageRendering:'pixelated'}} />
          </div>
        )}
        
      </div>
    </div>
  );
}

export default FloatingReward;