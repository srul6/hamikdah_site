/**
 * Browser-side debugging (console, Ads flow diagnostics, consent, etc.).
 * Enabled only in development — production builds mute console via silenceConsoleInProduction.
 */
export const BROWSER_DEBUG = process.env.NODE_ENV === 'development';
