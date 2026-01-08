const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const { getNewPlayerData } = require('./playerTemplate');

// --- IMPORT THE NEW SYSTEM ---
const { generateQuickMeditationReward, generateDeepMeditationReward } = require('./meditationSystem');

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
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in.');
    }

    const uid = request.auth.uid;
    const type = request.data.type || 'quick'; 
    const playerRef = db.collection('players').doc(uid);

    return await db.runTransaction(async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        
        if (!playerDoc.exists) {
            throw new HttpsError('not-found', 'Character not found.');
        }

        const data = playerDoc.data();
        const now = Date.now();

        // 1. Validation (Cooldown & Energy)
        if (type === 'quick') {
            const lastTime = data.lastMeditationTime || 0;
            const cooldown = (data.lastCooldownDuration || 5) * 1000; 
            
            if (now - lastTime < cooldown - 500) {
                throw new HttpsError('failed-precondition', 'Meditation is on cooldown.');
            }
        } else if (type === 'deep') {
            if (data.energy < DEEP_MEDITATION_COST) {
                throw new HttpsError('failed-precondition', 'Not enough energy.');
            }
        }

        // 2. Generate Rewards
        let result;
        if (type === 'quick') {
            result = generateQuickMeditationReward(data);
        } else {
            result = generateDeepMeditationReward(data);
        }

        // 3. Process Inventory (Stacking Logic)
        let newInventory = data.inventory || [];
        if (result.item) {
            // Check if item already exists in inventory
            const itemIndex = newInventory.findIndex(item => item.id === result.item);
            
            if (itemIndex > -1) {
                // Stack it
                newInventory[itemIndex].quantity += 1;
            } else {
                // Add new slot
                newInventory.push({
                    id: result.item,
                    quantity: 1
                });
            }
        }

        // 4. Calculate Stats & Leveling
        let newXp = (data.experience || 0) + result.experience;
        let newStones = (data.spiritStones || 0) + result.spiritStones;
        let newEnergy = data.energy;
        let newRealmIndex = data.realmIndex || 0;
        let newStageIndex = data.stageIndex || 0;
        let newPoints = data.unallocatedPoints || 0;
        let newXpNeeded = data.experienceNeeded || XP_PER_STAGE;
        let extraMessage = "";

        if (type === 'deep') {
            newEnergy -= DEEP_MEDITATION_COST;
        }

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

        // 5. Update Database
        transaction.update(playerRef, {
            experience: newXp,
            spiritStones: newStones,
            energy: newEnergy,
            realmIndex: newRealmIndex,
            stageIndex: newStageIndex,
            unallocatedPoints: newPoints,
            experienceNeeded: newXpNeeded,
            inventory: newInventory, // Save the updated bag
            lastMeditationTime: type === 'quick' ? now : data.lastMeditationTime,
            lastCooldownDuration: result.cooldown || 5 
        });

        // 6. Return Data to Frontend
        return {
            success: true,
            rewards: {
                experience: result.experience,
                spiritStones: result.spiritStones,
                item: result.item // Pass the ID back so UI can show the loot
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

    // 1. Accept quantity, default to 1
    const { itemId, quantity } = request.data; 
    const qtyToUse = parseInt(quantity) || 1;

    if (qtyToUse < 1) {
        throw new HttpsError('invalid-argument', 'Quantity must be at least 1.');
    }

    const uid = request.auth.uid;
    const playerRef = db.collection('players').doc(uid);

    return await db.runTransaction(async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists) throw new HttpsError('not-found', 'Player not found.');

        const data = playerDoc.data();
        
        // 2. Validate Item
        const itemDef = MASTER_ITEMS[itemId];
        if (!itemDef || itemDef.type !== 'consumable') {
            throw new HttpsError('invalid-argument', 'This item cannot be consumed.');
        }

        // 3. Check Ownership & Quantity
        let inventory = data.inventory || [];
        const itemIndex = inventory.findIndex(i => i.id === itemId);
        
        if (itemIndex === -1 || inventory[itemIndex].quantity < qtyToUse) {
            throw new HttpsError('failed-precondition', 'Not enough items.');
        }

        // 4. Apply the Effect (Multiplied by qtyToUse)
        let updateData = {};
        if (itemDef.effect.type === 'restore_energy') {
            const maxEnergy = 100;
            const energyGain = itemDef.effect.value * qtyToUse;
            updateData.energy = Math.min(maxEnergy, (data.energy || 0) + energyGain);
        }

        // 5. Update Inventory
        if (inventory[itemIndex].quantity > qtyToUse) {
            inventory[itemIndex].quantity -= qtyToUse;
        } else {
            // Remove the item entirely if using all (or somehow more)
            inventory.splice(itemIndex, 1);
        }
        updateData.inventory = inventory;

        transaction.update(playerRef, updateData);
        
        return { 
            success: true, 
            message: `Consumed ${qtyToUse}x ${itemDef.name}` 
        };
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

// Add this to your exports
exports.equipTechnique = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');
    
    const { slotIndex, techniqueId } = request.data;
    const uid = request.auth.uid;
    const playerRef = db.collection('players').doc(uid);

    // Validation
    if (slotIndex < 0 || slotIndex > 4) {
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
            // 1. Do they know it?
            if (!learned.includes(techniqueId)) {
                throw new HttpsError('failed-precondition', 'You have not learned this technique.');
            }
            // 2. Is it already equipped in another slot?
            const existingIndex = equipped.indexOf(techniqueId);
            if (existingIndex > -1 && existingIndex !== slotIndex) {
                // Swap or Clear? Let's just clear the old slot for simplicity
                equipped[existingIndex] = null;
            }
        }

        // Set the new slot
        equipped[slotIndex] = techniqueId;

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

        // 1. Run Simulation
        const result = simulateCombat(playerData, enemyData);

        // 2. Apply Results
        if (result.winner === 'player') {
             const newXp = (playerData.experience || 0) + (result.rewards.exp || 0);
             const newStones = (playerData.spiritStones || 0) + (result.rewards.stones || 0);
             
             // Simple update (You can reuse your existing leveling logic here later)
             transaction.update(playerRef, {
                 experience: newXp,
                 spiritStones: newStones
             });
        }

        // 3. Return Log to Client
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
    // 1. Auth Check
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in.');
    }

    const uid = request.auth.uid;
    const { displayName } = request.data;
    const cleanName = displayName ? displayName.trim() : '';

    // 2. Validation (Server Side is the only one that matters)
    if (!cleanName || cleanName.length < 3 || cleanName.length > 20) {
        throw new HttpsError('invalid-argument', 'Name must be 3-20 characters.');
    }
    if (!/^[a-zA-Z0-9_ ]+$/.test(cleanName)) {
        throw new HttpsError('invalid-argument', 'Invalid characters in name.');
    }

    const playerRef = db.collection('players').doc(uid);
    const usernameRef = db.collection('usernames').doc(cleanName.toLowerCase());

    // 3. Transaction (To handle Name Claiming + Player Creation atomically)
    return await db.runTransaction(async (transaction) => {
        // Check if player already exists
        const playerDoc = await transaction.get(playerRef);
        if (playerDoc.exists) {
            throw new HttpsError('already-exists', 'Character already exists.');
        }

        // Check if username is taken
        const usernameDoc = await transaction.get(usernameRef);
        if (usernameDoc.exists) {
            throw new HttpsError('already-exists', 'This name is taken.');
        }

        // 4. Generate SECURE Data
        const newPlayerData = getNewPlayerData(uid, cleanName);

        // 5. Write to DB
        transaction.set(playerRef, newPlayerData);
        transaction.set(usernameRef, {
            userId: uid,
            displayName: cleanName,
            createdAt: Date.now()
        });

        return { success: true };
    });
});