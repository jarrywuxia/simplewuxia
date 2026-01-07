import React, { useState } from 'react';
import { getTechnique } from '../data/techniques';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

function TechniquesPage({ playerData, onPlayerUpdate }) {
  const [selectedSlot, setSelectedSlot] = useState(null); // 0-4
  const [loading, setLoading] = useState(false);

  const equipped = playerData.equippedTechniques || [null, null, null, null, null];
  const learned = playerData.learnedTechniques || [];

  // Calculate stats for display
  const maxQi = (playerData.stats.qi);
  
  const handleEquip = async (techId) => {
    if (selectedSlot === null || loading) return;
    
    setLoading(true);
    try {
      const equipFn = httpsCallable(functions, 'equipTechnique');
      await equipFn({ slotIndex: selectedSlot, techniqueId: techId });
      
      await onPlayerUpdate();
      setSelectedSlot(null);
    } catch (err) {
      console.error(err);
      alert("Failed to equip technique");
    } finally {
      setLoading(false);
    }
  };

  const handleUnequip = async (slotIndex) => {
    if (loading) return;
    setLoading(true);
    try {
      const equipFn = httpsCallable(functions, 'equipTechnique');
      await equipFn({ slotIndex: slotIndex, techniqueId: null }); 
      await onPlayerUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="border-b border-border pb-4 mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-ink font-serif">Martial Arts</h2>
          <p className="text-xs text-ink-light">Configure your combat rotation</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-ink-light">Your Max Qi</p>
          <p className="text-xl font-mono text-accent font-bold">{maxQi}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* RIGHT: THE ROTATION (1-5) */}
        <div>
          <h3 className="font-bold text-ink mb-4 uppercase tracking-widest text-xs">Rotation Sequence</h3>
          <div className="space-y-3">
            {equipped.map((techId, index) => {
              const tech = techId ? getTechnique(techId) : null;
              const isSelected = selectedSlot === index;

              return (
                <div 
                  key={index}
                  onClick={() => setSelectedSlot(index)}
                  className={`
                    flex items-center gap-3 p-3 border-2 transition-all cursor-pointer relative
                    ${isSelected ? 'border-accent bg-accent/5' : 'border-border bg-stone-50'}
                    ${!tech ? 'opacity-70 border-dashed' : ''}
                  `}
                >
                  {/* Slot Number */}
                  <div className="font-mono font-bold text-2xl text-ink-light opacity-30 w-8">
                    {index + 1}
                  </div>

                  {/* Tech Info */}
                  <div className="flex-1">
                    {tech ? (
                      <>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-ink text-sm">{tech.name}</h4>
                            {/* ICON: 32x32 Pixelated */}
                            {tech.icon && (
                                <img 
                                    src={tech.icon} 
                                    alt="" 
                                    className="w-5 h-5 object-contain"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                            )}
                        </div>
                        {/*<div className="flex gap-3 text-[10px] mono text-ink-light mt-1">
                          <span>CD: {tech.cooldown}s</span>
                          <span>Cost: {tech.qiCostBase} + {Math.round(tech.qiCostPct * 100)}%</span>
                        </div>*/}
                      </>
                    ) : (
                      <span className="text-xs italic text-ink-light">Empty Slot</span>
                    )}
                  </div>

                  {/* Actions */}
                  {tech && isSelected && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleUnequip(index); }}
                      className="text-[10px] text-red-600 font-bold uppercase hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-ink-light mt-2 italic">
            * Combat executes techniques from 1 to 5. Cooldowns are applied sequentially. If you do not have enough Qi for a technique, it will be skipped with penalty.
          </p>
        </div>

        {/* LEFT: LEARNED TECHNIQUES */}
        <div>
          <h3 className="font-bold text-ink mb-4 uppercase tracking-widest text-xs">
            Learned Techniques {selectedSlot !== null && <span className="text-accent">- Select to Equip in Slot {selectedSlot + 1}</span>}
          </h3>
          
          <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {learned.map((techId) => {
              const tech = getTechnique(techId);
              if (!tech) return null;

              // Check if already equipped elsewhere
              const isEquipped = equipped.includes(techId);

              return (
                <button
                  key={techId}
                  disabled={isEquipped && !selectedSlot} // Can't select if no slot picked
                  onClick={() => handleEquip(techId)}
                  className={`
                    text-left p-3 border border-border transition-all
                    ${isEquipped ? 'bg-gray-100 opacity-50' : 'bg-white hover:border-accent shadow-sm'}
                    ${selectedSlot !== null && !isEquipped ? 'ring-2 ring-accent ring-opacity-50' : ''}
                  `}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink">{tech.name}</span>
                        {/* ICON: 32x32 Pixelated */}
                        {tech.icon && (
                            <img 
                                src={tech.icon} 
                                alt="" 
                                className="w-5 h-5 object-contain"
                                style={{ imageRendering: 'pixelated' }}
                            />
                        )}
                    </div>
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      tech.type === 'offense' ? 'bg-red-100 text-red-800' : 
                      tech.type === 'defense' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {tech.type}
                    </span>
                  </div>
                  <p className="text-xs text-ink-light mt-1 leading-snug">{tech.description}</p>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default TechniquesPage;