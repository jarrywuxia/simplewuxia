// functions/index.js

const { meditate } = require('./features/meditation');
const { createCharacter, allocateStat } = require('./features/character');
const { useItem, equipItem, unequipItem } = require('./features/inventory');
const { equipTechnique, pveFight } = require('./features/combat');
const { sendChatMessage, cleanupChat } = require('./features/chat');
const { debugGiveItem } = require('./features/debug'); 

// --- IMPORT NEW FEATURE ---
const { travel, exploreLocation } = require('./features/exploration');
const { buyItem } = require('./features/shop'); // Import new feature

// --- EXPORT FUNCTIONS ---

// Meditation
exports.meditate = meditate;

// Character
exports.createCharacter = createCharacter;
exports.allocateStat = allocateStat;

// Inventory
exports.useItem = useItem;
exports.equipItem = equipItem;
exports.unequipItem = unequipItem;

// Combat
exports.equipTechnique = equipTechnique;
exports.pveFight = pveFight;

// Chat
exports.sendChatMessage = sendChatMessage;
exports.cleanupChat = cleanupChat;

// Debug
exports.debugGiveItem = debugGiveItem;

// --- NEW EXPORTS ---
exports.travel = travel;
exports.exploreLocation = exploreLocation;

exports.buyItem = buyItem; // Export new function