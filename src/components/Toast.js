import React, { useEffect, useState } from 'react';

function Toast({ message, type, onClose }) {
  // Internal state to control the animation classes
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Trigger the "Enter" animation slightly after mounting
    const enterTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    // 2. Trigger the "Exit" animation before the component unmounts
    const exitTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2700); // Start fading out at 2.7s

    // 3. Actually remove the component from DOM after animation finishes
    const closeTimer = setTimeout(() => {
      onClose();
    }, 3000); // Total lifespan 3s

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  const isError = type === 'error';

  return (
    <div 
      className={`
        fixed top-8 left-1/2 z-[200]
        flex flex-col justify-center
        min-w-[300px] max-w-md px-6 py-4
        bg-white shadow-2xl rounded-sm
        border-l-4
        transform transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
        ${isError ? 'border-red-800' : 'border-emerald-700'}
        ${isVisible 
          ? 'opacity-100 translate-y-0 -translate-x-1/2' // Visible State
          : 'opacity-0 -translate-y-8 -translate-x-1/2'  // Hidden State (Slide Up & Fade)
        }
      `}
    >
      <div className="flex flex-col gap-1">
        <p className="text-ink font-medium text-sm leading-snug">
          {message}
        </p>
      </div>
    </div>
  );
}

export default Toast;