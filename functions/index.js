const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const { getNewPlayerData } = require('./playerTemplate');

// --- IMPORT THE NEW SYSTEM ---
const { 
  generateQuickMeditationReward, 
  generateDeepMeditationReward, 
  calculatePassiveRegen 
} = require('./meditationSystem');

admin.initializeApp();
const db = admin.firestore();

// --- GAME CONSTANTS ---
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

exports.meditate = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'You must be logged in.');

    const uid = request.auth.uid;
    const type = request.data.type || 'quick'; 
    const playerRef = db.collection('players').doc(uid);

    // 1. Validation (Input Type) - SECURITY FIX
    if (type !== 'quick' && type !== 'deep') {
        throw new HttpsError('invalid-argument', 'Invalid meditation type.');
    }

    return await db.runTransaction(async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists) throw new HttpsError('not-found', 'Character not found.');

        const data = playerDoc.data();
        const now = Date.now();

        // 2. APPLY PASSIVE REGEN (Fixes Energy being stuck)
        const regenData = calculatePassiveRegen(data);
        let currentEnergy = regenData.energy;
        const newLastEnergyUpdate = regenData.lastEnergyUpdate;

        // 3. Logic Checks
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
            // Deduct cost from the REGENERATED amount
            currentEnergy -= DEEP_MEDITATION_COST;
        }

        // 4. Generate Rewards
        let result;
        if (type === 'quick') {
            result = generateQuickMeditationReward(data);
        } else {
            result = generateDeepMeditationReward(data);
        }

        // 5. Inventory Logic
        let newInventory = data.inventory || [];
        if (result.item) {
            const itemIndex = newInventory.findIndex(item => item.id === result.item);
            if (itemIndex > -1) {
                newInventory[itemIndex].quantity += 1;
            } else {
                newInventory.push({ id: result.item, quantity: 1 });
            }
        }

        // 6. Leveling Logic
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

        // 7. Update Database
        transaction.update(playerRef, {
            experience: newXp,
            spiritStones: newStones,
            energy: currentEnergy, // Save the calculated energy
            lastEnergyUpdate: newLastEnergyUpdate, // Save the regen timestamp
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

// At the very top of functions/index.js
const MASTER_ITEMS = require('./masterItems'); 

// Add this to your exports
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
        
        // 1. CALCULATE REGEN FIRST
        const regenData = calculatePassiveRegen(data);
        let currentEnergy = regenData.energy;
        const newLastEnergyUpdate = regenData.lastEnergyUpdate;
        
        // 2. Validate Item
        const itemDef = MASTER_ITEMS[itemId];
        if (!itemDef || itemDef.type !== 'consumable') {
            throw new HttpsError('invalid-argument', 'This item cannot be consumed.');
        }

        // 3. Check Inventory
        let inventory = data.inventory || [];
        const itemIndex = inventory.findIndex(i => i.id === itemId);
        
        if (itemIndex === -1 || inventory[itemIndex].quantity < qtyToUse) {
            throw new HttpsError('failed-precondition', 'Not enough items.');
        }

        // 4. Apply Effect
        if (itemDef.effect.type === 'restore_energy') {
            const maxEnergy = 100;
            const energyGain = itemDef.effect.value * qtyToUse;
            // Add pill energy to REGENERATED energy
            currentEnergy = Math.min(maxEnergy, currentEnergy + energyGain);
        }

        // 5. Deduct Item
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

        // 1. Validate Item
        if (!itemDef || itemDef.type !== 'equipment') {
            throw new HttpsError('invalid-argument', 'Not an equippable item.');
        }

        // 2. Check Ownership
        let inventory = [...(data.inventory || [])];
        const itemIndex = inventory.findIndex(i => i.id === itemId);
        
        if (itemIndex === -1 || inventory[itemIndex].quantity <= 0) {
            throw new HttpsError('failed-precondition', 'You do not own this item.');
        }

        // 3. Handle The Swap
        const targetSlot = itemDef.slot; // e.g., 'weapon', 'armor'
        let equipment = { ...(data.equipment || {}) };
        const currentlyEquippedId = equipment[targetSlot];

        // Remove 1 of the new item from inventory
        if (inventory[itemIndex].quantity > 1) {
            inventory[itemIndex].quantity -= 1;
        } else {
            inventory.splice(itemIndex, 1);
        }

        // If something was equipped, put it back in inventory
        if (currentlyEquippedId) {
            addToInventory(inventory, currentlyEquippedId, 1);
        }

        // Equip the new item
        equipment[targetSlot] = itemId;

        // 4. Update DB
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
    
    const { slot } = request.data; // e.g., 'weapon'
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
        
        // Move item to inventory
        addToInventory(inventory, itemId, 1);
        
        // Clear slot
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
    
    // 1. Sanitize Input
    const { techniqueId } = request.data;
    // Force integer conversion to prevent string/float injection
    const slotIndex = parseInt(request.data.slotIndex, 10);

    const uid = request.auth.uid;
    const playerRef = db.collection('players').doc(uid);

    // 2. Validate Input
    // Check if NaN (not a number) OR out of bounds
    if (isNaN(slotIndex) || slotIndex < 0 || slotIndex > 4) {
        throw new HttpsError('invalid-argument', 'Invalid slot index (0-4).');
    }

    return await db.runTransaction(async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists) throw new HttpsError('not-found', 'Player not found.');

        const data = playerDoc.data();
        let equipped = data.equippedTechniques || [null, null, null, null, null];
        const learned = data.learnedTechniques || [];

        // If equipping (not clearing)
        if (techniqueId) {
            // A. Do they know it?
            if (!learned.includes(techniqueId)) {
                throw new HttpsError('failed-precondition', 'You have not learned this technique.');
            }
            // B. Is it already equipped in another slot?
            const existingIndex = equipped.indexOf(techniqueId);
            if (existingIndex > -1 && existingIndex !== slotIndex) {
                // Clear the old slot so we don't have duplicates
                equipped[existingIndex] = null;
            }
        }

        // Set the new slot (ensure it's null if unequipping)
        equipped[slotIndex] = techniqueId || null;

        transaction.update(playerRef, { equippedTechniques: equipped });

        return { success: true, message: 'Technique slot updated.' };
    });
});

// ... existing imports
const { simulateCombat } = require('./combat/simulator');
const { ENEMIES } = require('./combat/enemies');

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

        // 1. CALCULATE REGEN & CHECK COST (Security Fix)
        const regenData = calculatePassiveRegen(playerData);
        let currentEnergy = regenData.energy;
        const ENERGY_COST = 5;

        if (currentEnergy < ENERGY_COST) {
            throw new HttpsError('failed-precondition', 'Not enough energy to fight (Cost: 5).');
        }

        // 2. Run Simulation
        const result = simulateCombat(playerData, enemyData);

        // 3. Prepare Updates
        // Deduct energy immediately
        let updates = {
            energy: currentEnergy - ENERGY_COST,
            lastEnergyUpdate: regenData.lastEnergyUpdate
        };

        if (result.winner === 'player') {
             updates.experience = (playerData.experience || 0) + (result.rewards.exp || 0);
             updates.spiritStones = (playerData.spiritStones || 0) + (result.rewards.stones || 0);
        }

        // 4. Update DB
        transaction.update(playerRef, updates);

        return {
            success: true,
            winner: result.winner,
            log: result.log,
            rewards: result.winner === 'player' ? result.rewards : null
        };
    });
});

// functions/index.js (Add to bottom)

exports.createCharacter = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'You must be logged in.');

    const uid = request.auth.uid;
    const { displayName } = request.data;
    const cleanName = displayName ? displayName.trim() : '';

    // 1. Length/Char Validation
    if (!cleanName || cleanName.length < 3 || cleanName.length > 20) {
        throw new HttpsError('invalid-argument', 'Name must be 3-20 characters.');
    }
    if (!/^[a-zA-Z0-9_ ]+$/.test(cleanName)) {
        throw new HttpsError('invalid-argument', 'Invalid characters in name.');
    }

    // 2. Blocklist Validation (Profanity/Security Fix)
    const lowerName = cleanName.toLowerCase();
    const RESERVED_NAMES = ['admin', 'system', 'mod', 'moderator', 'gm', 'support', 'server', 'nigger'];
    
    // Check if name contains any reserved words
    if (RESERVED_NAMES.some(reserved => lowerName.includes(reserved))) {
        throw new HttpsError('invalid-argument', 'This name cannot be used.');
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

// 1. Add this to the TOP of functions/index.js
const { getDatabase } = require('firebase-admin/database');

// 2. Add this to the BOTTOM of functions/index.js
exports.sendChatMessage = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');
    
    const text = request.data.text;
    if (!text || typeof text !== 'string' || text.length > 150) {
        throw new HttpsError('invalid-argument', 'Invalid message.');
    }

    const uid = request.auth.uid;
    const playerRef = db.collection('players').doc(uid);
    const now = Date.now();
    
    // 1. Fetch Player
    const playerSnap = await playerRef.get();
    if (!playerSnap.exists) throw new HttpsError('not-found', 'No character.');
    const playerData = playerSnap.data();

    // 2. CHECK RATE LIMIT (Security Fix)
    const lastChatTime = playerData.lastChatTime || 0;
    // 2000ms = 2 seconds cooldown
    if (now - lastChatTime < 2000) {
        throw new HttpsError('resource-exhausted', 'You are chatting too fast.');
    }

    // 3. Write to Realtime Database
    const rtdb = getDatabase();
    await rtdb.ref('globalChat').push({
        text: text,
        senderName: playerData.displayName,
        senderRealm: playerData.realmIndex,
        userId: uid,
        timestamp: now
    });

    // 4. Update Timestamp in Firestore
    await playerRef.update({ lastChatTime: now });

    return { success: true };
});