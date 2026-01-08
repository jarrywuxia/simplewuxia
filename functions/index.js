const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { getDatabase } = require('firebase-admin/database');

// --- 1. FILTER & SECURITY SETUP ---
const Filter = require('bad-words');
const filter = new Filter();

// List of base words to strictly filter
const BAD_WORDS_LIST = [
    'fuck',
    'nigger',
    'nigga',
    'cunt',
    'bitch',
    'whore',
    'faggot',
    'shit',
    'slut',
    'asshole'
];

// Helper: Converts "fuck" -> /f[\W_]*u[\W_]*c[\W_]*k/gi
// This matches: "fu.ck", "f u c k", "f_u-c.k", "f@ck"
const generateStrictPattern = (word) => {
    // Escape the word chars just in case, then join with "any non-word char or underscore"
    const pattern = word.split('').join('[\\W_]*');
    return new RegExp(pattern, 'gi');
};

// Generate the patterns automatically
const STRICT_PATTERNS = BAD_WORDS_LIST.map(generateStrictPattern);

// Helper: Clean text using BOTH library and Strict Regex
const cleanTextSecurely = (text) => {
    let cleaned = text;
    
    // A. Library Filter (Standard words)
    try {
        if (filter.isProfane(cleaned)) cleaned = filter.clean(cleaned);
    } catch (e) {}

    // B. Strict Regex (Evasion attempts)
    STRICT_PATTERNS.forEach(pattern => {
        cleaned = cleaned.replace(pattern, (match) => '*'.repeat(match.length));
    });
    
    return cleaned;
};

// Helper: Check if text is profane (for blocking names)
const isTextProfane = (text) => {
    if (filter.isProfane(text)) return true;
    return STRICT_PATTERNS.some(pattern => pattern.test(text));
};

// --- 2. GAME IMPORTS ---
const { getNewPlayerData } = require('./playerTemplate');
const { 
  generateQuickMeditationReward, 
  generateDeepMeditationReward, 
  calculatePassiveRegen 
} = require('./meditationSystem');
const MASTER_ITEMS = require('./masterItems'); 
const { simulateCombat } = require('./combat/simulator');
const { ENEMIES } = require('./combat/enemies');

admin.initializeApp();
const db = admin.firestore();

// --- 3. GAME CONSTANTS ---
const REALMS = [
  { name: 'Spirit Gathering', stages: ['Early', 'Intermediate', 'Late', 'Peak'] },
  { name: 'Body Refinement', stages: ['Early', 'Intermediate', 'Late', 'Peak'] },
  { name: 'Foundation Establishment', stages: ['Early', 'Intermediate', 'Late', 'Peak'] },
  { name: 'Nascent Soul', stages: ['Early', 'Intermediate', 'Late', 'Peak'] },
  { name: 'Unity', stages: ['Early', 'Intermediate', 'Late', 'Peak'] },
  { name: 'Incarnation', stages: ['Early', 'Intermediate', 'Late', 'Peak'] },
  { name: 'Divine', stages: ['Early', 'Intermediate', 'Late', 'Peak'] },
  { name: 'Heavenly Tribulation', stages: ['Early', 'Intermediate', 'Late', 'Peak'] }
];

const XP_PER_STAGE = 100;
const STAT_POINTS_PER_STAGE = 5;
const DEEP_MEDITATION_COST = 20;

// --- 4. EXPORTED FUNCTIONS ---

exports.meditate = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'You must be logged in.');

    const uid = request.auth.uid;
    const type = request.data.type || 'quick'; 
    const playerRef = db.collection('players').doc(uid);

    if (type !== 'quick' && type !== 'deep') {
        throw new HttpsError('invalid-argument', 'Invalid meditation type.');
    }

    return await db.runTransaction(async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists) throw new HttpsError('not-found', 'Character not found.');

        const data = playerDoc.data();
        const now = Date.now();

        const regenData = calculatePassiveRegen(data);
        let currentEnergy = regenData.energy;
        const newLastEnergyUpdate = regenData.lastEnergyUpdate;

        if (type === 'quick') {
            const lastTime = data.lastMeditationTime || 0;
            const cooldown = (data.lastCooldownDuration || 5) * 1000; 
            if (now - lastTime < cooldown - 500) {
                throw new HttpsError('failed-precondition', 'Meditation is on cooldown.');
            }
        } else if (type === 'deep') {
            if (currentEnergy < DEEP_MEDITATION_COST) {
                throw new HttpsError('failed-precondition', 'Not enough energy.');
            }
            currentEnergy -= DEEP_MEDITATION_COST;
        }

        let result;
        if (type === 'quick') {
            result = generateQuickMeditationReward(data);
        } else {
            result = generateDeepMeditationReward(data);
        }

        let newInventory = data.inventory || [];
        if (result.item) {
            const itemIndex = newInventory.findIndex(item => item.id === result.item);
            if (itemIndex > -1) {
                newInventory[itemIndex].quantity += 1;
            } else {
                newInventory.push({ id: result.item, quantity: 1 });
            }
        }

        let newXp = (data.experience || 0) + result.experience;
        let newStones = (data.spiritStones || 0) + result.spiritStones;
        let newRealmIndex = data.realmIndex || 0;
        let newStageIndex = data.stageIndex || 0;
        let newPoints = data.unallocatedPoints || 0;
        let newXpNeeded = data.experienceNeeded || XP_PER_STAGE;
        let extraMessage = "";

        if (newXp >= newXpNeeded) {
            const currentRealm = REALMS[newRealmIndex];
            if (currentRealm) {
                if (newStageIndex + 1 < currentRealm.stages.length) {
                    newStageIndex++;
                    newXp -= newXpNeeded;
                    extraMessage = ` Advanced to ${currentRealm.stages[newStageIndex]}!`;
                } else if (newRealmIndex + 1 < REALMS.length) {
                    newRealmIndex++;
                    newStageIndex = 0;
                    newXp -= newXpNeeded;
                    newXpNeeded = XP_PER_STAGE * (newRealmIndex + 1);
                    extraMessage = ` BREAKTHROUGH to ${REALMS[newRealmIndex].name}!`;
                }
                newPoints += STAT_POINTS_PER_STAGE;
            }
        }

        transaction.update(playerRef, {
            experience: newXp,
            spiritStones: newStones,
            energy: currentEnergy,
            lastEnergyUpdate: newLastEnergyUpdate,
            realmIndex: newRealmIndex,
            stageIndex: newStageIndex,
            unallocatedPoints: newPoints,
            experienceNeeded: newXpNeeded,
            inventory: newInventory,
            lastMeditationTime: type === 'quick' ? now : data.lastMeditationTime,
            lastCooldownDuration: result.cooldown || 5 
        });

        return {
            success: true,
            rewards: {
                experience: result.experience,
                spiritStones: result.spiritStones,
                item: result.item
            },
            message: result.message + extraMessage,
            cooldown: result.cooldown || 0
        };
    });
});

exports.allocateStat = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');

    const { statName } = request.data; 
    const uid = request.auth.uid;
    const playerRef = db.collection('players').doc(uid);

    const allowedStats = ['strength', 'defense', 'qi', 'maxHp'];
    if (!allowedStats.includes(statName)) {
        throw new HttpsError('invalid-argument', 'Invalid stat name.');
    }

    return await db.runTransaction(async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists) throw new HttpsError('not-found', 'No player.');

        const data = playerDoc.data();
        if (data.unallocatedPoints <= 0) {
            throw new HttpsError('failed-precondition', 'No points available.');
        }

        const currentStatValue = data.stats[statName] || 0;
        const updateData = {
            unallocatedPoints: data.unallocatedPoints - 1,
            [`stats.${statName}`]: currentStatValue + 1
        };

        if (statName === 'maxHp') {
            updateData[`stats.${statName}`] = currentStatValue + 20;
        }
        if (statName === 'qi') {
             updateData[`stats.${statName}`] = currentStatValue + 10;
        }

        transaction.update(playerRef, updateData);
        return { success: true, newStatValue: currentStatValue + 1 };
    });
});

exports.useItem = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');

    const { itemId, quantity } = request.data; 
    const qtyToUse = parseInt(quantity) || 1;

    if (qtyToUse < 1) throw new HttpsError('invalid-argument', 'Quantity must be at least 1.');

    const uid = request.auth.uid;
    const playerRef = db.collection('players').doc(uid);

    return await db.runTransaction(async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists) throw new HttpsError('not-found', 'Player not found.');

        const data = playerDoc.data();
        
        const regenData = calculatePassiveRegen(data);
        let currentEnergy = regenData.energy;
        const newLastEnergyUpdate = regenData.lastEnergyUpdate;
        
        const itemDef = MASTER_ITEMS[itemId];
        if (!itemDef || itemDef.type !== 'consumable') {
            throw new HttpsError('invalid-argument', 'This item cannot be consumed.');
        }

        let inventory = data.inventory || [];
        const itemIndex = inventory.findIndex(i => i.id === itemId);
        
        if (itemIndex === -1 || inventory[itemIndex].quantity < qtyToUse) {
            throw new HttpsError('failed-precondition', 'Not enough items.');
        }

        if (itemDef.effect.type === 'restore_energy') {
            const maxEnergy = 100;
            const energyGain = itemDef.effect.value * qtyToUse;
            currentEnergy = Math.min(maxEnergy, currentEnergy + energyGain);
        }

        if (inventory[itemIndex].quantity > qtyToUse) {
            inventory[itemIndex].quantity -= qtyToUse;
        } else {
            inventory.splice(itemIndex, 1);
        }

        transaction.update(playerRef, {
            inventory: inventory,
            energy: currentEnergy,
            lastEnergyUpdate: newLastEnergyUpdate
        });
        
        return { success: true, message: `Consumed ${qtyToUse}x ${itemDef.name}` };
    });
});

const addToInventory = (inventory, itemId, quantity = 1) => {
    const existingIndex = inventory.findIndex(i => i.id === itemId);
    if (existingIndex > -1) {
        inventory[existingIndex].quantity += quantity;
    } else {
        inventory.push({ id: itemId, quantity });
    }
    return inventory;
};

exports.equipItem = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');
    
    const { itemId } = request.data;
    const uid = request.auth.uid;
    const playerRef = db.collection('players').doc(uid);

    return await db.runTransaction(async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists) throw new HttpsError('not-found', 'Player not found.');

        const data = playerDoc.data();
        const itemDef = MASTER_ITEMS[itemId];

        if (!itemDef || itemDef.type !== 'equipment') {
            throw new HttpsError('invalid-argument', 'Not an equippable item.');
        }

        let inventory = [...(data.inventory || [])];
        const itemIndex = inventory.findIndex(i => i.id === itemId);
        
        if (itemIndex === -1 || inventory[itemIndex].quantity <= 0) {
            throw new HttpsError('failed-precondition', 'You do not own this item.');
        }

        const targetSlot = itemDef.slot;
        let equipment = { ...(data.equipment || {}) };
        const currentlyEquippedId = equipment[targetSlot];

        if (inventory[itemIndex].quantity > 1) {
            inventory[itemIndex].quantity -= 1;
        } else {
            inventory.splice(itemIndex, 1);
        }

        if (currentlyEquippedId) {
            addToInventory(inventory, currentlyEquippedId, 1);
        }

        equipment[targetSlot] = itemId;

        transaction.update(playerRef, {
            inventory: inventory,
            equipment: equipment
        });

        return { 
            success: true, 
            message: `Equipped ${itemDef.name}`,
            equippedId: itemId,
            unequippedId: currentlyEquippedId || null
        };
    });
});

exports.unequipItem = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');
    
    const { slot } = request.data;
    const uid = request.auth.uid;
    const playerRef = db.collection('players').doc(uid);

    return await db.runTransaction(async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        const data = playerDoc.data();
        
        let equipment = { ...(data.equipment || {}) };
        const itemId = equipment[slot];

        if (!itemId) {
            throw new HttpsError('failed-precondition', 'Nothing equipped in that slot.');
        }

        let inventory = [...(data.inventory || [])];
        addToInventory(inventory, itemId, 1);
        
        equipment[slot] = null;

        transaction.update(playerRef, {
            inventory: inventory,
            equipment: equipment
        });

        return { success: true, message: 'Item unequipped.' };
    });
});

exports.equipTechnique = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');
    
    const { techniqueId } = request.data;
    const slotIndex = parseInt(request.data.slotIndex, 10);

    const uid = request.auth.uid;
    const playerRef = db.collection('players').doc(uid);

    if (isNaN(slotIndex) || slotIndex < 0 || slotIndex > 4) {
        throw new HttpsError('invalid-argument', 'Invalid slot index (0-4).');
    }

    return await db.runTransaction(async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists) throw new HttpsError('not-found', 'Player not found.');

        const data = playerDoc.data();
        let equipped = data.equippedTechniques || [null, null, null, null, null];
        const learned = data.learnedTechniques || [];

        if (techniqueId) {
            if (!learned.includes(techniqueId)) {
                throw new HttpsError('failed-precondition', 'You have not learned this technique.');
            }
            const existingIndex = equipped.indexOf(techniqueId);
            if (existingIndex > -1 && existingIndex !== slotIndex) {
                equipped[existingIndex] = null;
            }
        }

        equipped[slotIndex] = techniqueId || null;

        transaction.update(playerRef, { equippedTechniques: equipped });

        return { success: true, message: 'Technique slot updated.' };
    });
});

exports.pveFight = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');
    
    const { enemyId } = request.data;
    const uid = request.auth.uid;
    const playerRef = db.collection('players').doc(uid);

    return await db.runTransaction(async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists) throw new HttpsError('not-found', 'Player not found.');

        const playerData = playerDoc.data();
        const enemyData = ENEMIES[enemyId];

        if (!enemyData) throw new HttpsError('not-found', 'Enemy not found.');

        const regenData = calculatePassiveRegen(playerData);
        let currentEnergy = regenData.energy;
        const ENERGY_COST = 5;

        if (currentEnergy < ENERGY_COST) {
            throw new HttpsError('failed-precondition', 'Not enough energy to fight (Cost: 5).');
        }

        const result = simulateCombat(playerData, enemyData);

        let updates = {
            energy: currentEnergy - ENERGY_COST,
            lastEnergyUpdate: regenData.lastEnergyUpdate
        };

        if (result.winner === 'player') {
             updates.experience = (playerData.experience || 0) + (result.rewards.exp || 0);
             updates.spiritStones = (playerData.spiritStones || 0) + (result.rewards.stones || 0);
        }

        transaction.update(playerRef, updates);

        return {
            success: true,
            winner: result.winner,
            log: result.log,
            rewards: result.winner === 'player' ? result.rewards : null
        };
    });
});

// --- UPDATED CREATE CHARACTER (Uses Strict Regex) ---
exports.createCharacter = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'You must be logged in.');

    const uid = request.auth.uid;
    const { displayName } = request.data;
    const cleanName = displayName ? displayName.trim() : '';

    if (!cleanName || cleanName.length < 3 || cleanName.length > 20) {
        throw new HttpsError('invalid-argument', 'Name must be 3-20 characters.');
    }
    if (!/^[a-zA-Z0-9_ ]+$/.test(cleanName)) {
        throw new HttpsError('invalid-argument', 'Invalid characters in name.');
    }

    // 1. PROFANITY & RESERVED LIST CHECK
    if (isTextProfane(cleanName)) {
        throw new HttpsError('invalid-argument', 'This name cannot be used (Inappropriate).');
    }

    const lowerName = cleanName.toLowerCase();
    const RESERVED_NAMES = ['admin', 'system', 'mod', 'moderator', 'gm', 'support', 'server'];
    if (RESERVED_NAMES.some(reserved => lowerName.includes(reserved))) {
        throw new HttpsError('invalid-argument', 'This name cannot be used (Reserved).');
    }

    const playerRef = db.collection('players').doc(uid);
    const usernameRef = db.collection('usernames').doc(lowerName);

    return await db.runTransaction(async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        if (playerDoc.exists) throw new HttpsError('already-exists', 'Character already exists.');

        const usernameDoc = await transaction.get(usernameRef);
        if (usernameDoc.exists) throw new HttpsError('already-exists', 'This name is taken.');

        const newPlayerData = getNewPlayerData(uid, cleanName);

        transaction.set(playerRef, newPlayerData);
        transaction.set(usernameRef, {
            userId: uid,
            displayName: cleanName,
            createdAt: Date.now()
        });

        return { success: true };
    });
});

// --- UPDATED CHAT (RTDB Optimized + Strict Regex) ---
exports.sendChatMessage = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');
    
    const text = request.data.text;
    if (!text || typeof text !== 'string' || text.length > 150) {
        throw new HttpsError('invalid-argument', 'Invalid message.');
    }

    // 1. CLEAN THE MESSAGE (Regex + Library)
    const cleanText = cleanTextSecurely(text);

    const uid = request.auth.uid;
    const now = Date.now();
    const rtdb = getDatabase();

    // 2. CHECK RATE LIMIT (IN RTDB)
    const rateLimitRef = rtdb.ref(`chatRateLimits/${uid}`);
    const rateLimitSnap = await rateLimitRef.once('value');
    const lastChatTime = rateLimitSnap.val() || 0;

    if (now - lastChatTime < 2000) {
        throw new HttpsError('resource-exhausted', 'You are chatting too fast.');
    }

    // 3. FETCH PLAYER INFO
    const playerRef = db.collection('players').doc(uid);
    const playerSnap = await playerRef.get();
    
    if (!playerSnap.exists) throw new HttpsError('not-found', 'No character.');
    const playerData = playerSnap.data();

    // 4. WRITE TO RTDB (Message + Timestamp update)
    const chatRef = rtdb.ref('globalChat');
    const newMessageRef = chatRef.push();
    
    const updates = {};
    updates[`globalChat/${newMessageRef.key}`] = {
        text: cleanText,
        senderName: playerData.displayName,
        senderRealm: playerData.realmIndex,
        userId: uid,
        timestamp: now
    };
    updates[`chatRateLimits/${uid}`] = now;

    await rtdb.ref().update(updates);

    return { success: true };
});