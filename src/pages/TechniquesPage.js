import React, { useState, useMemo } from 'react';
import { getTechnique } from '../data/techniques';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

function TechniquesPage({ playerData, onPlayerUpdate }) {
  const [selectedSlot, setSelectedSlot] = useState(null); // 0-4
  const [loading, setLoading] = useState(false);
  
  // --- SORTING & FILTERING STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, OFFENSE, DEFENSE, SUPPORT
  const [sortBy, setSortBy] = useState('NAME'); // NAME, TYPE, COST

  const equipped = playerData.equippedTechniques || [null, null, null, null, null];
  const maxQi = playerData.stats.qi;

  // --- PROCESSING LOGIC ---
  const processedTechniques = useMemo(() => {
    const learned = playerData.learnedTechniques || [];

    // 1. Map IDs to full objects
    let techs = learned
      .map(id => getTechnique(id))
      .filter(t => t !== null);

    // 2. Filter
    techs = techs.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || t.type.toLowerCase() === filterType.toLowerCase();
      return matchesSearch && matchesType;
    });

    // 3. Sort
    techs.sort((a, b) => {
      switch (sortBy) {
        case 'NAME':
          return a.name.localeCompare(b.name);
        case 'TYPE':
          // Sort by type, then by name
          const typeCompare = a.type.localeCompare(b.type);
          return typeCompare !== 0 ? typeCompare : a.name.localeCompare(b.name);
        case 'COST':
          // Sort by Base Cost
          return a.qiCostBase - b.qiCostBase;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return techs;
  }, [playerData.learnedTechniques, searchTerm, filterType, sortBy]);

  // --- ACTIONS ---
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

  // Helper to count how many times a tech is currently equipped
  const getEquippedCount = (techId) => {
    return equipped.filter(id => id === techId).length;
  };

  return (
    <div className="card min-h-[600px] flex flex-col">
      {/* HEADER */}
      <div className="border-b border-border pb-4 mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-ink font-serif">Martial Arts</h2>
          <p className="text-xs text-ink-light">Configure your combat rotation</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-ink-light">Your Max Qi</p>
          <p className="text-xl font-mono text-accent font-bold">{maxQi}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        
        {/* RIGHT COLUMN: THE ROTATION (1-5) */}
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
                            {/* ICON */}
                            {tech.icon && (
                                <img 
                                    src={tech.icon} 
                                    alt="" 
                                    className="w-5 h-5 object-contain"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                            )}
                        </div>
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
            * Combat executes techniques from 1 to 5. Cooldowns are applied sequentially.
          </p>
        </div>

        {/* LEFT COLUMN: LIBRARY (Learned) */}
        <div className="flex flex-col h-full">
          <h3 className="font-bold text-ink mb-2 uppercase tracking-widest text-xs">
            Technique Library
            {selectedSlot !== null && <span className="text-accent ml-2 animate-pulse">- Select to Equip in Slot {selectedSlot + 1}</span>}
          </h3>

          {/* FILTERS */}
          <div className="bg-stone-50 p-2 border border-border mb-2 grid grid-cols-2 gap-2">
             <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="col-span-2 px-2 py-1 text-xs border border-border focus:outline-none focus:border-accent"
             />
             <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-2 py-1 text-xs border border-border focus:outline-none focus:border-accent"
             >
                <option value="ALL">All Types</option>
                <option value="OFFENSE">Offense</option>
                <option value="DEFENSE">Defense</option>
                <option value="SUPPORT">Support</option>
             </select>
             <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1 text-xs border border-border focus:outline-none focus:border-accent"
             >
                <option value="NAME">Name (A-Z)</option>
                <option value="TYPE">Type</option>
                <option value="COST">Qi Cost</option>
             </select>
          </div>
          
          {/* LIST */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 max-h-[400px]">
            {processedTechniques.length === 0 ? (
                <div className="text-center py-10 opacity-50 text-xs italic">No techniques found.</div>
            ) : (
                processedTechniques.map((tech) => {
                const count = getEquippedCount(tech.id);
                
                return (
                    <button
                    key={tech.id}
                    disabled={selectedSlot === null}
                    onClick={() => handleEquip(tech.id)}
                    className={`
                        w-full text-left p-3 border transition-all relative group
                        ${selectedSlot !== null
                            ? 'hover:border-accent hover:shadow-md cursor-pointer bg-white' 
                            : 'cursor-default bg-stone-50 border-border opacity-80'
                        }
                    `}
                    >
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                            {/* ICON */}
                            <div className="w-6 h-6 border border-border bg-white flex items-center justify-center">
                                {tech.icon ? (
                                    <img 
                                        src={tech.icon} 
                                        alt="" 
                                        className="w-4 h-4 object-contain"
                                        style={{ imageRendering: 'pixelated' }}
                                    />
                                ) : (
                                    <span className="text-[8px] font-bold">{tech.name[0]}</span>
                                )}
                            </div>
                            <span className="font-bold text-sm text-ink">{tech.name}</span>
                        </div>
                        
                        {/* TYPE BADGE */}
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        tech.type === 'offense' ? 'bg-red-50 text-red-800 border-red-200' : 
                        tech.type === 'defense' ? 'bg-blue-50 text-blue-800 border-blue-200' : 
                        'bg-green-50 text-green-800 border-green-200'
                        }`}>
                        {tech.type}
                        </span>
                    </div>

                    <p className="text-xs text-ink-light leading-snug pl-8">{tech.description}</p>
                    
                    {/* COST & COUNT INFO */}
                    <div className="flex justify-between items-center mt-2 pl-8">
                        <span className="text-[10px] mono text-ink-light">
                            Cost: {tech.qiCostBase} + {(tech.qiCostPct * 100)}%
                        </span>
                        
                        {count > 0 && (
                            <span className="text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                                Equipped x{count}
                            </span>
                        )}
                    </div>

                    {/* CLICK INSTRUCTION OVERLAY */}
                    {selectedSlot !== null && (
                        <div className="absolute inset-0 bg-accent/5 border-2 border-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        </div>
                    )}
                    </button>
                );
                })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default TechniquesPage;