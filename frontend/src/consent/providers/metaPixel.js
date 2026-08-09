/**
 * Meta Pixel provider — loaded only via consent manager when advertising is granted.
 */

import { isBrowserDebugEnabled } from '../../utils/debug';

const META_PIXEL_ID = process.env.REACT_APP_META_PIXEL_ID;

let metaScriptLoaded = false;
let metaInitialized = false;
let metaTrackingEnabled = false;

function metaLog(...args) {
    if (isBrowserDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.info('[Meta Pixel]', ...args);
    }
}

function metaWarn(...args) {
    if (isBrowserDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.warn('[Meta Pixel]', ...args);
    }
}

/**
 * Ensure window.fbq stub + fbevents.js are present (idempotent).
 */
function ensureFbq() {
    if (typeof window === 'undefined') {
        return false;
    }

    if (typeof window.fbq === 'function' && metaScriptLoaded) {
        return true;
    }

    try {
        // Standard Meta Pixel bootstrap (queues calls until fbevents.js loads)
        /* eslint-disable */
        !(function (f, b, e, v, n, t, s) {
            if (f.fbq) return;
            n = f.fbq = function () {
                n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
            };
            if (!f._fbq) f._fbq = n;
            n.push = n;
            n.loaded = true;
            n.version = '2.0';
            n.queue = [];
            t = b.createElement(e);
            t.async = true;
            t.src = v;
            s = b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t, s);
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        /* eslint-enable */

        metaScriptLoaded = true;
        return typeof window.fbq === 'function';
    } catch (error) {
        metaWarn('Failed to load fbevents.js', error);
        return false;
    }
}

/**
 * Called by consent manager when advertising consent is granted.
 * @returns {boolean} true if ready to track
 */
export function initMetaPixel() {
    if (typeof window === 'undefined' || !META_PIXEL_ID) {
        metaWarn('Init skipped — missing REACT_APP_META_PIXEL_ID');
        return false;
    }

    if (metaInitialized) {
        metaTrackingEnabled = true;
        metaLog('Re-enabled after consent grant', {
            pixelId: META_PIXEL_ID,
            advertisingConsentRequired: true,
            trackingEnabled: true
        });
        return true;
    }

    try {
        metaLog('Initializing', { pixelId: META_PIXEL_ID });
        if (!ensureFbq()) {
            metaWarn('Init blocked — fbq bootstrap failed');
            return false;
        }

        window.fbq('init', META_PIXEL_ID);
        metaInitialized = true;
        metaTrackingEnabled = true;
        metaLog('Initialized', {
            pixelId: META_PIXEL_ID,
            fbqReady: typeof window.fbq === 'function',
            note: 'PageView is emitted by MetaPixelAnalytics after consent/init'
        });
        return true;
    } catch (error) {
        metaWarn('Init failed', error);
        metaInitialized = false;
        metaTrackingEnabled = false;
        return false;
    }
}

/**
 * Stop future events when advertising consent is withdrawn.
 * Script stays loaded; tracking flag gates all events.
 */
export function disableMetaPixel() {
    metaTrackingEnabled = false;
    metaLog('Disabled (advertising consent withdrawn)', {
        metaInitialized,
        trackingEnabled: false
    });
}

export function isMetaPixelInitialized() {
    return metaInitialized && metaTrackingEnabled;
}

export function getMetaPixelId() {
    return META_PIXEL_ID || null;
}

/**
 * Low-level fbq track — used only by the centralized tracking layer.
 */
export function fbqTrack(eventName, params = {}, { eventID } = {}) {
    if (!isMetaPixelInitialized()) {
        metaLog('fbqTrack blocked', {
            eventName,
            reason: 'pixel not initialized or tracking disabled',
            metaInitialized,
            metaTrackingEnabled
        });
        return false;
    }

    if (typeof window === 'undefined' || typeof window.fbq !== 'function') {
        metaLog('fbqTrack blocked', {
            eventName,
            reason: 'window.fbq unavailable'
        });
        return false;
    }

    try {
        if (eventID) {
            window.fbq('track', eventName, params, { eventID });
        } else {
            window.fbq('track', eventName, params);
        }
        metaLog('fbqTrack succeeded', {
            eventName,
            eventID: eventID || null,
            hasParams: Boolean(params && Object.keys(params).length)
        });
        return true;
    } catch (error) {
        metaWarn(`fbq track failed: ${eventName}`, error);
        return false;
    }
}

export { metaLog, metaWarn };
