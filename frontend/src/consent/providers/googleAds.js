import { initGoogleAds as loadGoogleAdsGtag } from '../../analytics/gtag';

let adsInitialized = false;

export function initGoogleAdsProvider() {
    if (typeof window === 'undefined') {
        return false;
    }

    const ok = loadGoogleAdsGtag();
    adsInitialized = Boolean(ok) || adsInitialized;
    return adsInitialized;
}

/**
 * Ads tag scripts are not removed; Consent Mode denial (via manager) blocks storage.
 */
export function disableGoogleAdsProvider() {
    // No script teardown — consent manager updates Google Consent Mode.
}

export function isGoogleAdsInitialized() {
    return adsInitialized;
}
