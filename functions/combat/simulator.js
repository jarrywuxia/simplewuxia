// functions/combat/simulator.js

const { TECHNIQUE_REGISTRY } = require('./techniques');
const { STATUS_EFFECTS } = require('./statusEffects'); 

const DEFENSE_CONSTANT_K = 1; 

// --- HELPER: RECALCULATE STATS (Flat + Percent) ---
const recalculateStats = (entity) => {
    // 1. Start with Base Stats
    let newStats = { ...entity.baseStats };
    let percentModifiers = {}; // Store { strength: 10, defense: -20 } representing %

    // 2. Iterate Active Effects
    entity.activeEffects.forEach(instance => {
        const def = STATUS_EFFECTS[instance.id];
        if (def && def.statMod) {
            for (const [key, value] of Object.entries(def.statMod)) {
                
                // CHECK: Is this a Percentage Modifier? (e.g., "defense_pct")
                if (key.endsWith('_pct')) {
                    const statName = key.replace('_pct', ''); // "defense"
                    percentModifiers[statName] = (percentModifiers[statName] || 0) + value;
                } 
                // ELSE: Flat Modifier
                else {
                    if (newStats[key] === undefined) newStats[key] = 0;
                    newStats[key] += value;
                }
            }
        }
    });

    // 3. Apply Percentage Modifiers
    // Formula: Final = (Base + Flat) * (1 + Sum% / 100)
    for (const [statName, pctValue] of Object.entries(percentModifiers)) {
        const currentVal = newStats[statName] || 0;
        // Example: 100 def * (1 + (-20/100)) = 100 * 0.8 = 80
        const multiplier = 1 + (pctValue / 100);
        newStats[statName] = Math.floor(currentVal * multiplier);
    }

    // 4. Safety: Ensure no negative stats (optional but recommended)
    for (const key in newStats) {
        if (newStats[key] < 0) newStats[key] = 0;
    }

    entity.stats = newStats;
};

// --- HELPER: HIT CALCULATION ---
const calculateHit = (technique, defender) => {
    const baseAcc = technique.accuracy !== undefined ? technique.accuracy : 100;
    const targetEvasion = defender.stats.evasion || 0;
    const hitChance = baseAcc - targetEvasion;
    return Math.random() * 100 <= hitChance;
};

// --- HELPER: DAMAGE FORMULA ---
const calculateDamage = (attacker, defender, tech) => {
  const scalingStat = tech.scalingStat || 'strength';
  const atk = attacker.stats[scalingStat] || 0;
  const def = defender.stats.defense || 0;
  const power = tech.power || 100;
  
  const rawOffense = atk * (power / 100);
  const defenseFactor = atk > 0 ? (atk / (atk + (def * DEFENSE_CONSTANT_K))) : 0;
  const buffMultiplier = 1.0; 

  const totalDamage = rawOffense * defenseFactor * buffMultiplier;
  return Math.max(1, Math.floor(totalDamage));
};

const applyDamageToTarget = (target, amount) => {
    let hpDamage = amount;
    if (target.shield > 0) {
        if (target.shield >= amount) {
            target.shield -= amount;
            hpDamage = 0;
        } else {
            hpDamage = amount - target.shield;
            target.shield = 0;
        }
    }
    target.hp -= hpDamage;
    return hpDamage; 
};

// --- UPDATED: EFFECT APPLICATION (Supports Arrays) ---
const applyTechniqueEffect = (tech, user, target, time) => {
    // Initialize result object with array for statuses
    let result = { 
        damage: 0, 
        heal: 0, 
        qiRestore: 0, 
        shield: 0, 
        missed: false, 
        statusApplied: [] 
    };

    // 1. Calculate Hit Status (Offensive Moves)
    let doesHit = true;
    if (tech.type === 'offense' || tech.power > 0) {
        doesHit = calculateHit(tech, target);
        if (!doesHit) {
            result.missed = true;
        }
    }

    // 2. Normalize Effects (Array or Single Fallback)
    const effects = tech.effects || (tech.effect ? [tech.effect] : []);

    // 3. Process All Effects
    effects.forEach(effectData => {
        // Shield
        if (effectData.type === 'shield') {
            const val = effectData.value;
            user.shield += val;
            result.shield += val;
        }
        
        // Qi
        if (effectData.type === 'restore_qi') {
            const gain = effectData.value;
            user.qi = Math.min(user.maxQi, user.qi + gain);
            result.qiRestore += gain;
        }
        
        // Status Application
        if (effectData.type === 'apply_status') {
            const recipient = effectData.target === 'self' ? user : target;
            
            // If targeting enemy, respect the hit calculation
            if (effectData.target === 'enemy' && !doesHit) return;

            const def = STATUS_EFFECTS[effectData.id];
            if (def) {
                // LOGIC CHANGE: Handle Stacking vs Non-Stacking
                if (def.canStack) {
                    // Count existing stacks of this type
                    const currentStacks = recipient.activeEffects.filter(e => e.id === effectData.id).length;
                    const max = def.maxStacks || 99; 

                    if (currentStacks < max) {
                         // Add NEW INDEPENDENT stack
                         recipient.activeEffects.push({
                            id: effectData.id,
                            expireTime: time + effectData.duration,
                            nextTick: time + (def.tickInterval || 999),
                            value: effectData.value || 0,
                            uniqueId: Math.random() 
                         });
                    } else {
                         // Refresh oldest stack
                         const oldest = recipient.activeEffects
                            .filter(e => e.id === effectData.id)
                            .sort((a, b) => a.expireTime - b.expireTime)[0];
                         
                         if (oldest) oldest.expireTime = time + effectData.duration;
                    }
                } else {
                    // Non-Stacking: Refresh existing or add new
                    const existing = recipient.activeEffects.find(e => e.id === effectData.id);
                    if (existing) {
                        existing.expireTime = time + effectData.duration;
                    } else {
                        recipient.activeEffects.push({
                            id: effectData.id,
                            expireTime: time + effectData.duration,
                            nextTick: time + (def.tickInterval || 999),
                            value: effectData.value || 0
                        });
                    }
                }
                
                recalculateStats(recipient);
                result.statusApplied.push(effectData.id);
            }
        }
    });

    // 4. Apply Direct Damage (if hit)
    if (tech.power > 0 && doesHit) {
        const potentialDmg = calculateDamage(user, target, tech);
        applyDamageToTarget(target, potentialDmg);
        result.damage = potentialDmg;
    }

    return result;
};

// --- PROCESS TICKS ---
const processStatusTicks = (entity, time) => {
    const logs = [];
    
    // 1. Check Expiration
    const expired = entity.activeEffects.filter(e => e.expireTime <= time);
    
    if (expired.length > 0) {
        expired.forEach(e => {
            logs.push({
                time: Number(time.toFixed(1)),
                actor: entity.id,
                type: 'effect_expire',
                effectId: e.id
            });
        });
        
        entity.activeEffects = entity.activeEffects.filter(e => e.expireTime > time);
        recalculateStats(entity);
    }

    // 2. Process Ticks
    entity.activeEffects.forEach(instance => {
        const def = STATUS_EFFECTS[instance.id];
        if (!def) return;

        if (def.tickInterval > 0 && time >= instance.nextTick) {
            instance.nextTick += def.tickInterval;
            
            // Note: Since stacks are independent objects, multiplier is always 1 per object
            const stackMultiplier = 1; 

            if (def.type === 'dot') {
                const dmg = instance.value * stackMultiplier;
                applyDamageToTarget(entity, dmg);
                logs.push({
                    time: Number(time.toFixed(1)),
                    actor: entity.id,
                    type: 'effect_tick',
                    effectId: instance.id,
                    damage: dmg,
                    currentHp: entity.hp
                });
            }
            
            if (def.type === 'hot') {
                const heal = instance.value * stackMultiplier;
                entity.hp = Math.min(entity.maxHp, entity.hp + heal);
                logs.push({
                    time: Number(time.toFixed(1)),
                    actor: entity.id,
                    type: 'effect_tick',
                    effectId: instance.id,
                    heal: heal,
                    currentHp: entity.hp
                });
            }
        }
    });

    return logs;
};

exports.simulateCombat = (playerData, enemyData) => {
  const battleLog = [];
  let time = 0;
  const MAX_TIME = 1200; 
  const TICK_RATE = 0.1; 

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
                      appliedEffectIds: res.statusApplied // Passed as Array
                  };
                  
                  if (res.missed) {
                      logEntry.type = 'miss';
                  } else if (res.damage > 0) {
                      logEntry.type = 'damage'; 
                  } else if (res.statusApplied.length > 0) {
                      logEntry.type = 'effect_apply'; 
                  } else if (res.shield > 0) {
                      logEntry.type = 'shield';
                      logEntry.value = res.shield; 
                  } else if (res.qiRestore > 0) {
                      logEntry.type = 'restore_qi';
                  }

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