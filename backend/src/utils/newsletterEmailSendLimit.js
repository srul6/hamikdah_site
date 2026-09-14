/**
 * Pure helpers for newsletter confirmation-email rate limits (per address).
 * Survives subscriber row delete/recreate — callers store state by email key.
 */

const NEWSLETTER_EMAIL_SEND_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes
const NEWSLETTER_EMAIL_SEND_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const NEWSLETTER_EMAIL_SEND_MAX_PER_WINDOW = 5;

/**
 * @param {{ last_sent_at?: Date|string|null, window_started_at?: Date|string|null, send_count_in_window?: number }|null} row
 * @param {number} [nowMs]
 * @returns {{ allowed: boolean, reason?: 'cooldown'|'cap', nextCount: number, windowStartedAt: Date, lastSentAt: Date }}
 */
function evaluateNewsletterEmailSendGate(row, nowMs = Date.now()) {
    const now = new Date(nowMs);
    const lastSentAt = row?.last_sent_at ? new Date(row.last_sent_at) : null;
    let windowStartedAt = row?.window_started_at ? new Date(row.window_started_at) : null;
    let sendCount = Number(row?.send_count_in_window) || 0;

    if (lastSentAt && !Number.isNaN(lastSentAt.getTime())) {
        const elapsed = nowMs - lastSentAt.getTime();
        if (elapsed < NEWSLETTER_EMAIL_SEND_COOLDOWN_MS) {
            return {
                allowed: false,
                reason: 'cooldown',
                nextCount: sendCount,
                windowStartedAt: windowStartedAt || now,
                lastSentAt
            };
        }
    }

    const windowExpired =
        !windowStartedAt ||
        Number.isNaN(windowStartedAt.getTime()) ||
        nowMs - windowStartedAt.getTime() >= NEWSLETTER_EMAIL_SEND_WINDOW_MS;

    if (windowExpired) {
        windowStartedAt = now;
        sendCount = 0;
    }

    if (sendCount >= NEWSLETTER_EMAIL_SEND_MAX_PER_WINDOW) {
        return {
            allowed: false,
            reason: 'cap',
            nextCount: sendCount,
            windowStartedAt,
            lastSentAt: lastSentAt || now
        };
    }

    return {
        allowed: true,
        nextCount: sendCount + 1,
        windowStartedAt,
        lastSentAt: now
    };
}

module.exports = {
    NEWSLETTER_EMAIL_SEND_COOLDOWN_MS,
    NEWSLETTER_EMAIL_SEND_WINDOW_MS,
    NEWSLETTER_EMAIL_SEND_MAX_PER_WINDOW,
    evaluateNewsletterEmailSendGate
};
