const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db } = require('../admin');
const { LOCATIONS } = require('../data/locations');
const { ENEMIES } = require('../combat/enemies');
const { simulateCombat } = require('../combat/simulator');
const { calculatePassiveRegen } = require('../meditationSystem');
const { calculateTotalStats } = require('../utils');

// --- HELPER: PICK RANDOM ENEMY ---
const pickRandomEnemy = (locationId) => {
  // SAFETY FIX: If location is invalid, default to Longtian
  const safeLocationId = LOCATIONS[locationId] ? locationId : 'longtian_village';
  const loc = LOCATIONS[safeLocationId];

  if (!loc || !loc.enemies || loc.enemies.length === 0) return null;

  const totalWeight = loc.enemies.reduce((sum, entry) => sum + entry.weight, 0);
  let random = Math.random() * totalWeight;

  for (const entry of loc.enemies) {
    random -= entry.weight;
    if (random <= 0) {
      const enemy = ENEMIES[entry.id];
      // SAFETY FIX: If enemy ID is wrong, return dummy
      return enemy || ENEMIES['training_dummy']; 
    }
  }
  return ENEMIES[loc.enemies[0].id];
};

// --- TRAVEL FUNCTION ---
exports.travel = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');
  
  const { destinationId } = request.data;
  const uid = request.auth.uid;
  const playerRef = db.collection('players').doc(uid);

  return await db.runTransaction(async (transaction) => {
    const playerDoc = await transaction.get(playerRef);
    if (!playerDoc.exists) throw new HttpsError('not-found', 'Player not found.');
    
    const data = playerDoc.data();
    
    // --- CRITICAL FIX FOR YOUR ERROR ---
    // If the player is in an invalid/old location, default to 'longtian_village'
    let currentLocationId = data.currentLocation;
    if (!LOCATIONS[currentLocationId]) {
      console.log(`Player in invalid location '${currentLocationId}', resetting logic to longtian_village`);
      currentLocationId = 'longtian_village';
    }

    const currentLocDef = LOCATIONS[currentLocationId];
    const destLocDef = LOCATIONS[destinationId];

    // Validation
    if (!destLocDef) throw new HttpsError('invalid-argument', 'Invalid destination.');
    
    // Check connections
    if (!currentLocDef.connectedTo.includes(destinationId)) {
       throw new HttpsError('failed-precondition', `Cannot travel from ${currentLocDef.name} to ${destLocDef.name}.`);
    }

    // Check Requirements
    if (destLocDef.requirements) {
        if (destLocDef.requirements.minRealm > (data.realmIndex || 0)) {
            throw new HttpsError('failed-precondition', 'Realm too low to enter.');
        }
    }

    // Update location in DB
    transaction.update(playerRef, { currentLocation: destinationId });
    return { success: true, message: `Traveled to ${destLocDef.name}.`, location: destinationId };
  });
});

// --- EXPLORE FUNCTION ---
exports.exploreLocation = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');
  
  const uid = request.auth.uid;
  const playerRef = db.collection('players').doc(uid);

  return await db.runTransaction(async (transaction) => {
    const playerDoc = await transaction.get(playerRef);
    if (!playerDoc.exists) throw new HttpsError('not-found', 'Player not found.');

    const playerData = playerDoc.data();
    
    // SAFETY FIX: Default to Longtian if location is invalid
    let locationId = playerData.currentLocation;
    if (!LOCATIONS[locationId]) locationId = 'longtian_village';
    
    const enemyData = pickRandomEnemy(locationId);

    if (!enemyData) {
        throw new HttpsError('failed-precondition', 'No enemies in this location.');
    }

    const battleStats = calculateTotalStats(playerData);
    const playerBattleData = { ...playerData, stats: battleStats };
    const regenData = calculatePassiveRegen(playerData);
    let currentEnergy = regenData.energy;
    const ENERGY_COST = 5;

    if (currentEnergy < ENERGY_COST) {
        throw new HttpsError('failed-precondition', 'Not enough energy.');
    }

    const result = simulateCombat(playerBattleData, enemyData);

    let updates = {
        energy: currentEnergy - ENERGY_COST,
        lastEnergyUpdate: regenData.lastEnergyUpdate,
        // If the location was invalid, fix it in the DB now
        currentLocation: locationId 
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
        rewards: result.winner === 'player' ? result.rewards : null,
        enemyName: enemyData.name,
        enemyId: enemyData.id
    };
  });
});