const crypto = require('crypto');

function randomToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}

function generateCouponCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = 'WELCOME';
    for (let i = 0; i < 8; i += 1) {
        out += alphabet[crypto.randomInt(0, alphabet.length)];
    }
    return out;
}

module.exports = {
    randomToken,
    generateCouponCode
};
