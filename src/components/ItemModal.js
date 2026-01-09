import React from 'react';
import { getRarityStyles } from '../utils/rarity';

function ItemModal({ item, onClose, actions }) {
  if (!item) return null;

  // Get styles
  const styles = getRarityStyles(item.rarity);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      <div className={`relative bg-paper border-2 ${styles.border} w-full max-w-sm shadow-2xl animate-fadeIn`}>
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            {/* ICON DISPLAY */}
            <div className={`w-20 h-20 bg-white border-2 ${styles.border} flex items-center justify-center mb-4 shadow-inner overflow-hidden p-2`}>
              {item.icon ? (
                <img 
                  src={item.icon} 
                  alt={item.name} 
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }} 
                />
              ) : (
                <span className="text-4xl opacity-20">?</span>
              )}
            </div>
            
            <h2 className={`text-2xl font-bold font-serif text-ink uppercase tracking-tighter leading-none ${styles.text}`}>
              {item.name}
            </h2>
            <span className={`text-[10px] font-bold text-white px-2 py-0.5 mt-2 uppercase tracking-[0.2em] rounded-sm ${styles.bg.replace('bg-', 'bg-').replace('50', '600')}`}>
              {item.rarity} {item.type}
            </span>
          </div>

          <div className="bg-white/50 border border-border p-4 mb-6">
            <p className="text-sm text-ink-light italic leading-relaxed text-center mb-4">
              "{item.description}"
            </p>
            {item.stats && (
              <div className="border-t border-border pt-3">
                {Object.entries(item.stats).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-xs font-bold uppercase mono text-ink">
                    <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-accent">+{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {/* 
               CRITICAL FIX: 
               Only render actions if they are explicitly passed.
               No fallback logic. If `actions` is null, no extra buttons appear.
            */}
            {actions}

            <button onClick={onClose} className="w-full py-2 text-xs font-bold text-ink-light hover:text-ink transition-colors uppercase tracking-widest">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemModal;