import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { CATEGORY_IDS, hasConsent, subscribe } from '../consent/consentManager';
import { isClarityInitialized, trackClarityPageview } from '../consent/providers/clarity';

/**
 * Tags SPA route changes in Clarity only when analytics consent is granted
 * and Clarity has been initialized by the consent manager.
 */
export default function ClarityAnalytics() {
    const location = useLocation();
    const previousPathRef = useRef(null);

    useEffect(() => {
        const sendPageview = () => {
            if (!hasConsent(CATEGORY_IDS.ANALYTICS) || !isClarityInitialized()) {
                return;
            }
            const pagePath = `${location.pathname}${location.search}${location.hash}`;
            if (previousPathRef.current === pagePath) {
                return;
            }
            previousPathRef.current = pagePath;
            trackClarityPageview(pagePath);
        };

        sendPageview();
        return subscribe(sendPageview);
    }, [location.pathname, location.search, location.hash]);

    return null;
}
