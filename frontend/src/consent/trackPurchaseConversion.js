import { CATEGORY_IDS, hasConsent, bootstrapConsent } from './consentManager';
import { trackPurchaseConversion as firePurchaseConversion } from '../analytics/gtag';

/**
 * Consent-aware Google Ads purchase conversion.
 * Use this from app code instead of calling gtag.js directly.
 */
export function trackPurchaseConversion(payload) {
    // Ensure saved consent is loaded before checking (PaymentSuccess may mount
    // before ConsentProvider's useEffect has run).
    bootstrapConsent();

    if (!hasConsent(CATEGORY_IDS.ADVERTISING)) {
        if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.info('[Consent] Skipping Ads conversion — no advertising consent');
        }
        return false;
    }
    return firePurchaseConversion(payload);
}
