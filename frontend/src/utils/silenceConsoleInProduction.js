import { isBrowserDebugEnabled } from './debug';

/**
 * Mute all browser console output when debug is off
 * (production domain like bmikdash.com).
 * Import this first from index.js so every console.* call is gated.
 *
 * Logs stay enabled on localhost (dev) and hamikdah-site.onrender.com.
 */
if (!isBrowserDebugEnabled()) {
    const noop = () => {};
    const methods = [
        'log',
        'info',
        'warn',
        'error',
        'debug',
        'trace',
        'table',
        'dir',
        'dirxml',
        'group',
        'groupCollapsed',
        'groupEnd',
        'time',
        'timeEnd',
        'timeLog',
        'assert',
        'count',
        'countReset'
    ];

    methods.forEach((method) => {
        // eslint-disable-next-line no-console
        if (typeof console[method] === 'function') {
            // eslint-disable-next-line no-console
            console[method] = noop;
        }
    });
}
