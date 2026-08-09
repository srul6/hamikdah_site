import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { CATEGORY_IDS, hasConsent, subscribe } from '../consent/consentManager';
import { isGtmLoaded } from '../consent/providers/gtm';
import {
    trackGa4PageView,
    resetGa4PageViewDedupe,
    resetGa4ViewItemDedupe
} from './ga4Tracking';
import { isBrowserDebugEnabled } from '../utils/debug';

function ga4Log(...args) {
    if (isBrowserDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.info('[GA4]', ...args);
    }
}

/**
 * SPA page_view for GA4 when analytics consent is granted.
 * Uses the existing GTM/gtag dataLayer (no second GA4 loader).
 */
export default function GA4Analytics() {
    const location = useLocation();
    const wasReadyRef = useRef(false);

    useEffect(() => {
        const pagePath = `${location.pathname}${location.search}${location.hash}`;

        if (location.pathname.startsWith('/product/')) {
            resetGa4ViewItemDedupe();
        }

        const sendPageview = () => {
            const analyticsConsent = hasConsent(CATEGORY_IDS.ANALYTICS);
            const gtmLoaded = isGtmLoaded();
            const ready = analyticsConsent;

            ga4Log('page_view gate check', {
                pagePath,
                analyticsConsent,
                gtmLoaded,
                ready,
                wasReady: wasReadyRef.current
            });

            if (wasReadyRef.current && !ready) {
                resetGa4PageViewDedupe();
                wasReadyRef.current = false;
                ga4Log('page_view readiness lost — dedupe cleared');
            }

            if (!ready) {
                return;
            }

            if (!wasReadyRef.current) {
                wasReadyRef.current = true;
            }

            trackGa4PageView(pagePath);
        };

        sendPageview();
        return subscribe(sendPageview);
    }, [location.pathname, location.search, location.hash]);

    return null;
}
