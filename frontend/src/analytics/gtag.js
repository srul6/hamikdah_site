const GOOGLE_ADS_ID = process.env.REACT_APP_GOOGLE_ADS_ID;
const GOOGLE_ADS_CONVERSION_LABEL = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABEL;

const PURCHASE_DEDUP_PREFIX = 'gads_purchase_';

function ensureGtag() {
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
 * Load gtag.js and configure the Google Ads tag once.
 * Safe alongside existing GTM (both share dataLayer).
 * No-ops when REACT_APP_GOOGLE_ADS_ID is missing.
 */
export function initGoogleAds() {
    if (!GOOGLE_ADS_ID || typeof window === 'undefined') {
        return false;
    }

    if (window.__googleAdsInitialized) {
        return true;
    }

    const gtag = ensureGtag();

    const scriptSrc = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_ADS_ID)}`;
    const alreadyLoaded = document.querySelector(`script[src="${scriptSrc}"]`);
    if (!alreadyLoaded) {
        const script = document.createElement('script');
        script.async = true;
        script.src = scriptSrc;
        document.head.appendChild(script);
    }

    gtag('js', new Date());
    gtag('config', GOOGLE_ADS_ID);

    window.__googleAdsInitialized = true;

    if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.info('[Google Ads] gtag configured for', GOOGLE_ADS_ID);
    }

    return true;
}

function wasPurchaseTracked(transactionId) {
    try {
        return Boolean(sessionStorage.getItem(`${PURCHASE_DEDUP_PREFIX}${transactionId}`));
    } catch {
        return false;
    }
}

function markPurchaseTracked(transactionId) {
    try {
        sessionStorage.setItem(`${PURCHASE_DEDUP_PREFIX}${transactionId}`, '1');
    } catch {
        // Ignore storage failures (private mode, etc.)
    }
}

/**
 * Fire a Google Ads purchase conversion once per transaction_id.
 * Returns true if the event was sent.
 */
export function trackPurchaseConversion({ value, currency = 'ILS', transactionId }) {
    if (!GOOGLE_ADS_ID || !GOOGLE_ADS_CONVERSION_LABEL) {
        if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.warn(
                '[Google Ads] Skipping conversion — set REACT_APP_GOOGLE_ADS_ID and REACT_APP_GOOGLE_ADS_CONVERSION_LABEL'
            );
        }
        return false;
    }

    if (!transactionId || value == null || Number.isNaN(Number(value))) {
        if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.warn('[Google Ads] Skipping conversion — missing value or transactionId', {
                value,
                transactionId
            });
        }
        return false;
    }

    const id = String(transactionId);
    if (wasPurchaseTracked(id)) {
        if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.info('[Google Ads] Conversion already sent for', id);
        }
        return false;
    }

    initGoogleAds();
    const gtag = ensureGtag();
    const payload = {
        send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_CONVERSION_LABEL}`,
        value: Number(value),
        currency: currency || 'ILS',
        transaction_id: id
    };

    gtag('event', 'conversion', payload);
    markPurchaseTracked(id);

    if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.info('[Google Ads] Purchase conversion fired', payload);
    }

    return true;
}

export function getGoogleAdsConfig() {
    return {
        adsId: GOOGLE_ADS_ID || null,
        conversionLabel: GOOGLE_ADS_CONVERSION_LABEL || null,
        isConfigured: Boolean(GOOGLE_ADS_ID && GOOGLE_ADS_CONVERSION_LABEL)
    };
}
