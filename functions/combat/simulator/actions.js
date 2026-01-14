// functions/combat/simulator/actions.js

const { STATUS_EFFECTS } = require('../statusEffects');
const { 
    calculateHit, 
    calculateDamage, 
    applyDamageToTarget, 
    recalculateStats,
    getDamageMultiplier, // Import new helper
    calculateMitigation // Import new helper
} = require('./formulas');

exports.applyTechniqueEffect = (tech, user, target, time) => {
    let result = { 
        damage: 0, 
        heal: 0, 
        qiRestore: 0, 
        shield: 0, 
        missed: false, 
        statusApplied: [] 
    };

    // 1. Hit Check
    let doesHit = true;
    if (tech.type === 'offense' || tech.power > 0) {
        doesHit = calculateHit(tech, target);
        if (!doesHit) result.missed = true;
    }

    const effects = tech.effects || (tech.effect ? [tech.effect] : []);

    // 2. Process Effects
    effects.forEach(effectData => {
        // ... Shield and Qi logic remains the same ...
        if (effectData.type === 'shield') {
            const val = effectData.value;
            user.shield += val;
            result.shield += val;
        }
        if (effectData.type === 'restore_qi') {
            const gain = effectData.value;
            user.qi = Math.min(user.maxQi, user.qi + gain);
            result.qiRestore += gain;
        }
        
        if (effectData.type === 'apply_status') {
            const recipient = effectData.target === 'self' ? user : target;
            if (effectData.target === 'enemy' && !doesHit) return;

            const def = STATUS_EFFECTS[effectData.id];
            if (def) {
                // --- NEW SNAPSHOT LOGIC ---
                let storedValue = effectData.value || 0;

                // If the effect has a 'power' (DoT scaling), calculate snapshot
                if (effectData.power) {
                    const scalingStat = tech.scalingStat || 'strength';
                    const userStat = user.stats[scalingStat] || 0;
                    const buffs = getDamageMultiplier(user, null); // Only user buffs apply to snapshot
                    
                    // The "Stored Value" is the Raw Potential Damage
                    // Formula: (Strength * (Power/100)) * Buffs
                    storedValue = (userStat * (effectData.power / 100)) * buffs;
                }
                // --------------------------

                const statusObject = {
                    id: effectData.id,
                    expireTime: time + effectData.duration,
                    nextTick: time + (def.tickInterval || 999),
                    value: storedValue, // Save the snapshot here
                    uniqueId: Math.random() 
                };

                // Add to list (Logic for stacking vs replacing remains same)
                if (def.canStack) {
                    recipient.activeEffects.push(statusObject);
                } else {
                    const existing = recipient.activeEffects.find(e => e.id === effectData.id);
                    if (existing) {
                        existing.expireTime = time + effectData.duration;
                        // For non-stacking DoTs, usually overwrite the snapshot with the new stronger one?
                        // For simplicity, we just refresh duration here.
                        // To update damage, you'd do: existing.value = storedValue;
                        existing.value = storedValue; 
                    } else {
                        recipient.activeEffects.push(statusObject);
                    }
                }
                
                recalculateStats(recipient);
                result.statusApplied.push({
                    id: effectData.id,
                    value: storedValue,
                    duration: effectData.duration,
                    interval: def.tickInterval || 0
                });
            }
        }
    });

    if (tech.power > 0 && doesHit) {
        const potentialDmg = calculateDamage(user, target, tech);
        applyDamageToTarget(target, potentialDmg);
        result.damage = potentialDmg;
    }

    return result;
};

exports.processStatusTicks = (entity, time) => {
    const logs = [];
    
    // 1. Expiration (Existing Logic)
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
            
            if (def.type === 'dot') {
                // --- NEW DOT MITIGATION LOGIC ---
                // instance.value holds the "Raw Snapshot Damage"
                // We compare it against the target's CURRENT defense
                const defense = entity.stats.defense || 0;
                
                // Use the mitigation formula
                // Note: We use instance.value as the "Attack Force" for the ratio calculation
                const mitigation = calculateMitigation(instance.value, defense);
                
                // Final Tick Damage
                const finalDmg = Math.max(1, Math.floor(instance.value * mitigation));

                applyDamageToTarget(entity, finalDmg);
                
                logs.push({
                    time: Number(time.toFixed(1)),
                    actor: entity.id,
                    type: 'effect_tick',
                    effectId: instance.id,
                    damage: finalDmg,
                    currentHp: entity.hp
                });
            }
            // -------------------------------
            
            if (def.type === 'hot') {
                const heal = Math.floor(instance.value);
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