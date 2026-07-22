/**
 * Meta Pixel (Facebook / Instagram) — stub for future use.
 * Register is already wired via consent manager; implement init/disable when ready.
 */

const META_PIXEL_ID = process.env.REACT_APP_META_PIXEL_ID;

let metaInitialized = false;

export function initMetaPixel() {
    if (typeof window === 'undefined' || !META_PIXEL_ID || metaInitialized) {
        return false;
    }

    // Placeholder: load fbevents.js and fbq('init', META_PIXEL_ID) when implementing.
    if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.info('[Consent] Meta Pixel not configured yet (REACT_APP_META_PIXEL_ID)');
    }
    return false;
}

export function disableMetaPixel() {
    metaInitialized = false;
}

export function isMetaPixelInitialized() {
    return metaInitialized;
}
