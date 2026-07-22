import { BROWSER_DEBUG } from './debug';

/**
 * Mute all browser console output when BROWSER_DEBUG is off.
 * Import this first from index.js so every console.* call is gated.
 */
if (!BROWSER_DEBUG) {
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
