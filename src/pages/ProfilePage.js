import React from 'react';
import { getItem } from '../data/items';

const STAT_ORDER = ['strength', 'defense', 'qi', 'maxHp'];

function ProfilePage({ playerData, onAllocateStat, onItemClick, actionLoading }) {
  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-ink mb-6 font-serif border-b border-border pb-2">Cultivator Profile</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* ATTRIBUTES SECTION */}
        <div>
          <h3 className="text-[10px] font-bold text-ink-light uppercase tracking-widest mb-4">Attributes</h3>
          <div className="space-y-4">
            {STAT_ORDER.map((key) => {
              const value = playerData.stats[key] || 0;
              return (
                <div key={key} className="flex justify-between items-center border-b border-border/50 pb-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-ink capitalize">{key === 'maxHp' ? 'Vitality' : key}</span>
                    <span className="text-[10px] text-ink-light italic leading-none">
                      {key === 'strength' && 'Increases physical damage'}
                      {key === 'defense' && 'Reduces damage taken'}
                      {key === 'qiPower' && 'Increases skill effectiveness'}
                      {key === 'maxHp' && 'Maximum health points'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-ink mono text-lg">{value}</span>
                    {playerData.unallocatedPoints > 0 && (
                      <button 
                        disabled={actionLoading}
                        onClick={() => onAllocateStat(key)}
                        className="w-8 h-8 bg-accent text-white flex items-center justify-center hover:bg-accent-light transition-colors disabled:opacity-50"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {playerData.unallocatedPoints > 0 && (
            <div className="mt-6 p-3 bg-accent/5 border border-accent/20 text-center animate-pulse">
              <p className="text-accent font-bold text-xs uppercase tracking-widest">
                Available Points: {playerData.unallocatedPoints}
              </p>
            </div>
          )}
        </div>

        {/* EQUIPMENT SECTION */}
        <div>
          <h3 className="text-[10px] font-bold text-ink-light uppercase tracking-widest mb-4">Equipment</h3>
          <div className="grid grid-cols-2 gap-2">
            {['weapon', 'armor', 'helmet', 'boots', 'ring', 'amulet'].map(slot => {
              const equippedItemId = playerData.equipment?.[slot];
              const itemData = equippedItemId ? getItem(equippedItemId) : null;

              return (
                <div 
                  key={slot} 
                  className={`
                    aspect-square border border-dashed border-border flex flex-col items-center justify-center p-2 
                    bg-stone-50/50 relative group cursor-pointer transition-colors
                    ${itemData ? 'border-solid border-accent/30 bg-white' : 'hover:bg-stone-100'}
                  `}
                  onClick={() => itemData && onItemClick(itemData)} 
                >
                  {itemData ? (
                    <>
                      <div className="w-10 h-10 mb-1">
                        <img src={itemData.icon} alt={itemData.name} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                      </div>
                      <span className="text-[9px] font-bold text-ink uppercase tracking-tight truncate w-full text-center">{itemData.name}</span>
                      <span className="text-[8px] text-ink-light uppercase tracking-widest">{slot}</span>
                    </>
                  ) : (
                    <>
                      {/* Empty Slot Placeholder */}
                      <span className="text-[9px] text-ink-light uppercase opacity-40 tracking-widest font-bold">
                        {slot}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;