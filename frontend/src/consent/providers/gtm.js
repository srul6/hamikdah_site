const GTM_ID = process.env.REACT_APP_GTM_ID || 'GTM-N8G5ZP2F';

let gtmLoaded = false;

function ensureDataLayer() {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
        window.gtag = function gtag() {
            // eslint-disable-next-line prefer-rest-params
            window.dataLayer.push(arguments);
        };
    }
    return window.gtag;
}

/**
 * Push Google Consent Mode defaults (denied) before any Google tags load.
 * Safe to call multiple times.
 */
export function setDefaultConsentDenied() {
    if (typeof window === 'undefined') {
        return;
    }
    const gtag = ensureDataLayer();
    if (window.__giConsentDefaultSet) {
        return;
    }
    gtag('consent', 'default', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        wait_for_update: 500
    });
    window.__giConsentDefaultSet = true;
}

/**
 * Update Google Consent Mode based on category grants.
 */
export function updateGoogleConsentMode({ analytics, advertising }) {
    if (typeof window === 'undefined') {
        return;
    }
    const gtag = ensureDataLayer();
    gtag('consent', 'update', {
        analytics_storage: analytics ? 'granted' : 'denied',
        ad_storage: advertising ? 'granted' : 'denied',
        ad_user_data: advertising ? 'granted' : 'denied',
        ad_personalization: advertising ? 'granted' : 'denied'
    });
}

/**
 * Load GTM only after analytics consent. No-ops if already loaded or ID missing.
 */
export function initGtm() {
    if (typeof window === 'undefined' || !GTM_ID || gtmLoaded) {
        return false;
    }

    if (document.querySelector(`script[src*="googletagmanager.com/gtm.js?id=${GTM_ID}"]`)) {
        gtmLoaded = true;
        return true;
    }

    ensureDataLayer();
    window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
    document.head.appendChild(script);

    gtmLoaded = true;

    if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.info('[Consent] GTM loaded:', GTM_ID);
    }

    return true;
}

/**
 * GTM cannot be fully unloaded; Consent Mode denial (via manager) stops storage use.
 */
export function disableGtm() {
    // No script teardown — consent manager updates Google Consent Mode.
}

export function isGtmLoaded() {
    return gtmLoaded;
}

export function getGtmId() {
    return GTM_ID;
}
