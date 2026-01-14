// functions/combat/simulator/formulas.js

const { STATUS_EFFECTS } = require('../statusEffects'); 

const CONSTANT_K = 1;

// --- 1. Helper: Calculate Buff Multiplier ---
exports.getDamageMultiplier = (attacker, defender) => {
    let damageModPct = 0;

    // Attacker Buffs
    attacker.activeEffects.forEach(instance => {
        const effectDef = STATUS_EFFECTS[instance.id];
        if (effectDef && effectDef.statMod && effectDef.statMod.damage_pct) {
            damageModPct += effectDef.statMod.damage_pct;
        }
    });

    // Defender Vulnerabilities
    if (defender) {
        defender.activeEffects.forEach(instance => {
            const effectDef = STATUS_EFFECTS[instance.id];
            if (effectDef && effectDef.statMod && effectDef.statMod.incoming_damage_pct) {
                damageModPct += effectDef.statMod.incoming_damage_pct;
            }
        });
    }

    return 1 + (damageModPct / 100);
};

// --- 2. Helper: Calculate Mitigation ---
exports.calculateMitigation = (attackForce, defenseScore) => {
    if (attackForce <= 0) return 0;
    // Returns a float (e.g. 0.666666...)
    return attackForce / (attackForce + (defenseScore * CONSTANT_K));
};

// --- 3. Recalculate Stats ---
exports.recalculateStats = (entity) => {
    let newStats = { ...entity.baseStats };
    let percentModifiers = {}; 

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

    for (const [statName, pctValue] of Object.entries(percentModifiers)) {
        const currentVal = newStats[statName] || 0;
        const multiplier = 1 + (pctValue / 100); 
        // We round Stats to nearest whole number so UI looks clean
        // (e.g. 10.9 Strength becomes 11, not 10)
        newStats[statName] = Math.round(currentVal * multiplier);
    }

    for (const key in newStats) {
        if (newStats[key] < 0) newStats[key] = 0;
    }
    entity.stats = newStats;
};

// --- 4. Hit Calculation ---
exports.calculateHit = (technique, defender) => {
    const baseAcc = technique.accuracy !== undefined ? technique.accuracy : 100;
    const targetEvasion = defender.stats.evasion || 0;
    return Math.random() * 100 <= (baseAcc - targetEvasion);
};

// --- 5. Main Damage Calculation ---
exports.calculateDamage = (attacker, defender, tech) => {
  const scalingStat = tech.scalingStat || 'strength';
  const atk = attacker.stats[scalingStat] || 0;
  const def = defender.stats.defense || 0;
  const powerPct = (tech.power || 100) / 100;

  // STAGE 1: RAW OUTPUT (Float)
  const rawOutput = atk * powerPct;

  // STAGE 2: MITIGATION (Float)
  const mitigation = exports.calculateMitigation(atk, def);

  // STAGE 3: BUFFS (Float)
  const buffMultiplier = exports.getDamageMultiplier(attacker, defender);

  // FINAL CALCULATION (Float)
  const exactDamage = rawOutput * mitigation * Math.max(0, buffMultiplier);

  // FINAL ROUNDING: Nearest Whole Number (min 1)
  return Math.max(1, Math.round(exactDamage));
};

// --- 6. Apply Damage ---
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