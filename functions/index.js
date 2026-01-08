// functions/index.js

const { meditate } = require('./features/meditation');
const { createCharacter, allocateStat } = require('./features/character');
const { useItem, equipItem, unequipItem } = require('./features/inventory');
const { equipTechnique, pveFight } = require('./features/combat');
const { sendChatMessage, cleanupChat } = require('./features/chat');

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