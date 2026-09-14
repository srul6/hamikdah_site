/**
 * Phone validation aligned with checkout (GreenInvoicePayment.validatePhone).
 * Logical format check only — not SMS verification.
 */

const PHONE_MAX_LENGTH = 25;

/** Same pattern as frontend checkout after stripping spaces/dashes/parens. */
const PHONE_REGEX = /^(?:\+972|972|0)\d{7,10}$|^\+?[1-9]\d{6,14}$/;

function normalizeAndValidatePhone(raw) {
    if (raw == null || typeof raw !== 'string') {
        return { ok: false, reason: 'invalid' };
    }
    const trimmed = raw.trim();
    if (!trimmed) {
        return { ok: false, reason: 'empty' };
    }
    if (trimmed.length > PHONE_MAX_LENGTH) {
        return { ok: false, reason: 'too_long' };
    }
    const cleaned = trimmed.replace(/[\s\-\(\)]/g, '');
    if (!PHONE_REGEX.test(cleaned)) {
        return { ok: false, reason: 'invalid' };
    }
    return { ok: true, phone: trimmed };
}

function normalizeAndValidateName(raw, { minLength = 2, maxLength = 100 } = {}) {
    if (raw == null || typeof raw !== 'string') {
        return { ok: false, reason: 'invalid' };
    }
    const trimmed = raw.trim();
    if (!trimmed) {
        return { ok: false, reason: 'empty' };
    }
    if (trimmed.length < minLength) {
        return { ok: false, reason: 'too_short' };
    }
    if (trimmed.length > maxLength) {
        return { ok: false, reason: 'too_long' };
    }
    return { ok: true, name: trimmed };
}

module.exports = {
    PHONE_MAX_LENGTH,
    PHONE_REGEX,
    normalizeAndValidatePhone,
    normalizeAndValidateName
};
