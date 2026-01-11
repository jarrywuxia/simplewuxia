// functions/combat/simulator/formulas.js

// Go up one level (..) to find statusEffects in functions/combat/
const { STATUS_EFFECTS } = require('../statusEffects'); 

const DEFENSE_CONSTANT_K = 1; 

exports.recalculateStats = (entity) => {
    // 1. Start with Base Stats
    let newStats = { ...entity.baseStats };
    let percentModifiers = {}; 

    // 2. Iterate Active Effects
    entity.activeEffects.forEach(instance => {
        const def = STATUS_EFFECTS[instance.id];
        if (def && def.statMod) {
            for (const [key, value] of Object.entries(def.statMod)) {
                if (key.endsWith('_pct')) {
                    const statName = key.replace('_pct', '');
                    percentModifiers[statName] = (percentModifiers[statName] || 0) + value;
                } else {
                    if (newStats[key] === undefined) newStats[key] = 0;
                    newStats[key] += value;
                }
            }
        }
    });

    // 3. Apply Percentage Modifiers
    for (const [statName, pctValue] of Object.entries(percentModifiers)) {
        const currentVal = newStats[statName] || 0;
        const multiplier = 1 + (pctValue / 100);
        newStats[statName] = Math.floor(currentVal * multiplier);
    }

    // 4. Safety
    for (const key in newStats) {
        if (newStats[key] < 0) newStats[key] = 0;
    }

    entity.stats = newStats;
};

exports.calculateHit = (technique, defender) => {
    const baseAcc = technique.accuracy !== undefined ? technique.accuracy : 100;
    const targetEvasion = defender.stats.evasion || 0;
    const hitChance = baseAcc - targetEvasion;
    return Math.random() * 100 <= hitChance;
};

exports.calculateDamage = (attacker, defender, tech) => {
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

exports.applyDamageToTarget = (target, amount) => {
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