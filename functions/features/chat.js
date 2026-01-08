const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { db, rtdb } = require('../admin');
const { cleanTextSecurely } = require('../utils');

exports.sendChatMessage = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');
    
    const text = request.data.text;
    if (!text || typeof text !== 'string' || text.length > 150) {
        throw new HttpsError('invalid-argument', 'Invalid message.');
    }

    const cleanText = cleanTextSecurely(text);
    const uid = request.auth.uid;
    const now = Date.now();

    const rateLimitRef = rtdb.ref(`chatRateLimits/${uid}`);
    const rateLimitSnap = await rateLimitRef.once('value');
    const lastChatTime = rateLimitSnap.val() || 0;

    if (now - lastChatTime < 2000) {
        throw new HttpsError('resource-exhausted', 'You are chatting too fast.');
    }

    const playerRef = db.collection('players').doc(uid);
    const playerSnap = await playerRef.get();
    
    if (!playerSnap.exists) throw new HttpsError('not-found', 'No character.');
    const playerData = playerSnap.data();

    const chatRef = rtdb.ref('globalChat');
    const newMessageRef = chatRef.push();
    
    const updates = {};
    updates[`globalChat/${newMessageRef.key}`] = {
        text: cleanText,
        senderName: playerData.displayName,
        senderRealm: playerData.realmIndex,
        userId: uid,
        timestamp: now
    };
    updates[`chatRateLimits/${uid}`] = now;

    await rtdb.ref().update(updates);
    return { success: true };
});

exports.cleanupChat = onSchedule("every day 00:00", async (event) => {
    const chatRef = rtdb.ref('globalChat');
    const rateLimitRef = rtdb.ref('chatRateLimits');
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);

    const oldMessagesSnap = await chatRef.orderByChild('timestamp').endAt(cutoff).once('value');
    
    const updates = {};
    let count = 0;

    oldMessagesSnap.forEach((child) => {
        updates[`globalChat/${child.key}`] = null; 
        count++;
    });

    const ratesSnap = await rateLimitRef.once('value');
    ratesSnap.forEach((child) => {
        if (child.val() < cutoff) {
            updates[`chatRateLimits/${child.key}`] = null;
        }
    });

    if (Object.keys(updates).length > 0) {
        await rtdb.ref().update(updates);
        console.log(`Janitor deleted ${count} old messages.`);
    }
});