const admin = require("firebase-admin");
const { getDatabase } = require('firebase-admin/database');

// Check if already initialized to prevent errors during hot-reload/testing
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const rtdb = getDatabase();

module.exports = { admin, db, rtdb };