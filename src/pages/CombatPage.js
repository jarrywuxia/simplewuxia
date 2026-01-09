import React, { useState, useRef, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { ENEMIES } from '../data/enemies';
import { TECHNIQUE_REGISTRY } from '../data/techniques'; 

// --- ANIMATION STYLES ---
const shakeKeyframes = `
  @keyframes subtle-shake {
    0% { transform: translate(0, 0); }
    25% { transform: translate(-2px, 1px); }
    50% { transform: translate(2px, -1px); }
    75% { transform: translate(-1px, 0); }
    100% { transform: translate(0, 0); }
  }
  .animate-hurt {
    animation: subtle-shake 0.3s ease-in-out;
    filter: sepia(1) hue-rotate(-50deg) saturate(3);
  }
`;

// --- SUB-COMPONENT: COMBAT ENTITY ---
const CombatEntity = ({ name, type, icon, stats, maxStats, shield, loadout, activeSlot, isReplaying }) => {
  const getPct = (current, max) => max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const displayLoadout = loadout || [null, null, null, null, null];

  // --- SHAKE LOGIC ---
  const [isHurt, setIsHurt] = useState(false);
  const prevHp = useRef(stats.hp);

  useEffect(() => {
    // Only trigger shake if HP dropped AND we are actively replaying a battle.
    if (stats.hp < prevHp.current && isReplaying) {
      setIsHurt(true);
      const timer = setTimeout(() => setIsHurt(false), 300);
      return () => clearTimeout(timer);
    }
    prevHp.current = stats.hp;
  }, [stats.hp, isReplaying]);

  return (
    <div className={`flex flex-col ${type === 'player' ? 'items-end' : 'items-start'} w-1/2 px-2`}>
      <style>{shakeKeyframes}</style>
      
      {/* 1. AVATAR & NAME */}
      <div className={`flex items-center gap-3 mb-2 ${type === 'player' ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
        <div 
          className={`
            w-14 h-14 border-2 border-border shadow-sm p-1 flex-shrink-0 overflow-hidden relative
            bg-transparent transition-all duration-100
            ${isHurt ? 'animate-hurt border-red-400' : 'border-border'}
          `}
        >
           {icon ? (
             <img 
               src={icon} 
               alt={name} 
               className="w-full h-full object-contain" 
               style={{ imageRendering: 'pixelated' }}
               onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='flex'}} 
             />
           ) : null}
           <div 
             className="w-full h-full flex items-center justify-center text-3xl absolute top-0 left-0"
             style={{ display: icon ? 'none' : 'flex' }}
           >
             {type === 'player' ? '🧘' : '👹'}
           </div>
        </div>

        <div>
          <div className="font-bold text-ink font-serif leading-none mb-1 text-sm">{name}</div>
          <div className="text-[10px] uppercase font-bold text-ink-light tracking-widest">
            {type === 'player' ? 'Cultivator' : 'Opponent'}
          </div>
        </div>
      </div>

      {/* 2. TECHNIQUE SEQUENCE */}
      <div className={`flex gap-1 mb-3 w-full ${type === 'player' ? 'justify-end' : 'justify-start'}`}>
        {[0, 1, 2, 3, 4].map((index) => {
          const techId = displayLoadout[index];
          const tech = techId ? TECHNIQUE_REGISTRY[techId] : null;
          const isActive = activeSlot === index;
          
          return (
            <div 
              key={index}
              className={`
                w-8 h-8 border flex items-center justify-center relative transition-all duration-300
                ${isActive && isReplaying 
                  ? 'border-accent ring-2 ring-accent ring-opacity-50 bg-accent/10 scale-110 z-10' 
                  : 'border-border bg-stone-50'
                }
                ${!tech ? 'opacity-30 bg-transparent border-dashed' : 'bg-white'} 
              `}
            >
              {tech ? (
                tech.icon ? (
                  <img src={tech.icon} alt="" className="w-5 h-5 object-contain opacity-90" style={{imageRendering:'pixelated'}} />
                ) : (
                  <span className="text-[10px] font-bold text-ink-light">{tech.name[0]}</span>
                )
              ) : (
                <span className="text-gray-300 text-[10px]">•</span>
              )}
              {isActive && isReplaying && (
                <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
              )}
            </div>
          );
        })}
      </div>

      {/* 3. BARS */}
      <div className="w-full space-y-2">
        {/* HP BAR */}
        <div className="relative h-4 bg-gray-200 w-full rounded-sm overflow-hidden border border-gray-300 shadow-inner">
            <div className={`absolute top-0 left-0 h-full transition-all duration-300 ease-out ${type === 'player' ? 'bg-red-700' : 'bg-red-700'}`}
                style={{ width: `${getPct(stats.hp, maxStats.hp)}%` }} />
            {shield > 0 && (
                <div className="absolute top-0 left-0 h-full border-r border-white bg-cyan-400/50 z-10 transition-all duration-300"
                      style={{ width: `${Math.min(100, (shield / maxStats.hp) * 100)}%` }} />
            )}
            <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white font-mono font-bold drop-shadow-md z-20">
                {Math.max(0, Math.floor(stats.hp))} / {maxStats.hp} HP
                {shield > 0 && <span className="ml-1 text-cyan-100">(+{shield})</span>}
            </span>
        </div>
        {/* QI BAR */}
        <div className="relative h-4 bg-gray-200 w-full rounded-sm overflow-hidden border border-gray-300 shadow-inner">
            <div className={`absolute top-0 left-0 h-full transition-all duration-300 ease-out ${type === 'player' ? 'bg-sky-600' : 'bg-sky-600'}`}
                style={{ width: `${getPct(stats.qi, maxStats.qi)}%` }} />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white font-mono font-bold drop-shadow-md z-20">
                {Math.max(0, Math.floor(stats.qi))} / {maxStats.qi} Qi
            </span>
        </div>
      </div>
    </div>
  );
};

function CombatPage({ playerData }) {
  const [selectedEnemy, setSelectedEnemy] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [battleResult, setBattleResult] = useState(null); 
  const [speedMultiplier, setSpeedMultiplier] = useState(1); 
  const speedRef = useRef(1);
  const logContainerRef = useRef(null);

  const [replayState, setReplayState] = useState({
    playerHp: 100, playerMaxHp: 100, playerQi: 50, playerMaxQi: 50, playerShield: 0, playerSlot: 0, 
    enemyHp: 100, enemyMaxHp: 100, enemyQi: 0, enemyMaxQi: 0, enemyShield: 0, enemySlot: 0   
  });

  useEffect(() => {
    if (playerData) {
        setReplayState(prev => ({
            ...prev,
            playerHp: playerData.stats.maxHp,
            playerMaxHp: playerData.stats.maxHp,
            playerQi: playerData.stats.qi,
            playerMaxQi: playerData.stats.qi
        }));
    }
  }, [playerData]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [combatLog]);

  const handleSpeedChange = (speed) => {
      setSpeedMultiplier(speed);
      speedRef.current = speed;
  };

  useEffect(() => {
    if (selectedEnemy) {
        setCombatLog([]);
        setBattleResult(null);
        setReplayState({
            playerHp: playerData?.stats?.maxHp || 100,
            playerMaxHp: playerData?.stats?.maxHp || 100,
            playerQi: playerData?.stats?.qi || 50,
            playerMaxQi: playerData?.stats?.qi || 50,
            playerShield: 0,
            playerSlot: 0,
            enemyHp: selectedEnemy.stats.maxHp,
            enemyMaxHp: selectedEnemy.stats.maxHp,
            enemyQi: selectedEnemy.stats.qi || 0,
            enemyMaxQi: selectedEnemy.stats.qi || 0,
            enemyShield: 0,
            enemySlot: 0
        });
    }
  }, [selectedEnemy, playerData]);

  // Helper: Finds the next non-null slot in the rotation
  const findNextActiveSlot = (loadout, currentSlotIndex) => {
    if (!loadout || loadout.length === 0) return 0;
    // Iterate 1 to 5 steps ahead to find the next valid slot
    for (let i = 1; i <= 5; i++) {
        const nextIndex = (currentSlotIndex + i) % 5;
        if (loadout[nextIndex] !== null && loadout[nextIndex] !== undefined) {
            return nextIndex;
        }
    }
    return 0; // Fallback
  };

  const handleFight = async () => {
    if (!selectedEnemy || loading) return;
    
    if (playerData.energy < 5) {
        setBattleResult('error'); 
        return;
    }
    
    setLoading(true);
    setCombatLog([]); 
    setBattleResult(null);

    // Initial Slot Calculation: Find the first non-null slot
    setReplayState(prev => ({ 
        ...prev, 
        playerSlot: findNextActiveSlot(playerData.equippedTechniques, -1),
        enemySlot: findNextActiveSlot(selectedEnemy.loadout, -1)
    }));

    try {
      const fightFn = httpsCallable(functions, 'pveFight');
      const result = await fightFn({ enemyId: selectedEnemy.id });
      const data = result.data;

      // Update Max Stats based on server result
      if (data.initialStats) {
          setReplayState(prev => ({
              ...prev,
              playerHp: data.initialStats.playerHp,
              playerMaxHp: data.initialStats.playerMaxHp,
              playerQi: data.initialStats.playerMaxQi || 50,
              playerMaxQi: data.initialStats.playerMaxQi || 50,
              enemyHp: data.initialStats.enemyHp,
              enemyMaxHp: data.initialStats.enemyMaxHp,
              enemyQi: data.initialStats.enemyMaxQi || 0,
              enemyMaxQi: data.initialStats.enemyMaxQi || 0,
              // Recalculate initial slots in case loadout changed
              playerSlot: findNextActiveSlot(playerData.equippedTechniques, -1),
              enemySlot: findNextActiveSlot(selectedEnemy.loadout, -1)
          }));
      }

      if (data.log && Array.isArray(data.log)) {
        let i = 0;
        
        const processLog = () => {
          if (i >= data.log.length) {
            if (data.winner === 'player') setBattleResult('victory');
            else if (data.winner === 'draw') setBattleResult('draw');
            else setBattleResult('defeat');
            setLoading(false);
            return;
          }

          const entry = data.log[i];
          const nextEntry = data.log[i + 1];

          if (entry) {
            setCombatLog(prev => [...prev, entry]);
            
            // --- UPDATE REPLAY STATE ---
            setReplayState(prev => {
                const newState = { ...prev };
                
                // 1. Update Vitals
                if (entry.currentQi !== undefined) {
                    if (entry.actor === 'player') newState.playerQi = entry.currentQi;
                    else if (entry.actor === 'enemy') newState.enemyQi = entry.currentQi;
                }
                if (entry.targetHp !== undefined) {
                    if (entry.actor === 'player') newState.enemyHp = entry.targetHp;
                    else if (entry.actor === 'enemy') newState.playerHp = entry.targetHp;
                    else if (entry.type === 'struggle') newState.enemyHp = entry.targetHp;
                }
                if (entry.currentShield !== undefined) {
                    if (entry.actor === 'player') newState.playerShield = entry.currentShield;
                    else newState.enemyShield = entry.currentShield;
                }

                // 2. Advance Rotation Pointers (FIXED LOGIC)
                // We don't try to guess the slot by name anymore.
                // We simply advance the pointer to the next valid slot.
                if (entry.type !== 'wait' && entry.type !== 'info' && entry.type !== 'error') {
                    if (entry.actor === 'player') {
                        newState.playerSlot = findNextActiveSlot(playerData.equippedTechniques, prev.playerSlot);
                    } else if (entry.actor === 'enemy') {
                        const loadout = selectedEnemy.loadout || [];
                        newState.enemySlot = findNextActiveSlot(loadout, prev.enemySlot);
                    }
                }
                return newState;
            });
          }
          
          let delay = 0;
          if (nextEntry) delay = (nextEntry.time - entry.time) * 1000;
          i++;
          const currentSpeed = speedRef.current;
          if (currentSpeed >= 100) processLog();
          else setTimeout(processLog, Math.max(50, delay / currentSpeed));
        };
        processLog();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      if (err.message && err.message.includes('Not enough energy')) {
          setBattleResult('error');
      } else {
          setCombatLog([{ type: 'error', text: 'Failed to connect to the arena.' }]);
      }
      setLoading(false);
    }
  };

  const getIconForAction = (actionName) => {
    const tech = Object.values(TECHNIQUE_REGISTRY).find(t => t.name === actionName);
    return tech ? tech.icon : null;
  };

  const ActionWithIcon = ({ name }) => {
    const icon = getIconForAction(name);
    return (
      <span className="font-bold inline-flex items-center gap-1 align-text-bottom">
        {icon && <img src={icon} alt="" className="w-4 h-4 object-contain" style={{ imageRendering: 'pixelated' }} />}
        {name}
      </span>
    );
  };

  const renderLogEntry = (entry, index) => {
    if (!entry) return null;

    if (entry.type === 'error') {
        return <div key={index} className="text-red-600 font-bold text-center text-xs my-2 border border-red-200 bg-red-50 p-1">{entry.text}</div>;
    }

    if (entry.type === 'miss') {
      const isPlayer = entry.actor === 'player';
      return (
        <div key={index} className="text-[11px] mb-1 text-center opacity-60 border-b border-dashed border-gray-200 pb-1">
          <span className="font-mono text-gray-400 mr-2">[{entry.time}s]</span>
          <span className="italic text-gray-600">
            {isPlayer ? `You used ` : `${selectedEnemy.name} used `}
            <ActionWithIcon name={entry.action} />
            {` but `}
            <span className="font-bold text-gray-500">MISSED</span>
          </span>
        </div>
      );
    }

    if (entry.type === 'damage') {
      const isPlayer = entry.actor === 'player';
      return (
        <div key={index} className={`text-[11px] mb-1 border-b border-gray-100 pb-1 ${isPlayer ? 'text-blue-800 text-right' : 'text-red-800 text-left'}`}>
          <span className="font-mono text-gray-400 opacity-50 mr-2">[{entry.time}s]</span>
          <span>
            {isPlayer ? `You hit with ` : `${selectedEnemy.name} hit with `}
            <ActionWithIcon name={entry.action} />
            {` for `}
            <span className="font-bold text-sm">{entry.value}</span>
          </span>
        </div>
      );
    }
    
    if (entry.type === 'shield' || entry.type === 'restore_qi') {
       const isPlayer = entry.actor === 'player';
       const colorClass = entry.type === 'shield' ? (isPlayer ? 'text-cyan-700' : 'text-cyan-800') : 'text-green-700';
       return (
        <div key={index} className={`text-[11px] mb-1 border-b border-gray-100 pb-1 ${isPlayer ? 'text-right' : 'text-left'} ${colorClass}`}>
          <span className="font-mono text-gray-400 opacity-50 mr-2">[{entry.time}s]</span>
          <span>
             {isPlayer ? `You cast ` : `${selectedEnemy.name} cast `}
             <ActionWithIcon name={entry.action} />
             {entry.type === 'shield' ? ` (Shield +${entry.value})` : ` (+${entry.qiRestore} Qi)`}
          </span>
        </div>
      ); 
    }

    if (entry.type === 'wait') return null; 
    if (entry.type === 'info') return <div key={index} className="text-[10px] my-1 text-center text-gray-400 italic">{entry.action}</div>;
    if (entry.type === 'struggle') {
        const isPlayer = entry.actor === 'player';
        return <div key={index} className="text-[10px] text-center text-orange-600 font-bold">⚠️ {isPlayer ? 'You are' : 'Enemy is'} struggling (Low Qi)</div>
    }

    return null;
  };

  return (
    <div className="card h-[85vh] md:h-[650px] flex flex-col p-0 overflow-hidden">
      {/* 1. HEADER & CONTROLS */}
      <div className="p-3 border-b border-border bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-ink font-serif uppercase tracking-widest">Combat Arena</h2>
        <div className="flex gap-1 text-[10px]">
          {[1, 2, 4, 100].map((speed) => (
            <button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              className={`px-2 py-1 border rounded ${
                speedMultiplier === speed 
                ? 'bg-accent text-white border-accent' 
                : 'bg-white text-ink border-border hover:bg-gray-100'
              }`}
            >
              {speed === 100 ? 'Skip' : `${speed}x`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT COLUMN: ENEMY PICKER */}
        <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-border bg-stone-50 overflow-y-auto custom-scrollbar flex-shrink-0">
          <div className="p-2 sticky top-0 bg-stone-50 z-10 border-b border-border/50">
             <h3 className="font-bold text-[10px] uppercase tracking-widest text-ink-light">Opponents</h3>
          </div>
          <div className="space-y-1 p-2">
            {ENEMIES.map(enemy => (
              <button
                key={enemy.id}
                onClick={() => !loading && setSelectedEnemy(enemy)}
                className={`w-full text-left p-2 border rounded transition-all
                  ${selectedEnemy?.id === enemy.id 
                    ? 'border-accent bg-white shadow-md ring-1 ring-accent' 
                    : 'border-border bg-white hover:bg-gray-50 text-ink opacity-70 hover:opacity-100'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="font-bold text-xs">{enemy.name}</div>
                <div className="text-[9px] text-ink-light">CP: {enemy.combatPower}</div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: THE STAGE */}
        <div className="flex-1 flex flex-col bg-slate-50 relative min-h-0">
          
          {selectedEnemy ? (
            <>
              {/* --- TOP: VISUAL BATTLE STAGE --- */}
              <div className="h-72 md:h-96 bg-white border-b-2 border-border relative flex flex-col justify-center shadow-sm flex-shrink-0">
                

                <div className="flex justify-between items-center px-4 md:px-8 relative z-10">
                   
                   {/* PLAYER ENTITY */}
                   <CombatEntity 
                      name={playerData.displayName} 
                      type="player"
                      icon="/assets/icons/system/SODA_Icon_System_Misc_SilverStar.png"
                      stats={{ hp: replayState.playerHp, qi: replayState.playerQi }}
                      maxStats={{ hp: replayState.playerMaxHp, qi: replayState.playerMaxQi }}
                      shield={replayState.playerShield}
                      loadout={playerData.equippedTechniques}
                      activeSlot={replayState.playerSlot}
                      isReplaying={combatLog.length > 0 && !battleResult}
                   />

                   {/* ENEMY ENTITY */}
                   <CombatEntity 
                      name={selectedEnemy.name} 
                      type="enemy"
                      icon={selectedEnemy.icon}
                      stats={{ hp: replayState.enemyHp, qi: replayState.enemyQi }}
                      maxStats={{ hp: replayState.enemyMaxHp, qi: replayState.enemyMaxQi }}
                      shield={replayState.enemyShield}
                      loadout={selectedEnemy.loadout}
                      activeSlot={replayState.enemySlot}
                      isReplaying={combatLog.length > 0 && !battleResult}
                   />
                </div>

                {/* START BUTTON OVERLAY */}
                {!loading && !battleResult && combatLog.length === 0 && (
                   <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
                      <button onClick={handleFight} className="btn-primary px-10 py-2 shadow-xl border-2 border-white transform hover:scale-105 transition-transform uppercase font-bold tracking-widest text-sm">
                        Start Duel
                      </button>
                   </div>
                )}
              </div>

              {/* --- BOTTOM: COMPACT LOG --- */}
              <div className="flex-1 bg-white relative flex flex-col min-h-0">
                 <div className="bg-gray-100 px-3 py-1 text-[10px] uppercase font-bold text-gray-500 border-b border-gray-200 flex-shrink-0">
                    Battle Log
                 </div>
                 
                 <div 
                    ref={logContainerRef} 
                    className="flex-1 overflow-y-auto p-3 space-y-1 font-serif bg-white"
                    style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
                 >
                    {combatLog.length === 0 && !loading && (
                        <div className="text-center text-gray-300 italic mt-10 text-xs">Prepare for combat...</div>
                    )}
                    {combatLog.map((entry, i) => renderLogEntry(entry, i))}
                    
                    {battleResult && (
                      <div className={`mt-4 p-4 text-center border-2 border-dashed rounded animate-fadeIn
                          ${battleResult === 'victory' ? 'border-green-200 bg-green-50' : 
                            battleResult === 'error' ? 'border-orange-200 bg-orange-50' : 
                            'border-red-200 bg-red-50'}
                      `}>
                          {battleResult === 'victory' ? (
                            <div className="text-green-800 font-bold text-lg uppercase tracking-widest">Victory!</div>
                          ) : battleResult === 'draw' ? (
                            <div className="text-gray-600 font-bold text-lg uppercase tracking-widest">Draw</div>
                          ) : battleResult === 'error' ? (
                            <div className="text-orange-800 font-bold text-sm uppercase tracking-widest">
                                ⚠️ Depleted<br/>
                                <span className="text-[10px] normal-case font-normal text-orange-900/70">You need 5 Energy to fight</span>
                            </div>
                          ) : (
                            <div className="text-red-800 font-bold text-lg uppercase tracking-widest">Defeated</div>
                          )}
                          <button onClick={() => {setCombatLog([]); setBattleResult(null);}} className="mt-2 text-xs font-bold underline hover:text-ink">
                            {battleResult === 'error' ? 'Return' : 'Reset Arena'}
                          </button>
                      </div>
                    )}
                 </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-ink-light opacity-50">
              <div className="text-4xl mb-2">⚔️</div>
              <p className="italic text-sm">Select an opponent to enter the ring.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CombatPage;