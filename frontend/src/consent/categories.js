/**
 * Cookie consent categories and provider registry.
 *
 * To add a new tracker:
 * 1. Create an init/disable module (or extend an existing one).
 * 2. Register it below with the correct category.
 * 3. No UI or App.jsx changes required — the manager applies it automatically.
 */

export const CONSENT_VERSION = 1;

export const CATEGORY_IDS = {
    ESSENTIAL: 'essential',
    ANALYTICS: 'analytics',
    ADVERTISING: 'advertising'
};

/** Default preferences before the visitor responds */
export const DEFAULT_CONSENT = {
    version: CONSENT_VERSION,
    essential: true,
    analytics: false,
    advertising: false
};

/**
 * Provider registry. Each provider belongs to one category.
 * `init` runs once when that category becomes granted.
 * `disable` runs when the category is revoked after previously being granted.
 */
export const PROVIDERS = [
    {
        id: 'gtm',
        category: CATEGORY_IDS.ANALYTICS,
        label: 'Google Tag Manager / GA4'
    },
    {
        id: 'clarity',
        category: CATEGORY_IDS.ANALYTICS,
        label: 'Microsoft Clarity'
    },
    {
        id: 'googleAds',
        category: CATEGORY_IDS.ADVERTISING,
        label: 'Google Ads'
    },
    {
        id: 'metaPixel',
        category: CATEGORY_IDS.ADVERTISING,
        label: 'Meta Pixel'
    }
];
