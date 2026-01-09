const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db } = require('../admin');
const MASTER_ITEMS = require('../masterItems');
const { calculatePassiveRegen } = require('../meditationSystem');

const addToInventory = (inventory, itemId, quantity = 1) => {
    const existingIndex = inventory.findIndex(i => i.id === itemId);
    if (existingIndex > -1) {
        inventory[existingIndex].quantity += quantity;
    } else {
        inventory.push({ id: itemId, quantity });
    }
    return inventory;
};

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
        
        // 1. Handle Passive Regen
        const regenData = calculatePassiveRegen(data);
        let currentEnergy = regenData.energy;
        const newLastEnergyUpdate = regenData.lastEnergyUpdate;
        
        const itemDef = MASTER_ITEMS[itemId];

        // 2. Validate Item Type (Now allows 'manual')
        const ALLOWED_TYPES = ['consumable', 'manual'];
        if (!itemDef || !ALLOWED_TYPES.includes(itemDef.type)) {
            throw new HttpsError('invalid-argument', 'This item cannot be used.');
        }

        // 3. Check Inventory Quantity
        let inventory = data.inventory || [];
        const itemIndex = inventory.findIndex(i => i.id === itemId);
        
        if (itemIndex === -1 || inventory[itemIndex].quantity < qtyToUse) {
            throw new HttpsError('failed-precondition', 'Not enough items.');
        }

        // 4. Handle Effects
        let successMessage = '';
        let actualQtyUsed = qtyToUse;
        let newLearnedTechniques = null;

        // A. Manuals / Technique Learning
        if (itemDef.type === 'manual' && itemDef.effect.type === 'learn_technique') {
            actualQtyUsed = 1; // Always use exactly 1 book regardless of request
            const learned = data.learnedTechniques || [];
            const techId = itemDef.effect.value;

            if (learned.includes(techId)) {
                throw new HttpsError('failed-precondition', 'You have already learned this technique.');
            }

            // Add technique to list
            newLearnedTechniques = [...learned, techId];
            successMessage = `You studied the ${itemDef.name} and learned a new technique!`;
        }
        // B. Energy Consumables
        else if (itemDef.effect.type === 'restore_energy') {
            const maxEnergy = 100;
            const energyGain = itemDef.effect.value * qtyToUse;
            currentEnergy = Math.min(maxEnergy, currentEnergy + energyGain);
            successMessage = `Consumed ${qtyToUse}x ${itemDef.name}`;
        }

        // 5. Remove Items from Inventory
        if (inventory[itemIndex].quantity > actualQtyUsed) {
            inventory[itemIndex].quantity -= actualQtyUsed;
        } else {
            inventory.splice(itemIndex, 1);
        }

        // 6. Prepare Updates
        const updates = {
            inventory: inventory,
            energy: currentEnergy,
            lastEnergyUpdate: newLastEnergyUpdate
        };

        // Only update learnedTechniques if it changed
        if (newLearnedTechniques) {
            updates.learnedTechniques = newLearnedTechniques;
        }

        transaction.update(playerRef, updates);
        
        return { success: true, message: successMessage };
    });
});

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

        transaction.update(playerRef, { inventory: inventory, equipment: equipment });

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

        transaction.update(playerRef, { inventory: inventory, equipment: equipment });
        return { success: true, message: 'Item unequipped.' };
    });
});