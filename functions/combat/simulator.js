const { TECHNIQUE_REGISTRY } = require('./techniques');

// UPDATED: Calculate damage using Base + Scale
const calculateDamage = (attacker, defender, tech) => {
  const base = tech.damageBase || 0;
  const scale = tech.damageScale || 0;
  
  // Formula: (Base + (Strength * Scale))
  const rawOffense = base + (attacker.stats.strength * scale);
  
  // Defense Mitigation (Flat reduction for now)
  const mitigation = (defender.stats.defense * 0.5);
  
  return Math.max(1, Math.floor(rawOffense - mitigation));
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

const applyTechniqueEffect = (tech, user, target) => {
    let result = { damage: 0, heal: 0, qiRestore: 0, shield: 0 };

    // 1. Shields 
    if (tech.effect && tech.effect.type === 'shield') {
        const val = tech.effect.value;
        user.shield += val;
        result.shield = val;
    }

    // 2. Direct Damage (Offense)
    if (tech.type === 'offense' || tech.damageBase > 0) {
        // Pass 'tech' to calculator now
        const potentialDmg = calculateDamage(user, target, tech);
        applyDamageToTarget(target, potentialDmg);
        result.damage = potentialDmg;
    }

    // 3. Qi Restore
    if (tech.effect && tech.effect.type === 'restore_qi') {
        const gain = tech.effect.value;
        user.qi = Math.min(user.maxQi, user.qi + gain);
        result.qiRestore = gain;
    }

    return result;
};

exports.simulateCombat = (playerData, enemyData) => {
  const battleLog = [];
  let time = 0;
  const MAX_TIME = 1200; // 20 Minutes
  const TICK_RATE = 0.1; 

  const createCombatant = (id, name, data, isPlayer) => ({
      id,
      name,
      hp: data.stats.maxHp,
      maxHp: data.stats.maxHp,
      qi: data.stats.qi || 0,
      maxQi: data.stats.qi || 0,
      stats: data.stats,
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
      if (time < actor.nextActionTime) {
           actor.qi = Math.min(actor.maxQi, actor.qi + (0.5 * TICK_RATE));
           return { didAct: false, logEntry: null };
      }

      let logEntry = null;

      if (actor.consecutiveSkips >= 5) {
          const sData = TECHNIQUE_REGISTRY['struggle'];
          const res = applyTechniqueEffect(sData, actor, target);
          actor.qi = Math.min(actor.maxQi, actor.qi + 5);
          actor.nextActionTime = time + sData.cooldown;

          logEntry = {
              time: Number(time.toFixed(1)),
              actor: actor.id,
              action: sData.name,
              type: 'struggle',
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
                  
                  const res = applyTechniqueEffect(tech, actor, target);

                  logEntry = {
                      time: Number(time.toFixed(1)),
                      actor: actor.id,
                      action: tech.name,
                      type: 'technique', 
                      value: res.damage, 
                      qiRestore: res.qiRestore,
                      targetHp: target.hp,
                      currentQi: Math.floor(actor.qi),
                      currentShield: actor.shield
                  };
                  
                  if (res.shield > 0) {
                      logEntry.type = 'shield';
                      logEntry.value = res.shield; 
                  } else if (res.damage > 0) {
                      logEntry.type = 'damage';
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

  // Handle Timeout
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