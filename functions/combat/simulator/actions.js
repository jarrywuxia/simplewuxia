// functions/combat/simulator/actions.js

const { STATUS_EFFECTS } = require('../statusEffects');
const { 
    calculateHit, 
    calculateDamage, 
    applyDamageToTarget, 
    recalculateStats,
    getDamageMultiplier,
    calculateMitigation 
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
                // --- SNAPSHOT LOGIC ---
                let storedValue = effectData.value || 0;

                if (effectData.power) {
                    const scalingStat = tech.scalingStat || 'strength';
                    const userStat = user.stats[scalingStat] || 0;
                    const buffs = getDamageMultiplier(user, null);
                    
                    // KEEP PRECISION HERE: Do not round the snapshot
                    // storedValue might be 15.68231...
                    storedValue = (userStat * (effectData.power / 100)) * buffs;
                }
                // ---------------------

                const statusObject = {
                    id: effectData.id,
                    expireTime: time + effectData.duration,
                    nextTick: time + (def.tickInterval || 999),
                    value: storedValue, // Storing exact float
                    uniqueId: Math.random() 
                };

                if (def.canStack) {
                    recipient.activeEffects.push(statusObject);
                } else {
                    const existing = recipient.activeEffects.find(e => e.id === effectData.id);
                    if (existing) {
                        existing.expireTime = time + effectData.duration;
                        existing.value = storedValue; 
                    } else {
                        recipient.activeEffects.push(statusObject);
                    }
                }
                
                recalculateStats(recipient);
                
                // For the log/UI return, we might want to round purely for display
                // but the internal logic kept the float.
                result.statusApplied.push({
                    id: effectData.id,
                    value: Math.round(storedValue), 
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
    
    // 1. Expiration
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
                const defense = entity.stats.defense || 0;
                
                // Keep floats for calculation
                const mitigation = calculateMitigation(instance.value, defense);
                const exactDmg = instance.value * mitigation;
                
                // ROUND ONLY HERE: Final application to HP
                const finalDmg = Math.max(1, Math.round(exactDmg));

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
            
            if (def.type === 'hot') {
                // Round Healing
                const heal = Math.round(instance.value);
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