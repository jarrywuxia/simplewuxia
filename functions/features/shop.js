// functions/features/shop.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db } = require('../admin');
const MASTER_ITEMS = require('../masterItems');

// Hardcoded shop data for backend validation (Simpler than DB for now)
const SHOPS = {
  'village_merchant': [
      { itemId: 'spirit_pill_low', price: 10 },
      { itemId: 'wooden_sword', price: 50 },
      { itemId: 'canvas_robe', price: 50 },
      { itemId: 'leather_boots', price: 100 }
  ],
  'hermit_trader': [
      { itemId: 'iron_saber', price: 250 },
      { itemId: 'gale_palm_manual', price: 500 }
  ]
};

exports.buyItem = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');
    
    const { shopId, itemId } = request.data;
    const uid = request.auth.uid;
    const playerRef = db.collection('players').doc(uid);

    // 1. Validate Shop & Item
    const shopStock = SHOPS[shopId];
    if (!shopStock) throw new HttpsError('not-found', 'Shop not found.');

    const listing = shopStock.find(i => i.itemId === itemId);
    if (!listing) throw new HttpsError('not-found', 'Item not sold here.');

    const itemDef = MASTER_ITEMS[itemId];
    if (!itemDef) throw new HttpsError('internal', 'Item definition missing.');

    return await db.runTransaction(async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists) throw new HttpsError('not-found', 'Player not found.');

        const data = playerDoc.data();
        
        // 2. Validate Location (Must be in same location as shop?)
        // skipped for simplicity, but good for anti-cheat later.

        // 3. Check Funds
        if ((data.spiritStones || 0) < listing.price) {
            throw new HttpsError('failed-precondition', 'Not enough Spirit Stones.');
        }

        // 4. Update Inventory
        let inventory = data.inventory || [];
        const existingIndex = inventory.findIndex(i => i.id === itemId);
        
        if (existingIndex > -1) {
            inventory[existingIndex].quantity += 1;
        } else {
            inventory.push({ id: itemId, quantity: 1 });
        }

        // 5. Deduct Cost & Save
        transaction.update(playerRef, {
            spiritStones: data.spiritStones - listing.price,
            inventory: inventory
        });

        return { 
            success: true, 
            message: `Purchased ${itemDef.name} for ${listing.price} Spirit Stones.`,
            newBalance: data.spiritStones - listing.price
        };
    });
});