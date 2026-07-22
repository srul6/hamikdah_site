import Clarity from '@microsoft/clarity';

const CLARITY_PROJECT_ID = process.env.REACT_APP_CLARITY_PROJECT_ID;

let clarityInitialized = false;

export function initClarity() {
    if (typeof window === 'undefined' || !CLARITY_PROJECT_ID) {
        return false;
    }

    if (clarityInitialized) {
        try {
            if (typeof Clarity.consent === 'function') {
                Clarity.consent(true);
            }
        } catch (_) {
            // Ignore
        }
        return true;
    }

    try {
        Clarity.init(CLARITY_PROJECT_ID);
        clarityInitialized = true;
        if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.info('[Consent] Clarity initialized');
        }
        return true;
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.warn('[Consent] Clarity init failed:', error);
        }
        return false;
    }
}

/**
 * Best-effort stop: Clarity has no full teardown; consent(false) when available.
 */
export function disableClarity() {
    if (!clarityInitialized) {
        return;
    }
    try {
        if (typeof Clarity.consent === 'function') {
            Clarity.consent(false);
        }
    } catch (_) {
        // Ignore
    }
}

export function trackClarityPageview(pagePath) {
    if (!clarityInitialized || !CLARITY_PROJECT_ID) {
        return;
    }
    try {
        Clarity.setTag('page', pagePath);
        Clarity.event('pageview');
    } catch (_) {
        // Ignore tagging errors
    }
}

export function isClarityInitialized() {
    return clarityInitialized;
}
