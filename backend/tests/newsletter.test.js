const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeAndValidateEmail, EMAIL_MAX_LENGTH } = require('../src/utils/emailValidation');
const { computeCouponDiscount } = require('../src/utils/couponApply');
const { generateCouponCode, GENERIC_SUBSCRIBE_MESSAGE } = require('../src/services/newsletterService');
const {
    evaluateNewsletterEmailSendGate,
    NEWSLETTER_EMAIL_SEND_COOLDOWN_MS,
    NEWSLETTER_EMAIL_SEND_MAX_PER_WINDOW,
    NEWSLETTER_EMAIL_SEND_WINDOW_MS
} = require('../src/utils/newsletterEmailSendLimit');

describe('email validation (server-side)', () => {
    it('accepts a normal email and lowercases it', () => {
        const result = normalizeAndValidateEmail('  User@Example.COM ');
        assert.equal(result.ok, true);
        assert.equal(result.email, 'user@example.com');
    });

    it('rejects missing / empty / non-string', () => {
        assert.equal(normalizeAndValidateEmail(null).ok, false);
        assert.equal(normalizeAndValidateEmail('').ok, false);
        assert.equal(normalizeAndValidateEmail(123).ok, false);
    });

    it('rejects emails longer than RFC 5321 limit', () => {
        const tooLong = `${'a'.repeat(250)}@example.com`;
        assert.ok(tooLong.length > EMAIL_MAX_LENGTH);
        assert.equal(normalizeAndValidateEmail(tooLong).reason, 'too_long');
    });

    it('rejects strings that only contain @ without a real domain', () => {
        assert.equal(normalizeAndValidateEmail('not-an-email').ok, false);
        assert.equal(normalizeAndValidateEmail('a@b').ok, false);
        assert.equal(normalizeAndValidateEmail('a@b.c').ok, false);
        assert.equal(normalizeAndValidateEmail('a@b.co').ok, true);
    });
});

describe('phone / name validation (newsletter subscribe)', () => {
    const {
        normalizeAndValidatePhone,
        normalizeAndValidateName
    } = require('../src/utils/phoneValidation');

    it('accepts Israeli and international phone formats', () => {
        assert.equal(normalizeAndValidatePhone('050-123-4567').ok, true);
        assert.equal(normalizeAndValidatePhone('+972501234567').ok, true);
        assert.equal(normalizeAndValidatePhone('972501234567').ok, true);
        assert.equal(normalizeAndValidatePhone('+14155552671').ok, true);
    });

    it('rejects empty or nonsense phone numbers', () => {
        assert.equal(normalizeAndValidatePhone('').ok, false);
        assert.equal(normalizeAndValidatePhone('123').ok, false);
        assert.equal(normalizeAndValidatePhone('abcdef').ok, false);
    });

    it('requires a reasonable name length', () => {
        assert.equal(normalizeAndValidateName('A').ok, false);
        assert.equal(normalizeAndValidateName('Ab').ok, true);
        assert.equal(normalizeAndValidateName('  Dana  ').name, 'Dana');
    });
});

describe('duplicate signup messaging', () => {
    it('exposes a generic subscribe success message for anti-enumeration', () => {
        assert.match(GENERIC_SUBSCRIBE_MESSAGE, /confirmation link/i);
    });
});

describe('coupon generation uniqueness', () => {
    it('generates NEWS-prefixed codes that are unique across many draws', () => {
        const set = new Set();
        for (let i = 0; i < 200; i += 1) {
            const code = generateCouponCode();
            assert.match(code, /^NEWS[A-Z0-9]{8}$/);
            set.add(code);
        }
        assert.equal(set.size, 200);
    });
});

describe('coupon single-use enforcement (computeCouponDiscount)', () => {
    const baseCoupon = {
        code: 'NEWSABC12345',
        discount: 5,
        type: 'percentage',
        minAmount: 0,
        maxDiscount: 99999,
        validFrom: '2020-01-01',
        validUntil: '2099-12-31',
        isActive: true,
        usageCount: 0,
        maxUsage: 1
    };

    it('applies an active single-use coupon', () => {
        const result = computeCouponDiscount(baseCoupon, 200);
        assert.equal(result.ok, true);
        assert.equal(result.discountAmount, 10);
        assert.equal(result.finalAmount, 190);
    });

    it('rejects a coupon that already reached max usage', () => {
        const used = { ...baseCoupon, usageCount: 1, isActive: true };
        const result = computeCouponDiscount(used, 200);
        assert.equal(result.ok, false);
        assert.equal(result.error, 'limit');
    });

    it('rejects an inactive coupon (pre-verification newsletter codes)', () => {
        const inactive = { ...baseCoupon, isActive: false };
        const result = computeCouponDiscount(inactive, 200);
        assert.equal(result.ok, false);
        assert.equal(result.error, 'inactive');
    });

    it('rejects null coupon the same way checkout would for a missing code', () => {
        const result = computeCouponDiscount(null, 200);
        assert.equal(result.ok, false);
        assert.equal(result.error, 'inactive');
    });

    it('rejects an expired coupon', () => {
        const expired = { ...baseCoupon, validUntil: '2020-01-02' };
        const result = computeCouponDiscount(expired, 200);
        assert.equal(result.ok, false);
        assert.equal(result.error, 'expired');
    });
});

describe('newsletter per-email send gate', () => {
    const now = Date.parse('2026-09-08T12:00:00.000Z');

    it('allows the first send with no prior row', () => {
        const result = evaluateNewsletterEmailSendGate(null, now);
        assert.equal(result.allowed, true);
        assert.equal(result.nextCount, 1);
    });

    it('blocks sends inside the cooldown window', () => {
        const result = evaluateNewsletterEmailSendGate(
            {
                last_sent_at: new Date(now - NEWSLETTER_EMAIL_SEND_COOLDOWN_MS + 1000),
                window_started_at: new Date(now - 60_000),
                send_count_in_window: 1
            },
            now
        );
        assert.equal(result.allowed, false);
        assert.equal(result.reason, 'cooldown');
    });

    it('allows a send after the cooldown elapses', () => {
        const result = evaluateNewsletterEmailSendGate(
            {
                last_sent_at: new Date(now - NEWSLETTER_EMAIL_SEND_COOLDOWN_MS - 1),
                window_started_at: new Date(now - 60_000),
                send_count_in_window: 1
            },
            now
        );
        assert.equal(result.allowed, true);
        assert.equal(result.nextCount, 2);
    });

    it('blocks after the hard cap in the rolling window', () => {
        const result = evaluateNewsletterEmailSendGate(
            {
                last_sent_at: new Date(now - NEWSLETTER_EMAIL_SEND_COOLDOWN_MS - 1),
                window_started_at: new Date(now - 60_000),
                send_count_in_window: NEWSLETTER_EMAIL_SEND_MAX_PER_WINDOW
            },
            now
        );
        assert.equal(result.allowed, false);
        assert.equal(result.reason, 'cap');
    });

    it('resets the window after 24h and allows another send', () => {
        const result = evaluateNewsletterEmailSendGate(
            {
                last_sent_at: new Date(now - NEWSLETTER_EMAIL_SEND_COOLDOWN_MS - 1),
                window_started_at: new Date(now - NEWSLETTER_EMAIL_SEND_WINDOW_MS - 1),
                send_count_in_window: NEWSLETTER_EMAIL_SEND_MAX_PER_WINDOW
            },
            now
        );
        assert.equal(result.allowed, true);
        assert.equal(result.nextCount, 1);
    });
});
