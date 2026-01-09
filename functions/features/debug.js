const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db } = require('../admin');
const MASTER_ITEMS = require('../masterItems');

exports.debugGiveItem = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');

    // OPTIONAL: Security check. 
    // If you plan to release this, uncomment lines below and replace with your User ID.
    // const MY_ADMIN_ID = "YOUR_USER_ID_HERE";
    // if (request.auth.uid !== MY_ADMIN_ID) {
    //    throw new HttpsError('permission-denied', 'Admin only.');
    // }

    const { itemId } = request.data;
    const uid = request.auth.uid;
    const playerRef = db.collection('players').doc(uid);

    // Verify item exists so we don't break the game
    if (!MASTER_ITEMS[itemId]) {
        throw new HttpsError('invalid-argument', `Item ${itemId} does not exist in MASTER_ITEMS.`);
    }

    await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(playerRef);
        if (!doc.exists) throw new HttpsError('not-found', 'No player data');

        const data = doc.data();
        let inventory = data.inventory || [];
        
        const existingIndex = inventory.findIndex(i => i.id === itemId);
        if (existingIndex > -1) {
            inventory[existingIndex].quantity += 1;
        } else {
            inventory.push({ id: itemId, quantity: 1 });
        }

        transaction.update(playerRef, { inventory: inventory });
    });

    return { success: true, message: `Spawned 1x ${MASTER_ITEMS[itemId].name}` };
});