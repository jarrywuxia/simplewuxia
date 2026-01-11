// functions/combat/simulator/actions.js

const { STATUS_EFFECTS } = require('../statusEffects');
const { 
    calculateHit, 
    calculateDamage, 
    applyDamageToTarget, 
    recalculateStats 
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
        if (!doesHit) {
            result.missed = true;
        }
    }

    // 2. Normalize Effects
    const effects = tech.effects || (tech.effect ? [tech.effect] : []);

    // 3. Process Effects
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
                if (def.canStack) {
                    const currentStacks = recipient.activeEffects.filter(e => e.id === effectData.id).length;
                    const max = def.maxStacks || 99; 

                    if (currentStacks < max) {
                         recipient.activeEffects.push({
                            id: effectData.id,
                            expireTime: time + effectData.duration,
                            nextTick: time + (def.tickInterval || 999),
                            value: effectData.value || 0,
                            uniqueId: Math.random() 
                         });
                    } else {
                         const oldest = recipient.activeEffects
                            .filter(e => e.id === effectData.id)
                            .sort((a, b) => a.expireTime - b.expireTime)[0];
                         
                         if (oldest) oldest.expireTime = time + effectData.duration;
                    }
                } else {
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
                result.statusApplied.push({
                    id: effectData.id,
                    value: effectData.value || 0,
                    duration: effectData.duration,
                    interval: def.tickInterval || 0
                });
            }
        }
    });

    // 4. Direct Damage
    if (tech.power > 0 && doesHit) {
        const potentialDmg = calculateDamage(user, target, tech);
        applyDamageToTarget(target, potentialDmg);
        result.damage = potentialDmg;
    }

    return result;
};

exports.processStatusTicks = (entity, time) => {
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