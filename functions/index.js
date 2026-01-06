const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// --- IMPORT THE NEW SYSTEM ---
const { generateQuickMeditationReward, generateDeepMeditationReward } = require('./meditationSystem');

admin.initializeApp();
const db = admin.firestore();

// --- GAME CONSTANTS ---
// Keep this list here for the Level Up logic
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
    // 1. Auth Check
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in.');
    }

    const uid = request.auth.uid;
    const type = request.data.type || 'quick'; 
    const playerRef = db.collection('players').doc(uid);

    console.log(`Player ${uid} attempting meditation: ${type}`);

    // 2. Run Transaction
    return await db.runTransaction(async (transaction) => {
        const playerDoc = await transaction.get(playerRef);
        
        if (!playerDoc.exists) {
            throw new HttpsError('not-found', 'Character not found.');
        }

        const data = playerDoc.data();
        const now = Date.now();

        // 3. Validation (Cooldown & Energy)
        if (type === 'quick') {
            const lastTime = data.lastMeditationTime || 0;
            // IMPORTANT: Get the cooldown from the DB. 
            // If it's missing (first time), default to 5 seconds.
            const cooldown = (data.lastCooldownDuration || 5) * 1000; 
            
            if (now - lastTime < cooldown - 500) { // 500ms buffer
                throw new HttpsError('failed-precondition', 'Meditation is on cooldown.');
            }
        } else if (type === 'deep') {
            if (data.energy < DEEP_MEDITATION_COST) {
                throw new HttpsError('failed-precondition', 'Not enough energy.');
            }
        }

        // 4. GENERATE REWARDS (Using the new file)
        let result;
        if (type === 'quick') {
            result = generateQuickMeditationReward(data);
        } else {
            result = generateDeepMeditationReward(data);
        }

        // 5. Apply Stats
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

        // 6. Check Level Up
        if (newXp >= newXpNeeded) {
            const currentRealm = REALMS[newRealmIndex];
            
            if (currentRealm) { // Safety check
                if (newStageIndex + 1 < currentRealm.stages.length) {
                    // Stage Up
                    newStageIndex++;
                    newXp -= newXpNeeded;
                    extraMessage = ` Advanced to ${currentRealm.stages[newStageIndex]}!`;
                } else if (newRealmIndex + 1 < REALMS.length) {
                    // Realm Up
                    newRealmIndex++;
                    newStageIndex = 0;
                    newXp -= newXpNeeded;
                    newXpNeeded = XP_PER_STAGE * (newRealmIndex + 1);
                    extraMessage = ` BREAKTHROUGH to ${REALMS[newRealmIndex].name}!`;
                    newPoints += STAT_POINTS_PER_STAGE; // Bonus for Realm up?
                }
                newPoints += STAT_POINTS_PER_STAGE;
            }
        }

        // 7. Save to Database
        transaction.update(playerRef, {
            experience: newXp,
            spiritStones: newStones,
            energy: newEnergy,
            realmIndex: newRealmIndex,
            stageIndex: newStageIndex,
            unallocatedPoints: newPoints,
            experienceNeeded: newXpNeeded,
            lastMeditationTime: type === 'quick' ? now : data.lastMeditationTime,
            // Save the cooldown from the event so the frontend knows how long to wait next time
            lastCooldownDuration: result.cooldown || 5 
        });

        // 8. Reply to Client
        return {
            success: true,
            rewards: {
                experience: result.experience,
                spiritStones: result.spiritStones
            },
            message: result.message + extraMessage,
            cooldown: result.cooldown || 0
        };
    });
});