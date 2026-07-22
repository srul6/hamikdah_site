/**
 * Browser-side debugging (console, Ads flow, consent, etc.).
 *
 * Enabled when:
 * - local CRA / development build, OR
 * - the Render frontend static host below
 *
 * Muted on the real production domain (e.g. bmikdash.com).
 */
const RENDER_DEBUG_HOST = 'hamikdah-site-fronteand.onrender.com';

export function isBrowserDebugEnabled() {
    if (process.env.NODE_ENV === 'development') {
        return true;
    }
    if (typeof window === 'undefined') {
        return false;
    }
    return window.location.hostname === RENDER_DEBUG_HOST;
}
