/**
 * Shared coupon apply math — used by /api/coupons/apply and checkout re-validation.
 */

const { NEWSLETTER_COUPON_PREFIX } = require('./newsletterTokens');

/**
 * Newsletter-signup coupons only.
 * Primary marker: coupons.subscriber_id (set only by newsletterService).
 * Fallback: code prefix WELCOME (generateCouponCode) — never the discount value.
 */
function isNewsletterCoupon(coupon) {
    if (!coupon) return false;
    if (coupon.subscriberId != null && coupon.subscriberId !== '') return true;
    const code = String(coupon.code || '').toUpperCase().trim();
    return code.startsWith(NEWSLETTER_COUPON_PREFIX);
}

const BUNDLE_COUPON_REJECT_HE = 'קופון זה אינו תקף על באנדלים';

function computeCouponDiscount(coupon, totalAmount) {
    if (!coupon || !coupon.isActive) {
        return { ok: false, error: 'inactive' };
    }

    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    // Include full validUntil day
    if (!Number.isNaN(validUntil.getTime())) {
        validUntil.setHours(23, 59, 59, 999);
    }

    if (Number.isNaN(validFrom.getTime()) || Number.isNaN(validUntil.getTime()) || now < validFrom || now > validUntil) {
        return { ok: false, error: 'expired' };
    }

    if (coupon.usageCount >= coupon.maxUsage) {
        return { ok: false, error: 'limit' };
    }

    const total = parseFloat(totalAmount);
    if (Number.isNaN(total) || total < 0) {
        return { ok: false, error: 'invalid_total' };
    }

    if (total < coupon.minAmount) {
        return { ok: false, error: 'min_amount', minAmount: coupon.minAmount };
    }

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
        discountAmount = (total * coupon.discount) / 100;
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    } else {
        discountAmount = Math.min(coupon.discount, coupon.maxDiscount);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalAmount = Math.max(0, Math.round((total - discountAmount) * 100) / 100);

    return {
        ok: true,
        discountAmount,
        finalAmount,
        originalAmount: total
    };
}

module.exports = {
    computeCouponDiscount,
    isNewsletterCoupon,
    BUNDLE_COUPON_REJECT_HE,
    NEWSLETTER_COUPON_PREFIX
};
