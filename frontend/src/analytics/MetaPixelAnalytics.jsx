import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { CATEGORY_IDS, hasConsent, subscribe } from '../consent/consentManager';
import { isMetaPixelInitialized } from '../consent/providers/metaPixel';
import { trackPageView, resetViewContentDedupe } from './metaTracking';

/**
 * SPA PageView for Meta Pixel when advertising consent is granted
 * and the Pixel has been initialized by the consent manager.
 */
export default function MetaPixelAnalytics() {
    const location = useLocation();
    const previousPathRef = useRef(null);

    useEffect(() => {
        const sendPageview = () => {
            if (!hasConsent(CATEGORY_IDS.ADVERTISING) || !isMetaPixelInitialized()) {
                return;
            }

            const pagePath = `${location.pathname}${location.search}${location.hash}`;
            if (previousPathRef.current === pagePath) {
                return;
            }

            previousPathRef.current = pagePath;

            // New route — allow ViewContent for the next product page
            if (location.pathname.startsWith('/product/')) {
                resetViewContentDedupe();
            }

            trackPageView();
        };

        sendPageview();
        return subscribe(sendPageview);
    }, [location.pathname, location.search, location.hash]);

    return null;
}
