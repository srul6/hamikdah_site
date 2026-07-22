import { CATEGORY_IDS, hasConsent, bootstrapConsent, getConsent } from './consentManager';
import { trackPurchaseConversion as firePurchaseConversion } from '../analytics/gtag';

const ADS_LOG = '[Ads Conversion]';

/**
 * Consent-aware Google Ads purchase conversion.
 * Use this from app code instead of calling gtag.js directly.
 */
export function trackPurchaseConversion(payload, { requestId } = {}) {
    const tag = requestId?.tag || ADS_LOG;

    console.info(`${tag} [Google Ads] trackPurchaseConversion (consent wrapper) entered`, {
        payload,
        timestamp: new Date().toISOString()
    });

    // Ensure saved consent is loaded before checking (PaymentSuccess may mount
    // before ConsentProvider's useEffect has run).
    bootstrapConsent();
    const consent = getConsent();
    const advertisingGranted = hasConsent(CATEGORY_IDS.ADVERTISING);

    console.info(`${tag} [Google Ads] consent check inside trackPurchaseConversion`, {
        consent,
        advertisingGranted
    });

    if (!advertisingGranted) {
        console.info(`${tag} [Consent] Skipping Ads conversion — no advertising consent`);
        return false;
    }

    return firePurchaseConversion(payload, { requestId });
}
