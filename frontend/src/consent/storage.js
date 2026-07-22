import { setCookie, getCookie, deleteCookie } from '../utils/cookieManager';
import { CONSENT_VERSION, DEFAULT_CONSENT } from './categories';

const CONSENT_COOKIE = 'hamikdash_cookie_consent';
/** 12 months — typical consent retention window */
const CONSENT_EXPIRY_DAYS = 365;

/**
 * @returns {object|null} Saved consent or null if none / invalid
 */
export function loadConsent() {
    const stored = getCookie(CONSENT_COOKIE);
    if (!stored || typeof stored !== 'object') {
        return null;
    }

    if (stored.version !== CONSENT_VERSION) {
        return null;
    }

    if (typeof stored.analytics !== 'boolean' || typeof stored.advertising !== 'boolean') {
        return null;
    }

    return {
        ...DEFAULT_CONSENT,
        analytics: stored.analytics,
        advertising: stored.advertising,
        essential: true,
        version: CONSENT_VERSION,
        timestamp: stored.timestamp || null,
        decided: true
    };
}

/**
 * Persist consent preferences.
 * @param {{ analytics: boolean, advertising: boolean }} prefs
 */
export function saveConsent(prefs) {
    const payload = {
        version: CONSENT_VERSION,
        essential: true,
        analytics: Boolean(prefs.analytics),
        advertising: Boolean(prefs.advertising),
        timestamp: Date.now(),
        decided: true
    };

    setCookie(CONSENT_COOKIE, payload, CONSENT_EXPIRY_DAYS);
    return payload;
}

export function clearConsent() {
    deleteCookie(CONSENT_COOKIE);
}
