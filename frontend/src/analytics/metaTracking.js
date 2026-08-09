/**
 * Centralized Meta Pixel ecommerce tracking.
 * All app code should call these helpers — never window.fbq directly.
 */

import { CATEGORY_IDS, hasConsent, bootstrapConsent } from '../consent/consentManager';
import {
    fbqTrack,
    isMetaPixelInitialized,
    metaLog,
    metaWarn
} from '../consent/providers/metaPixel';

const CURRENCY = 'ILS';
const PURCHASE_STORAGE_PREFIX = 'meta_pixel_purchase_';

/** In-memory dedupe for SPA ViewContent (survives Strict Mode double-effects). */
let lastViewContentKey = null;
/** In-memory dedupe for InitiateCheckout per cart signature. */
let lastInitiateCheckoutKey = null;

function canTrack() {
    try {
        bootstrapConsent();
        if (!hasConsent(CATEGORY_IDS.ADVERTISING)) {
            return false;
        }
        return isMetaPixelInitialized();
    } catch (error) {
        metaWarn('canTrack check failed', error);
        return false;
    }
}

function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function productId(product) {
    if (!product) return null;
    const id = product.id ?? product.productId;
    return id == null || id === '' ? null : String(id);
}

function productName(product) {
    if (!product) return '';
    return (
        product.name_he ||
        product.name_en ||
        product.name ||
        product.title ||
        ''
    );
}

function productPrice(product) {
    if (!product) return 0;
    return toNumber(product.price);
}

function wasPurchaseTracked(orderId) {
    try {
        return Boolean(localStorage.getItem(`${PURCHASE_STORAGE_PREFIX}${orderId}`));
    } catch {
        return false;
    }
}

function markPurchaseTracked(orderId) {
    try {
        localStorage.setItem(`${PURCHASE_STORAGE_PREFIX}${orderId}`, '1');
    } catch {
        // Ignore quota / private mode
    }
}

/**
 * PageView — call on consent + each SPA route change (caller dedupes by path).
 */
export function trackPageView() {
    if (!canTrack()) {
        return false;
    }
    const ok = fbqTrack('PageView');
    if (ok) {
        metaLog('PageView');
    }
    return ok;
}

/**
 * ViewContent — when a product page has loaded product data.
 * Dedupes by product id for the current in-memory session key.
 */
export function trackViewContent(product, { force = false } = {}) {
    if (!canTrack() || !product) {
        return false;
    }

    const id = productId(product);
    if (!id) {
        metaWarn('ViewContent skipped — missing product id');
        return false;
    }

    const key = `viewcontent_${id}`;
    if (!force && lastViewContentKey === key) {
        return false;
    }

    const params = {
        content_name: productName(product),
        content_ids: [id],
        content_type: 'product',
        value: productPrice(product),
        currency: CURRENCY
    };

    const eventID = `viewcontent_${id}`;
    const ok = fbqTrack('ViewContent', params, { eventID });
    if (ok) {
        lastViewContentKey = key;
        metaLog('ViewContent', params);
    }
    return ok;
}

/** Allow re-firing ViewContent when navigating to a different product. */
export function resetViewContentDedupe() {
    lastViewContentKey = null;
}

/**
 * AddToCart — call only after a successful user add-to-cart action.
 */
export function trackAddToCart(product, quantity = 1) {
    if (!canTrack() || !product) {
        return false;
    }

    const id = productId(product);
    if (!id) {
        metaWarn('AddToCart skipped — missing product id');
        return false;
    }

    const qty = Math.max(1, toNumber(quantity) || 1);
    const unitPrice = productPrice(product);
    const params = {
        content_name: productName(product),
        content_ids: [id],
        content_type: 'product',
        value: unitPrice * qty,
        currency: CURRENCY,
        contents: [
            {
                id,
                quantity: qty,
                item_price: unitPrice
            }
        ]
    };

    const ok = fbqTrack('AddToCart', params);
    if (ok) {
        metaLog('AddToCart', params);
    }
    return ok;
}

/**
 * InitiateCheckout — when the user starts checkout (e.g. continue to payment).
 * @param {object} options
 * @param {Array} options.items - cart line items
 * @param {number} options.value - cart total
 * @param {number} [options.numItems] - total quantity
 */
export function trackInitiateCheckout({ items = [], value, numItems } = {}) {
    if (!canTrack()) {
        return false;
    }

    const contentIds = (items || [])
        .map((item) => productId(item))
        .filter(Boolean);

    const totalQty = numItems != null
        ? toNumber(numItems)
        : (items || []).reduce((sum, item) => sum + Math.max(1, toNumber(item.quantity) || 1), 0);

    const params = {
        content_ids: contentIds,
        content_type: 'product',
        value: toNumber(value),
        currency: CURRENCY,
        num_items: totalQty
    };

    const dedupeKey = `${contentIds.slice().sort().join(',')}|${params.value}|${totalQty}`;
    if (lastInitiateCheckoutKey === dedupeKey) {
        return false;
    }

    const ok = fbqTrack('InitiateCheckout', params);
    if (ok) {
        lastInitiateCheckoutKey = dedupeKey;
        metaLog('InitiateCheckout', params);
    }
    return ok;
}

/**
 * Purchase — after confirmed successful payment.
 * Deduped in localStorage by orderId (survives refresh).
 * Uses stable eventID purchase_<orderId> for future CAPI dedupe.
 */
export function trackPurchase({
    orderId,
    value,
    currency = CURRENCY,
    contentIds = [],
    numItems
} = {}) {
    if (!canTrack()) {
        metaLog('Purchase skipped — no consent or pixel not ready', { orderId });
        return false;
    }

    const id = orderId != null ? String(orderId) : '';
    if (!id) {
        metaWarn('Purchase skipped — missing orderId');
        return false;
    }

    if (wasPurchaseTracked(id)) {
        metaLog('Purchase skipped — already sent for this order', { orderId: id });
        return false;
    }

    const params = {
        content_ids: (contentIds || []).map(String).filter(Boolean),
        content_type: 'product',
        value: toNumber(value),
        currency: currency || CURRENCY
    };

    if (numItems != null) {
        params.num_items = toNumber(numItems);
    }

    const eventID = `purchase_${id}`;
    const ok = fbqTrack('Purchase', params, { eventID });

    if (ok) {
        markPurchaseTracked(id);
        metaLog('Purchase', { orderId: id, eventID, ...params });
    } else {
        metaWarn('Purchase fbq call failed', { orderId: id });
    }

    return ok;
}

export function hasMetaPurchaseBeenTracked(orderId) {
    if (orderId == null) return false;
    return wasPurchaseTracked(String(orderId));
}
