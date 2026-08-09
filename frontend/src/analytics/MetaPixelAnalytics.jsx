import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { CATEGORY_IDS, hasConsent, subscribe } from '../consent/consentManager';
import {
    isMetaPixelInitialized,
    metaLog
} from '../consent/providers/metaPixel';
import {
    trackPageView,
    resetViewContentDedupe,
    resetPageViewDedupe
} from './metaTracking';

/**
 * SPA PageView for Meta Pixel when advertising consent is granted
 * and the Pixel has been initialized by the consent manager.
 *
 * Dedupe is success-only (module-level inside trackPageView):
 * failed/skipped attempts do not permanently lock a route.
 */
export default function MetaPixelAnalytics() {
    const location = useLocation();
    const wasReadyRef = useRef(false);

    useEffect(() => {
        const pagePath = `${location.pathname}${location.search}${location.hash}`;

        // Path changed — allow ViewContent again for the newly opened product
        if (location.pathname.startsWith('/product/')) {
            resetViewContentDedupe();
        }

        const sendPageview = () => {
            const advertisingConsent = hasConsent(CATEGORY_IDS.ADVERTISING);
            const pixelInitialized = isMetaPixelInitialized();
            const ready = advertisingConsent && pixelInitialized;

            metaLog('PageView gate check', {
                pagePath,
                advertisingConsent,
                pixelInitialized,
                ready,
                wasReady: wasReadyRef.current
            });

            // Advertising revoked after previously being ready — allow a fresh PageView later
            if (wasReadyRef.current && !ready) {
                resetPageViewDedupe();
                wasReadyRef.current = false;
                metaLog('PageView readiness lost — dedupe cleared for future consent');
            }

            if (!ready) {
                metaLog('PageView attempt deferred', {
                    pagePath,
                    reason: !advertisingConsent
                        ? 'waiting for advertising consent'
                        : 'waiting for Meta Pixel init'
                });
                return;
            }

            if (!wasReadyRef.current) {
                wasReadyRef.current = true;
                metaLog('PageView readiness acquired — attempting track', { pagePath });
            }

            trackPageView(pagePath);
        };

        // Immediate attempt (covers returning visitors where bootstrap already inited the Pixel)
        sendPageview();

        // Retry when consent changes (covers: mount before consent → accept advertising later)
        return subscribe(sendPageview);
    }, [location.pathname, location.search, location.hash]);

    return null;
}
