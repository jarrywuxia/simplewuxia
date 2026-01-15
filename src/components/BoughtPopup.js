import React, { useEffect, useState, useRef } from 'react';

function BoughtPopup({ x, y, text, color = 'text-red-600', icon, onComplete }) {
  const [animationStage, setAnimationStage] = useState('initial');
  const onCompleteRef = useRef(onComplete);

  // Keep the ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const fadeInTimer = setTimeout(() => {
      setAnimationStage('visible');
    }, 50);
    
    const fadeOutTimer = setTimeout(() => {
      setAnimationStage('fading');
    }, 1000);
    
    const completeTimer = setTimeout(() => {
      onCompleteRef.current(); // Use ref instead of prop directly
    }, 1500);
    
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
        return 'opacity-100 -translate-y-8';
      case 'fading':
        return 'opacity-0 -translate-y-12'; 
      default:
        return 'opacity-0 translate-y-0';
    }
  };

  return (
    <div 
      style={{ left: x, top: y }}
      className={`fixed z-[100] transition-all duration-500 ease-out pointer-events-none ${getAnimationClasses()}`}
    >
      <div className={`flex items-center gap-1 font-serif font-bold text-sm shadow-sm ${color}`} style={{ textShadow: '1px 1px 0px white' }}>
        {text}
        {icon && (
          <img 
            src={icon} 
            alt="" 
            width="16" 
            height="16" 
            className="w-4 h-4 inline-block" 
            style={{imageRendering:'pixelated'}} 
          />
        )}
      </div>
    </div>
  );
}

export default BoughtPopup;