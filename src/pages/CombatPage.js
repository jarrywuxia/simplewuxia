import React, { useState, useRef, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { ENEMIES } from '../data/enemies';
import { TECHNIQUE_REGISTRY } from '../data/techniques'; // Import registry to look up icons

function CombatPage({ playerData }) {
  const [selectedEnemy, setSelectedEnemy] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [battleResult, setBattleResult] = useState(null); 
  
  const [speedMultiplier, setSpeedMultiplier] = useState(1); 
  const speedRef = useRef(1);

  const logContainerRef = useRef(null);

  const [replayState, setReplayState] = useState({
    playerHp: playerData?.stats?.maxHp || 100,
    playerMaxHp: playerData?.stats?.maxHp || 100,
    playerQi: playerData?.stats?.qi || 50,
    playerMaxQi: playerData?.stats?.qi || 50,
    playerShield: 0, 
    enemyHp: 100,   
    enemyMaxHp: 100,
    enemyQi: 0,
    enemyMaxQi: 0,
    enemyShield: 0 
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
            enemyHp: selectedEnemy.stats.maxHp,
            enemyMaxHp: selectedEnemy.stats.maxHp,
            enemyQi: selectedEnemy.stats.qi || 0,
            enemyMaxQi: selectedEnemy.stats.qi || 0,
            enemyShield: 0
        });
    }
  }, [selectedEnemy, playerData]);

  const handleFight = async () => {
    if (!selectedEnemy || loading) return;
    
    setLoading(true);
    setCombatLog([]); 
    setBattleResult(null);

    try {
      const fightFn = httpsCallable(functions, 'pveFight');
      const result = await fightFn({ enemyId: selectedEnemy.id });
      const data = result.data;

      let currentSimState = { ...replayState };

      if (data.initialStats) {
          currentSimState = {
              ...currentSimState,
              playerHp: data.initialStats.playerHp,
              playerMaxHp: data.initialStats.playerMaxHp,
              playerQi: data.initialStats.playerMaxQi || 50,
              playerMaxQi: data.initialStats.playerMaxQi || 50,
              enemyHp: data.initialStats.enemyHp,
              enemyMaxHp: data.initialStats.enemyMaxHp,
              enemyQi: data.initialStats.enemyMaxQi || 0,
              enemyMaxQi: data.initialStats.enemyMaxQi || 0
          };
          setReplayState(currentSimState);
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

            setReplayState(prev => {
                const newState = { ...prev };
                
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
      setCombatLog([{ type: 'error', text: 'Failed to connect to the arena.' }]);
      setLoading(false);
    }
  };

  // Helper to find icon by Name
  const getIconForAction = (actionName) => {
    const tech = Object.values(TECHNIQUE_REGISTRY).find(t => t.name === actionName);
    return tech ? tech.icon : null;
  };

  // Helper to render the Icon + Name combo
  const ActionWithIcon = ({ name }) => {
    const icon = getIconForAction(name);
    return (
      <span className="font-bold inline-flex items-center gap-1 align-text-bottom">
        {icon && <img src={icon} alt="" className="w-5 h-5 object-contain" style={{ imageRendering: 'pixelated' }} />}
        {name}
      </span>
    );
  };

  const renderLogEntry = (entry, index) => {
    if (!entry) return null;

    if (entry.type === 'damage') {
      const isPlayer = entry.actor === 'player';
      return (
        <div key={index} className={`text-xs mb-1 ${isPlayer ? 'text-blue-800 text-right' : 'text-red-800 text-left'}`}>
          <span className="font-mono text-ink-light opacity-50 mr-2">[{entry.time}s]</span>
          <span>
            {isPlayer ? `You used ` : `${selectedEnemy.name} used `}
            <ActionWithIcon name={entry.action} />
            {` for `}
            <span className="font-bold">{entry.value}</span>
            {` damage.`}
          </span>
        </div>
      );
    }
    
    if (entry.type === 'shield') {
       const isPlayer = entry.actor === 'player';
       return (
        <div key={index} className={`text-xs mb-1 ${isPlayer ? 'text-blue-600 text-right' : 'text-red-600 text-left'}`}>
          <span className="font-mono text-ink-light opacity-50 mr-2">[{entry.time}s]</span>
          <span>
            {isPlayer ? `You used ` : `${selectedEnemy.name} used `}
            <ActionWithIcon name={entry.action} />
            {` (Shield +${entry.value})`}
          </span>
        </div>
      ); 
    }

    if (entry.type === 'restore_qi') {
       const isPlayer = entry.actor === 'player';
       return (
        <div key={index} className={`text-xs mb-1 ${isPlayer ? 'text-green-700 text-right' : 'text-green-700 text-left'}`}>
          <span className="font-mono text-ink-light opacity-50 mr-2">[{entry.time}s]</span>
          <span>
            {isPlayer ? `You used ` : `${selectedEnemy.name} used `}
            <ActionWithIcon name={entry.action} />
            {` (+${entry.qiRestore} Qi)`}
          </span>
        </div>
      ); 
    }

    if (entry.type === 'wait') {
        return (
            <div key={index} className="text-[10px] my-2 text-center text-ink-light bg-stone-100 py-1 rounded border border-dashed border-stone-200">
                <span className="font-mono mr-2">[{entry.time}s]</span>
                <span className="italic">Waiting for cooldowns...</span>
            </div>
        );
    }

    if (entry.type === 'struggle') {
      const isPlayer = entry.actor === 'player';
      return (
        <div key={index} className={`text-xs mb-1 text-center font-bold border-t border-b py-1 my-1 ${isPlayer ? 'text-orange-600 border-orange-100' : 'text-purple-600 border-purple-100'}`}>
           <span className="font-mono text-ink-light opacity-50 mr-2">[{entry.time}s]</span>
           {isPlayer ? 'You are' : selectedEnemy.name + ' is'} Low on Qi! <ActionWithIcon name={entry.action} /> (+5 Qi)
        </div>
      );
    }

    if (entry.type === 'info') {
        return <div key={index} className="text-[10px] my-1 text-center text-gray-500 italic">{entry.action}</div>;
    }

    if (entry.type === 'error') {
        return <div key={index} className="text-red-600 font-bold text-center">{entry.text}</div>;
    }

    return null;
  };

  const getPct = (current, max) => max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;

  return (
    <div className="card h-[85vh] md:h-[650px] flex flex-col">
      <div className="border-b border-border pb-4 mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <h2 className="text-2xl font-bold text-ink font-serif">Combat Arena</h2>
        
        {/* REPLAY CONTROLS */}
        <div className="flex gap-1 text-xs">
          <span className="self-center font-bold text-ink-light uppercase mr-2 hidden sm:inline">Speed:</span>
          {[1, 2, 4, 100].map((speed) => (
            <button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              className={`px-2 py-1 border ${
                speedMultiplier === speed 
                ? 'bg-accent text-white border-accent' 
                : 'bg-white text-ink border-border hover:bg-gray-100'
              }`}
            >
              {speed === 1 ? '1x' : speed === 2 ? '2x' : speed === 4 ? '4x' : '>>'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* LEFT: Enemy List */}
        <div className="w-full md:w-1/3 h-40 md:h-auto border-b md:border-b-0 md:border-r border-border pr-0 md:pr-4 overflow-y-auto custom-scrollbar flex-shrink-0">
          <h3 className="font-bold text-xs uppercase tracking-widest text-ink-light mb-2 sticky top-0 bg-paper py-1 z-10">Opponents</h3>
          <div className="space-y-2">
            {ENEMIES.map(enemy => (
              <button
                key={enemy.id}
                onClick={() => !loading && setSelectedEnemy(enemy)}
                className={`w-full text-left p-3 border transition-all
                  ${selectedEnemy?.id === enemy.id 
                    ? 'border-accent bg-accent text-white shadow-md' 
                    : 'border-border bg-stone-50 hover:bg-white text-ink'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="font-bold text-sm">{enemy.name}</div>
                <div className={`text-[10px] ${selectedEnemy?.id === enemy.id ? 'text-white/80' : 'text-ink-light'}`}>
                  CP: {enemy.combatPower}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Battle View */}
        <div className="w-full md:w-2/3 flex flex-col h-full overflow-hidden">
          {selectedEnemy ? (
            <>
              {/* --- DYNAMIC BATTLE HEADER --- */}
              <div className="bg-stone-50 p-3 md:p-4 border border-border mb-4 shadow-inner flex-shrink-0">
                
                <div className="flex justify-between items-center mb-4 text-xs font-bold uppercase tracking-widest text-ink-light">
                    <span>You</span>
                    <span>VS</span>
                    <span>{selectedEnemy.name}</span>
                </div>

                <div className="flex gap-2 md:gap-4">
                    {/* PLAYER STATS */}
                    <div className="flex-1 space-y-1 md:space-y-2">
                        {/* HP & SHIELD */}
                        <div className="relative h-3 md:h-4 bg-gray-300 w-full rounded-sm overflow-hidden">
                            <div className="absolute top-0 left-0 h-full bg-red-600 transition-all duration-300 ease-out" 
                                style={{ width: `${getPct(replayState.playerHp, replayState.playerMaxHp)}%` }} />
                            {/* Shield Overlay */}
                            {replayState.playerShield > 0 && (
                                <div className="absolute top-0 left-0 h-full border-r-2 border-white bg-blue-400/50 z-10 transition-all duration-300"
                                     style={{ width: `${Math.min(100, (replayState.playerShield / replayState.playerMaxHp) * 100)}%` }} />
                            )}
                            {/* HP NUMBERS */}
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white font-mono font-bold drop-shadow-md z-20">
                                {Math.max(0, replayState.playerHp)} / {replayState.playerMaxHp}
                                {replayState.playerShield > 0 && <span className="text-blue-200"> (+{replayState.playerShield})</span>}
                            </span>
                        </div>
                        
                        {/* QI */}
                        <div className="relative h-3 md:h-4 bg-gray-300 w-full rounded-sm overflow-hidden">
                            <div className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300 ease-out" 
                                style={{ width: `${getPct(replayState.playerQi, replayState.playerMaxQi)}%` }} />
                            {/* QI NUMBERS */}
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white font-mono font-bold drop-shadow-md z-20">
                                {Math.max(0, replayState.playerQi)} / {replayState.playerMaxQi} QI
                            </span>
                        </div>
                    </div>

                    {/* ENEMY STATS */}
                    <div className="flex-1 space-y-1 md:space-y-2">
                         {/* HP & SHIELD */}
                         <div className="relative h-3 md:h-4 bg-gray-300 w-full rounded-sm overflow-hidden">
                            <div className="absolute top-0 left-0 h-full bg-red-800 transition-all duration-300 ease-out" 
                                style={{ width: `${getPct(replayState.enemyHp, replayState.enemyMaxHp)}%` }} />
                            
                            {replayState.enemyShield > 0 && (
                                <div className="absolute top-0 left-0 h-full border-r-2 border-white bg-blue-400/50 z-10 transition-all duration-300"
                                     style={{ width: `${Math.min(100, (replayState.enemyShield / replayState.enemyMaxHp) * 100)}%` }} />
                            )}
                            
                            {/* ENEMY HP NUMBERS */}
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white font-mono font-bold drop-shadow-md z-20">
                                {Math.max(0, replayState.enemyHp)} / {replayState.enemyMaxHp}
                            </span>
                        </div>
                        
                        {/* ENEMY QI */}
                        <div className="relative h-3 md:h-4 bg-gray-300 w-full rounded-sm overflow-hidden">
                            <div className="absolute top-0 left-0 h-full bg-purple-500 transition-all duration-300 ease-out" 
                                style={{ width: `${getPct(replayState.enemyQi, replayState.enemyMaxQi)}%` }} />
                            {/* ENEMY QI NUMBERS */}
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white font-mono font-bold drop-shadow-md z-20">
                                {Math.max(0, replayState.enemyQi)} / {replayState.enemyMaxQi} QI
                            </span>
                        </div>
                    </div>
                </div>

                {!loading && !battleResult && (
                    <div className="text-center mt-4">
                        <button onClick={handleFight} className="btn-primary px-8 py-2 uppercase tracking-widest text-xs animate-pulse shadow-lg">
                            Engage
                        </button>
                    </div>
                )}
              </div>

              <div ref={logContainerRef} className="flex-1 bg-white border border-border p-4 overflow-y-auto font-serif relative">
                {combatLog.map((entry, i) => renderLogEntry(entry, i))}
                {battleResult && (
                   <div className="mt-4 p-3 text-center border-t-2 border-border animate-fadeIn bg-stone-50">
                      {battleResult === 'victory' ? (
                        <div className="text-green-700 font-bold text-xl uppercase tracking-widest">Victory!</div>
                      ) : battleResult === 'draw' ? (
                        <div className="text-gray-600 font-bold text-xl uppercase tracking-widest">Draw</div>
                      ) : (
                        <div className="text-red-700 font-bold text-xl uppercase tracking-widest">Defeated</div>
                      )}
                      <button onClick={() => {setCombatLog([]); setBattleResult(null);}} className="block mx-auto mt-2 text-xs text-ink underline hover:text-accent">
                        Fight Again
                      </button>
                   </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-ink-light italic">
              Select an opponent to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CombatPage;