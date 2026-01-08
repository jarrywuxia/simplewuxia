const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db } = require('../admin');
const { ENEMIES } = require('../combat/enemies');
const { simulateCombat } = require('../combat/simulator');
const { calculatePassiveRegen } = require('../meditationSystem');
const { calculateTotalStats } = require('../utils');

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

        // 1. Calculate REAL Stats (Base + Equipment)
        const battleStats = calculateTotalStats(playerData);
        
        const playerBattleData = { ...playerData, stats: battleStats };

        const regenData = calculatePassiveRegen(playerData);
        let currentEnergy = regenData.energy;
        const ENERGY_COST = 5;

        if (currentEnergy < ENERGY_COST) {
            throw new HttpsError('failed-precondition', 'Not enough energy to fight (Cost: 5).');
        }

        const result = simulateCombat(playerBattleData, enemyData);

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