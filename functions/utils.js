const Filter = require('bad-words');
const filter = new Filter();
const MASTER_ITEMS = require('./masterItems');

const BAD_WORDS_LIST = [
    'fuck', 'nigger', 'nigga', 'cunt', 'bitch', 'whore', 
    'faggot', 'shit', 'slut', 'asshole'
];

const generateStrictPattern = (word) => {
    const pattern = word.split('').join('[\\W_]*');
    return new RegExp(pattern, 'gi');
};

const STRICT_PATTERNS = BAD_WORDS_LIST.map(generateStrictPattern);

exports.cleanTextSecurely = (text) => {
    let cleaned = text;
    try {
        if (filter.isProfane(cleaned)) cleaned = filter.clean(cleaned);
    } catch (e) {}

    STRICT_PATTERNS.forEach(pattern => {
        cleaned = cleaned.replace(pattern, (match) => '*'.repeat(match.length));
    });
    return cleaned;
};

exports.isTextProfane = (text) => {
    if (filter.isProfane(text)) return true;
    return STRICT_PATTERNS.some(pattern => pattern.test(text));
};

// Calculates total stats by combining Base Stats + Equipment Stats
exports.calculateTotalStats = (playerData) => {
    let total = { ...playerData.stats };
    if (total.evasion === undefined) total.evasion = 0;

    const equipment = playerData.equipment || {};
    for (const slot in equipment) {
        const itemId = equipment[slot];
        if (itemId) {
            const itemDef = MASTER_ITEMS[itemId];
            if (itemDef && itemDef.stats) {
                for (const [stat, value] of Object.entries(itemDef.stats)) {
                    total[stat] = (total[stat] || 0) + value;
                }
            }
        }
    }
    return total;
};