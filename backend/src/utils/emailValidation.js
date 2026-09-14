/**
 * Server-side email validation helpers for newsletter signup.
 * Never rely on client-side maxlength / type="email" alone.
 */

const EMAIL_MAX_LENGTH = 254; // RFC 5321

// Practical email check — aligned with checkout frontend validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

/**
 * @param {unknown} raw
 * @returns {{ ok: true, email: string } | { ok: false, reason: string }}
 */
function normalizeAndValidateEmail(raw) {
    if (raw === undefined || raw === null) {
        return { ok: false, reason: 'missing' };
    }
    if (typeof raw !== 'string') {
        return { ok: false, reason: 'invalid_type' };
    }

    const email = raw.trim().toLowerCase();
    if (!email) {
        return { ok: false, reason: 'empty' };
    }
    if (email.length > EMAIL_MAX_LENGTH) {
        return { ok: false, reason: 'too_long' };
    }
    if (email.includes(' ') || email.includes('\n') || email.includes('\r')) {
        return { ok: false, reason: 'invalid_format' };
    }
    if (!EMAIL_REGEX.test(email)) {
        return { ok: false, reason: 'invalid_format' };
    }

    return { ok: true, email };
}

module.exports = {
    EMAIL_MAX_LENGTH,
    EMAIL_REGEX,
    normalizeAndValidateEmail
};
