const crypto = require('crypto');

/** Prefix for newsletter-signup coupons (generateCouponCode). Do not use discount value to detect. */
const NEWSLETTER_COUPON_PREFIX = 'WELCOME';

function randomToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}

function generateCouponCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = NEWSLETTER_COUPON_PREFIX;
    for (let i = 0; i < 8; i += 1) {
        out += alphabet[crypto.randomInt(0, alphabet.length)];
    }
    return out;
}

module.exports = {
    randomToken,
    generateCouponCode,
    NEWSLETTER_COUPON_PREFIX
};
