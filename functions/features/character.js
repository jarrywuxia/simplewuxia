const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db } = require('../admin');
const { getNewPlayerData } = require('../playerTemplate');
const { isTextProfane } = require('../utils');

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

        if (statName === 'maxHp') updateData[`stats.${statName}`] = currentStatValue + 20;
        if (statName === 'qi') updateData[`stats.${statName}`] = currentStatValue + 10;

        transaction.update(playerRef, updateData);
        return { success: true, newStatValue: currentStatValue + 1 };
    });
});