// functions/combat/simulator/index.js

const { TECHNIQUE_REGISTRY } = require('../techniques');
const { STATUS_EFFECTS } = require('../statusEffects');
const { applyTechniqueEffect, processStatusTicks } = require('./actions');

exports.simulateCombat = (playerData, enemyData) => {
  const battleLog = [];
  let time = 0;
  const MAX_TIME = 1200; 
  const TICK_RATE = 0.1; 

  // --- ENTITY FACTORY ---
  const createCombatant = (id, name, data, isPlayer) => ({
      id,
      name,
      hp: data.stats.maxHp,
      maxHp: data.stats.maxHp,
      qi: data.stats.qi || 0,
      maxQi: data.stats.qi || 0,
      baseStats: { ...data.stats, evasion: data.stats.evasion || 0 },
      stats: { ...data.stats, evasion: data.stats.evasion || 0 }, 
      activeEffects: [], 
      shield: 0, 
      loadout: data.loadout || (isPlayer ? (data.equippedTechniques || []) : []),
      nextActionTime: 0, 
      currentSlot: 0,
      consecutiveSkips: 0,
      lastActionTime: 0
  });

  let player = createCombatant('player', playerData.displayName, playerData, true);
  let enemy = createCombatant('enemy', enemyData.name, {
      stats: enemyData.stats,
      loadout: enemyData.loadout
  }, false);

  const applyInitialDelay = (entity) => {
      const firstTechId = entity.loadout[0];
      if (firstTechId) {
          const tech = TECHNIQUE_REGISTRY[firstTechId];
          if (tech && tech.initialCharge) {
              entity.nextActionTime = tech.initialCharge;
          }
      }
  };
  applyInitialDelay(player);
  applyInitialDelay(enemy);

  let winner = null;

  // --- TURN LOGIC ---
  const processTurn = (actor, target) => {
      // Stun Check
      const isStunned = actor.activeEffects.some(inst => {
          const def = STATUS_EFFECTS[inst.id];
          return def && def.canAct === false;
      });

      if (isStunned) {
          if (time >= actor.nextActionTime) {
              actor.nextActionTime = time + 1.0; 
              return { 
                  didAct: true, 
                  logEntry: {
                      time: Number(time.toFixed(1)),
                      actor: actor.id,
                      type: 'stunned',
                      action: 'Stunned'
                  } 
              };
          }
          return { didAct: false, logEntry: null };
      }

      if (time < actor.nextActionTime) {
           actor.qi = Math.min(actor.maxQi, actor.qi + (0.5 * TICK_RATE));
           return { didAct: false, logEntry: null };
      }

      let logEntry = null;

      if (actor.consecutiveSkips >= 5) {
          const sData = TECHNIQUE_REGISTRY['struggle'];
          const res = applyTechniqueEffect(sData, actor, target, time);
          actor.qi = Math.min(actor.maxQi, actor.qi + 5);
          actor.nextActionTime = time + sData.cooldown;

          logEntry = {
              time: Number(time.toFixed(1)),
              actor: actor.id,
              action: sData.name,
              type: res.missed ? 'miss' : 'struggle', 
              value: res.damage,
              targetHp: target.hp,
              currentQi: Math.floor(actor.qi)
          };
          actor.consecutiveSkips = 0;
      } else {
          const techId = actor.loadout[actor.currentSlot];
          
          if (!techId) {
              actor.currentSlot = (actor.currentSlot + 1) % 5;
              if (actor.loadout.every(id => id === null)) actor.consecutiveSkips = 5;
          } else {
              const tech = TECHNIQUE_REGISTRY[techId];
              const cost = tech.qiCostBase + (tech.qiCostPct * actor.maxQi);
              
              if (actor.qi >= cost) {
                  actor.qi -= cost;
                  actor.nextActionTime = time + tech.cooldown;
                  
                  const res = applyTechniqueEffect(tech, actor, target, time);

                  logEntry = {
                      time: Number(time.toFixed(1)),
                      actor: actor.id,
                      action: tech.name,
                      type: 'technique', 
                      value: res.damage, 
                      qiRestore: res.qiRestore,
                      targetHp: target.hp,
                      currentQi: Math.floor(actor.qi),
                      currentShield: actor.shield,
                      missed: res.missed,
                      appliedEffects: res.statusApplied
                  };
                  
                  if (res.missed) logEntry.type = 'miss';
                  else if (res.damage > 0) logEntry.type = 'damage'; 
                  else if (res.statusApplied.length > 0) logEntry.type = 'effect_apply'; 
                  else if (res.shield > 0) { logEntry.type = 'shield'; logEntry.value = res.shield; } 
                  else if (res.qiRestore > 0) logEntry.type = 'restore_qi';

                  actor.currentSlot = (actor.currentSlot + 1) % 5;
                  actor.consecutiveSkips = 0;
              } else {
                  actor.nextActionTime = time + 1.0;
                  actor.currentSlot = (actor.currentSlot + 1) % 5;
                  actor.consecutiveSkips++;
              }
          }
      }
      return { didAct: !!logEntry, logEntry };
  };

  // --- MAIN SIMULATION LOOP ---
  while (time < MAX_TIME && !winner) {
    const pTicks = processStatusTicks(player, time);
    battleLog.push(...pTicks);
    const eTicks = processStatusTicks(enemy, time);
    battleLog.push(...eTicks);

    if (player.hp <= 0) winner = 'enemy';
    if (enemy.hp <= 0) winner = 'player';
    if (winner) break;

    const pResult = processTurn(player, enemy);
    if (pResult.logEntry) battleLog.push(pResult.logEntry);
    
    // Idle/Waiting Logic (Fill empty time)
    if (player.nextActionTime - time > 1.5) {
         if (time > player.lastActionTime + 1.0) {
             const lastLog = battleLog[battleLog.length - 1];
             if (!lastLog || lastLog.type !== 'wait') {
                 battleLog.push({
                    time: Number(time.toFixed(1)),
                    actor: 'player',
                    type: 'wait',
                    action: '...',
                    currentQi: Math.floor(player.qi)
                 });
             }
             player.lastActionTime = time; 
         }
    } else if (pResult.didAct) {
        player.lastActionTime = time;
    }

    const eResult = processTurn(enemy, player);
    if (eResult.logEntry) battleLog.push(eResult.logEntry);

    if (enemy.hp <= 0) winner = 'player';
    else if (player.hp <= 0) winner = 'enemy';

    time += TICK_RATE;
  }

  if (!winner) {
      battleLog.push({
          time: Number(time.toFixed(1)),
          actor: 'system',
          type: 'info',
          action: 'Time Limit Reached! The fight ends in a Draw.'
      });
      winner = 'draw';
  }

  return {
    winner,
    log: battleLog,
    rewards: winner === 'player' ? enemyData.rewards : null,
    initialStats: {
        playerHp: playerData.stats.maxHp,
        playerMaxHp: playerData.stats.maxHp,
        playerQi: playerData.stats.qi || 50,
        playerMaxQi: playerData.stats.qi || 50,
        enemyHp: enemyData.stats.maxHp,
        enemyMaxHp: enemyData.stats.maxHp,
        enemyQi: enemyData.stats.qi || 0, 
        enemyMaxQi: enemyData.stats.qi || 0
    }
  };
};