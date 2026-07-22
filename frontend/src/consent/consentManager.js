import { CATEGORY_IDS, DEFAULT_CONSENT, PROVIDERS } from './categories';
import { loadConsent, saveConsent } from './storage';
import { setDefaultConsentDenied, updateGoogleConsentMode, initGtm, disableGtm } from './providers/gtm';
import { initClarity, disableClarity } from './providers/clarity';
import { initGoogleAdsProvider, disableGoogleAdsProvider } from './providers/googleAds';
import { initMetaPixel, disableMetaPixel } from './providers/metaPixel';

const providerHandlers = {
    gtm: { init: initGtm, disable: disableGtm },
    clarity: { init: initClarity, disable: disableClarity },
    googleAds: { init: initGoogleAdsProvider, disable: disableGoogleAdsProvider },
    metaPixel: { init: initMetaPixel, disable: disableMetaPixel }
};

/** Extra providers registered at runtime via registerProvider() */
const customProviders = [];

const initializedProviders = new Set();
const listeners = new Set();

let currentConsent = null;
let bootstrapped = false;

function notify() {
    const snapshot = getConsent();
    listeners.forEach((listener) => {
        try {
            listener(snapshot);
        } catch (_) {
            // Never let a subscriber break consent updates
        }
    });
}

function allProviders() {
    return [...PROVIDERS, ...customProviders];
}

/**
 * Apply Google Consent Mode + init/disable each registered provider
 * according to the granted categories.
 */
function applyProviders(previousConsent) {
    const consent = currentConsent || { ...DEFAULT_CONSENT, decided: false };
    const analytics = Boolean(consent.analytics);
    const advertising = Boolean(consent.advertising);

    updateGoogleConsentMode({ analytics, advertising });

    allProviders().forEach((provider) => {
        const handlers = providerHandlers[provider.id] || {
            init: provider.init,
            disable: provider.disable
        };
        if (!handlers?.init) {
            return;
        }

        const categoryGranted = provider.category === CATEGORY_IDS.ESSENTIAL
            || (provider.category === CATEGORY_IDS.ANALYTICS && analytics)
            || (provider.category === CATEGORY_IDS.ADVERTISING && advertising);

        const wasGranted = previousConsent
            && (
                (provider.category === CATEGORY_IDS.ANALYTICS && previousConsent.analytics)
                || (provider.category === CATEGORY_IDS.ADVERTISING && previousConsent.advertising)
            );

        if (categoryGranted) {
            if (!initializedProviders.has(provider.id)) {
                const ok = handlers.init();
                if (ok !== false) {
                    initializedProviders.add(provider.id);
                }
            }
        } else if (wasGranted || initializedProviders.has(provider.id)) {
            if (typeof handlers.disable === 'function') {
                handlers.disable();
            }
            // Keep id in set so we don't re-init incorrectly; allow re-init on re-grant
            // by removing so next grant calls init again where possible.
            initializedProviders.delete(provider.id);
        }
    });
}

function setConsentState(prefs, { persist = true } = {}) {
    const previous = currentConsent;
    const next = {
        ...DEFAULT_CONSENT,
        analytics: Boolean(prefs.analytics),
        advertising: Boolean(prefs.advertising),
        essential: true,
        decided: true,
        timestamp: Date.now()
    };

    if (persist) {
        saveConsent(next);
    }

    currentConsent = next;
    applyProviders(previous);
    notify();
    return next;
}

/**
 * Bootstrap once on app start: load saved consent and apply providers.
 * Sets Google Consent Mode defaults to denied before any tags load.
 */
export function bootstrapConsent() {
    if (bootstrapped || typeof window === 'undefined') {
        return getConsent();
    }

    setDefaultConsentDenied();

    const saved = loadConsent();
    if (saved) {
        currentConsent = saved;
        applyProviders(null);
    } else {
        currentConsent = null;
    }

    bootstrapped = true;
    notify();
    return getConsent();
}

export function getConsent() {
    if (!currentConsent) {
        return {
            ...DEFAULT_CONSENT,
            decided: false,
            timestamp: null
        };
    }
    return { ...currentConsent };
}

export function hasResponded() {
    return Boolean(currentConsent?.decided);
}

export function hasConsent(category) {
    if (category === CATEGORY_IDS.ESSENTIAL) {
        return true;
    }
    if (!currentConsent?.decided) {
        return false;
    }
    return Boolean(currentConsent[category]);
}

export function acceptAll() {
    return setConsentState({ analytics: true, advertising: true });
}

export function rejectAll() {
    return setConsentState({ analytics: false, advertising: false });
}

export function savePreferences({ analytics, advertising }) {
    return setConsentState({ analytics, advertising });
}

export function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/**
 * Register an additional tracking provider at runtime.
 * @param {{ id: string, category: string, init: Function, disable?: Function, label?: string }} provider
 */
export function registerProvider(provider) {
    if (!provider?.id || !provider?.category || typeof provider.init !== 'function') {
        throw new Error('[Consent] registerProvider requires id, category, and init()');
    }
    if (allProviders().some((p) => p.id === provider.id)) {
        return;
    }
    customProviders.push(provider);
    providerHandlers[provider.id] = {
        init: provider.init,
        disable: provider.disable
    };

    // If consent already grants this category, init immediately
    if (hasConsent(provider.category)) {
        const ok = provider.init();
        if (ok !== false) {
            initializedProviders.add(provider.id);
        }
    }
}

export { CATEGORY_IDS, PROVIDERS };
