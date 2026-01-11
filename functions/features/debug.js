// functions/features/debug.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db } = require('../admin');
const MASTER_ITEMS = require('../masterItems');
const { TECHNIQUE_REGISTRY } = require('../combat/techniques'); // Import Techniques

exports.debugGiveItem = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');

    // We treat 'itemId' as a generic ID (could be item OR technique)
    const { itemId } = request.data;
    const uid = request.auth.uid;
    const playerRef = db.collection('players').doc(uid);

    return await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(playerRef);
        if (!doc.exists) throw new HttpsError('not-found', 'No player data');
        const data = doc.data();

        // --- CASE 1: IT IS AN ITEM ---
        if (MASTER_ITEMS[itemId]) {
            let inventory = data.inventory || [];
            
            const existingIndex = inventory.findIndex(i => i.id === itemId);
            if (existingIndex > -1) {
                inventory[existingIndex].quantity += 1;
            } else {
                inventory.push({ id: itemId, quantity: 1 });
            }

            transaction.update(playerRef, { inventory: inventory });
            return { success: true, message: `Spawned Item: ${MASTER_ITEMS[itemId].name}` };
        }

        // --- CASE 2: IT IS A TECHNIQUE ---
        if (TECHNIQUE_REGISTRY[itemId]) {
            let learned = data.learnedTechniques || [];

            if (learned.includes(itemId)) {
                return { success: true, message: `You already know: ${TECHNIQUE_REGISTRY[itemId].name}` };
            }

            learned.push(itemId);
            transaction.update(playerRef, { learnedTechniques: learned });
            return { success: true, message: `Learned Technique: ${TECHNIQUE_REGISTRY[itemId].name}` };
        }

        // --- CASE 3: UNKNOWN ID ---
        throw new HttpsError('invalid-argument', `ID '${itemId}' is not a valid Item or Technique.`);
    });
});