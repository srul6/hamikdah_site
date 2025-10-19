/**
 * Cookie Management Utility
 * Handles client-side cookie storage with security best practices
 */

// Cookie configuration
const COOKIE_CONFIG = {
    // Cart cookies expire after 30 day 
    CART_EXPIRY_DAYS: 30,
    // Form data cookies expire after 1 day (24 hours)
    FORM_DATA_EXPIRY_DAYS: 3,
    // Session cookies expire after 1 day
    SESSION_EXPIRY_DAYS: 1,
    // Cookie names
    CART_COOKIE: 'hamikdash_cart',
    FORM_DATA_COOKIE: 'hamikdash_form_data',
    USER_PREFERENCES_COOKIE: 'hamikdash_preferences'
};

/**
 * Set a cookie with specified options
 * @param {string} name - Cookie name
 * @param {any} value - Cookie value (will be JSON stringified)
 * @param {number} days - Expiration in days
 * @param {object} options - Additional cookie options
 */
export function setCookie(name, value, days = 30, options = {}) {
    try {
        // Convert value to JSON string
        const jsonValue = JSON.stringify(value);

        // Calculate expiration date
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;

        // Build cookie string with security attributes
        const cookieParts = [
            `${encodeURIComponent(name)}=${encodeURIComponent(jsonValue)}`,
            expires,
            'path=/',  // Available across entire site
            'SameSite=Lax'  // CSRF protection while allowing normal navigation
        ];

        // Add Secure flag in production (HTTPS)
        if (window.location.protocol === 'https:') {
            cookieParts.push('Secure');
        }

        // Add custom options
        if (options.domain) {
            cookieParts.push(`domain=${options.domain}`);
        }

        // Set the cookie
        document.cookie = cookieParts.join('; ');

        return true;
    } catch (error) {
        console.error(`❌ Error setting cookie ${name}:`, error);
        return false;
    }
}

/**
 * Get a cookie value
 * @param {string} name - Cookie name
 * @returns {any} Parsed cookie value or null
 */
export function getCookie(name) {
    try {
        const nameEQ = encodeURIComponent(name) + "=";
        const cookies = document.cookie.split(';');

        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();

            if (cookie.indexOf(nameEQ) === 0) {
                const value = cookie.substring(nameEQ.length);
                const decodedValue = decodeURIComponent(value);

                // Try to parse as JSON
                try {
                    return JSON.parse(decodedValue);
                } catch {
                    // If not JSON, return as string
                    return decodedValue;
                }
            }
        }

        return null;
    } catch (error) {
        console.error(`❌ Error getting cookie ${name}:`, error);
        return null;
    }
}

/**
 * Delete a cookie
 * @param {string} name - Cookie name
 */
export function deleteCookie(name) {
    try {
        document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
        return true;
    } catch (error) {
        console.error(`❌ Error deleting cookie ${name}:`, error);
        return false;
    }
}

/**
 * Check if a cookie exists
 * @param {string} name - Cookie name
 * @returns {boolean}
 */
export function cookieExists(name) {
    return getCookie(name) !== null;
}

/**
 * Clear all site cookies
 */
export function clearAllCookies() {
    try {
        const cookies = document.cookie.split(';');

        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            deleteCookie(name);
        }

        return true;
    } catch (error) {
        console.error('❌ Error clearing cookies:', error);
        return false;
    }
}

// ===== CART-SPECIFIC FUNCTIONS =====

/**
 * Save cart to cookies
 * @param {Array} cartItems - Array of cart items
 */
export function saveCartToCookie(cartItems) {
    return setCookie(COOKIE_CONFIG.CART_COOKIE, cartItems, COOKIE_CONFIG.CART_EXPIRY_DAYS);
}

/**
 * Get cart from cookies
 * @returns {Array} Cart items or empty array
 */
export function getCartFromCookie() {
    const cart = getCookie(COOKIE_CONFIG.CART_COOKIE);
    return Array.isArray(cart) ? cart : [];
}

/**
 * Clear cart cookie
 */
export function clearCartCookie() {
    return deleteCookie(COOKIE_CONFIG.CART_COOKIE);
}

// ===== FORM DATA-SPECIFIC FUNCTIONS =====

/**
 * Save form data to cookies
 * @param {object} formData - Form data object
 */
export function saveFormDataToCookie(formData) {
    return setCookie(COOKIE_CONFIG.FORM_DATA_COOKIE, formData, COOKIE_CONFIG.FORM_DATA_EXPIRY_DAYS);
}

/**
 * Get form data from cookies
 * @returns {object} Form data or empty object
 */
export function getFormDataFromCookie() {
    const formData = getCookie(COOKIE_CONFIG.FORM_DATA_COOKIE);
    return formData || {};
}

/**
 * Clear form data cookie
 */
export function clearFormDataCookie() {
    return deleteCookie(COOKIE_CONFIG.FORM_DATA_COOKIE);
}

/**
 * Update specific form field in cookie
 * @param {string} fieldName - Field name to update
 * @param {any} value - New value
 */
export function updateFormField(fieldName, value) {
    const currentData = getFormDataFromCookie();
    currentData[fieldName] = value;
    return saveFormDataToCookie(currentData);
}

// ===== USER PREFERENCES FUNCTIONS =====

/**
 * Save user preferences to cookies
 * @param {object} preferences - User preferences object
 */
export function savePreferencesToCookie(preferences) {
    return setCookie(COOKIE_CONFIG.USER_PREFERENCES_COOKIE, preferences, COOKIE_CONFIG.SESSION_EXPIRY_DAYS);
}

/**
 * Get user preferences from cookies
 * @returns {object} Preferences or empty object
 */
export function getPreferencesFromCookie() {
    const prefs = getCookie(COOKIE_CONFIG.USER_PREFERENCES_COOKIE);
    return prefs || {};
}

/**
 * Update specific preference
 * @param {string} key - Preference key
 * @param {any} value - Preference value
 */
export function updatePreference(key, value) {
    const currentPrefs = getPreferencesFromCookie();
    currentPrefs[key] = value;
    return savePreferencesToCookie(currentPrefs);
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get cookie size in bytes
 * @param {string} name - Cookie name
 * @returns {number} Size in bytes
 */
export function getCookieSize(name) {
    const cookie = getCookie(name);
    if (!cookie) return 0;

    const jsonString = JSON.stringify(cookie);
    return new Blob([jsonString]).size;
}

/**
 * Check if cookies are enabled
 * @returns {boolean}
 */
export function areCookiesEnabled() {
    try {
        const testCookie = '__cookie_test__';
        setCookie(testCookie, 'test', 1);
        const enabled = cookieExists(testCookie);
        deleteCookie(testCookie);
        return enabled;
    } catch {
        return false;
    }
}

/**
 * Get all site cookies as object
 * @returns {object} All cookies
 */
export function getAllCookies() {
    const cookies = {};
    const cookieArray = document.cookie.split(';');

    for (let cookie of cookieArray) {
        const [name, value] = cookie.split('=').map(c => c.trim());
        if (name && value) {
            try {
                cookies[decodeURIComponent(name)] = JSON.parse(decodeURIComponent(value));
            } catch {
                cookies[decodeURIComponent(name)] = decodeURIComponent(value);
            }
        }
    }

    return cookies;
}

// Export configuration for external use
export { COOKIE_CONFIG };

// Export default object with all functions
export default {
    setCookie,
    getCookie,
    deleteCookie,
    cookieExists,
    clearAllCookies,
    saveCartToCookie,
    getCartFromCookie,
    clearCartCookie,
    saveFormDataToCookie,
    getFormDataFromCookie,
    clearFormDataCookie,
    updateFormField,
    savePreferencesToCookie,
    getPreferencesFromCookie,
    updatePreference,
    getCookieSize,
    areCookiesEnabled,
    getAllCookies,
    COOKIE_CONFIG
};

