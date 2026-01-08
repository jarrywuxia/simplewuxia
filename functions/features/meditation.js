const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db, rtdb } = require('../admin');
const { REALMS, XP_PER_STAGE, STAT_POINTS_PER_STAGE, DEEP_MEDITATION_COST } = require('../constants');
const { generateQuickMeditationReward, generateDeepMeditationReward, calculatePassiveRegen } = require('../meditationSystem');

exports.meditate = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'You must be logged in.');

    const uid = request.auth.uid;
    const type = request.data.type || 'quick'; 
    const now = Date.now();
    
    const cooldownRef = rtdb.ref(`meditationState/${uid}`);
    const cooldownSnap = await cooldownRef.once('value');
    const cooldownData = cooldownSnap.val() || { unlockTime: 0 };

    if (type === 'quick') {
        if (now < cooldownData.unlockTime) {
            throw new HttpsError('resource-exhausted', 'Meditation is on cooldown.');
        }
    }

    const playerRef = db.collection('players').doc(uid);

    if (type !== 'quick' && type !== 'deep') {
        throw new HttpsError('invalid-argument', 'Invalid meditation type.');
    }

    return await db.runTransaction(async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists) throw new HttpsError('not-found', 'Character not found.');

        const data = playerDoc.data();
        const regenData = calculatePassiveRegen(data);
        let currentEnergy = regenData.energy;
        const newLastEnergyUpdate = regenData.lastEnergyUpdate;

        if (type === 'deep') {
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

        const duration = (result.cooldown || 5) * 1000;
        const newUnlockTime = now + duration;

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

        cooldownRef.set({ unlockTime: newUnlockTime });

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