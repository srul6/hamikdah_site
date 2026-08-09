/**
 * GA4 Ecommerce tracking via the shared GTM/gtag dataLayer.
 * Does not load a second GA4 instance — events use the existing GTM container.
 * Gated by analytics consent (Consent Mode analytics_storage).
 */

import { CATEGORY_IDS, hasConsent, bootstrapConsent } from '../consent/consentManager';
import { isGtmLoaded } from '../consent/providers/gtm';
import { isBrowserDebugEnabled } from '../utils/debug';

const CURRENCY = 'ILS';
const PURCHASE_STORAGE_PREFIX = 'ga4_purchase_';
const PENDING_PURCHASE_PREFIX = 'ga4_pending_purchase_';

/** Success-only SPA page_view dedupe (module-level). */
let lastSuccessfulPageViewPath = null;
/** In-memory ViewContent-style dedupe for view_item. */
let lastViewItemKey = null;
/** In-memory begin_checkout dedupe. */
let lastBeginCheckoutKey = null;
/** In-memory add_payment_info dedupe. */
let lastAddPaymentInfoKey = null;

function ga4Log(...args) {
    if (isBrowserDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.info('[GA4]', ...args);
    }
}

function ga4Warn(...args) {
    if (isBrowserDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.warn('[GA4]', ...args);
    }
}

function ensureGtag() {
    if (typeof window === 'undefined') {
        return null;
    }
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
        window.gtag = function gtag() {
            // eslint-disable-next-line prefer-rest-params
            window.dataLayer.push(arguments);
        };
    }
    return window.gtag;
}

function getTrackingGateState() {
    bootstrapConsent();
    const analyticsConsent = hasConsent(CATEGORY_IDS.ANALYTICS);
    const gtmLoaded = isGtmLoaded();
    return {
        analyticsConsent,
        gtmLoaded,
        canTrack: analyticsConsent
    };
}

function canTrack() {
    try {
        return getTrackingGateState().canTrack;
    } catch (error) {
        ga4Warn('canTrack check failed', error);
        return false;
    }
}

function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function productId(product) {
    if (!product) return null;
    const id = product.id ?? product.productId ?? product.item_id;
    return id == null || id === '' ? null : String(id);
}

function productName(product) {
    if (!product) return '';
    return (
        product.item_name ||
        product.name_he ||
        product.name_en ||
        product.name ||
        product.title ||
        ''
    );
}

function productPrice(product) {
    if (!product) return 0;
    return toNumber(product.price ?? product.item_price);
}

/**
 * Map app product / cart / order line → GA4 ecommerce item.
 */
export function toGa4Item(product, quantity = 1, index = 0) {
    const id = productId(product);
    const qty = Math.max(1, toNumber(quantity) || 1);
    return {
        item_id: id || 'unknown',
        item_name: productName(product) || 'Item',
        price: productPrice(product),
        quantity: qty,
        index
    };
}

export function toGa4Items(list = []) {
    return (list || [])
        .map((item, index) => toGa4Item(item, item.quantity ?? 1, index))
        .filter((item) => item.item_id && item.item_id !== 'unknown');
}

function pushGa4Event(eventName, params = {}) {
    const gtag = ensureGtag();
    if (!gtag) {
        return false;
    }

    const payload = { ...params };
    if (isBrowserDebugEnabled()) {
        payload.debug_mode = true;
    }

    // Clear previous ecommerce object so GTM/GA4 don't merge stale items
    try {
        window.dataLayer.push({ ecommerce: null });
    } catch (_) {
        // Ignore
    }

    gtag('event', eventName, payload);
    ga4Log(eventName, payload);
    return true;
}

function wasPurchaseTracked(transactionId) {
    try {
        return Boolean(localStorage.getItem(`${PURCHASE_STORAGE_PREFIX}${transactionId}`));
    } catch {
        return false;
    }
}

function markPurchaseTracked(transactionId) {
    try {
        localStorage.setItem(`${PURCHASE_STORAGE_PREFIX}${transactionId}`, '1');
    } catch {
        // Ignore quota / private mode
    }
}

/**
 * Persist checkout line items before redirect to the payment provider.
 * Used as a fallback if the paid-order summary is not ready yet.
 */
export function savePendingGa4Purchase({ orderId, items = [], value, currency = CURRENCY } = {}) {
    const id = orderId != null ? String(orderId) : '';
    if (!id || typeof sessionStorage === 'undefined') {
        return false;
    }
    try {
        const payload = {
            transaction_id: id,
            value: toNumber(value),
            currency: currency || CURRENCY,
            items: toGa4Items(items)
        };
        sessionStorage.setItem(`${PENDING_PURCHASE_PREFIX}${id}`, JSON.stringify(payload));
        ga4Log('Pending purchase saved', payload);
        return true;
    } catch (error) {
        ga4Warn('Failed to save pending purchase', error);
        return false;
    }
}

export function loadPendingGa4Purchase(orderId) {
    const id = orderId != null ? String(orderId) : '';
    if (!id || typeof sessionStorage === 'undefined') {
        return null;
    }
    try {
        const raw = sessionStorage.getItem(`${PENDING_PURCHASE_PREFIX}${id}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return {
            transaction_id: String(parsed.transaction_id || id),
            value: toNumber(parsed.value),
            currency: parsed.currency || CURRENCY,
            items: Array.isArray(parsed.items) ? parsed.items : []
        };
    } catch {
        return null;
    }
}

export function clearPendingGa4Purchase(orderId) {
    const id = orderId != null ? String(orderId) : '';
    if (!id || typeof sessionStorage === 'undefined') {
        return;
    }
    try {
        sessionStorage.removeItem(`${PENDING_PURCHASE_PREFIX}${id}`);
    } catch {
        // Ignore
    }
}

/**
 * SPA page_view — analytics consent required.
 * @returns {boolean}
 */
export function trackGa4PageView(pagePath = '') {
    const pathKey = pagePath || '';
    const gate = getTrackingGateState();

    ga4Log('page_view attempt', {
        pagePath: pathKey || '(unspecified)',
        analyticsConsent: gate.analyticsConsent,
        gtmLoaded: gate.gtmLoaded
    });

    if (!gate.canTrack) {
        ga4Log('page_view blocked — analytics consent not granted');
        return false;
    }

    if (pathKey && lastSuccessfulPageViewPath === pathKey) {
        ga4Log('page_view skipped — duplicate', { pagePath: pathKey });
        return false;
    }

    const ok = pushGa4Event('page_view', {
        page_path: pathKey || (typeof window !== 'undefined' ? window.location.pathname : ''),
        page_location: typeof window !== 'undefined' ? window.location.href : undefined,
        page_title: typeof document !== 'undefined' ? document.title : undefined
    });

    if (ok && pathKey) {
        lastSuccessfulPageViewPath = pathKey;
    }
    return ok;
}

export function resetGa4PageViewDedupe() {
    lastSuccessfulPageViewPath = null;
}

/**
 * view_item
 */
export function trackGa4ViewItem(product, { force = false } = {}) {
    if (!canTrack() || !product) {
        return false;
    }

    const id = productId(product);
    if (!id) {
        ga4Warn('view_item skipped — missing product id');
        return false;
    }

    const key = `view_item_${id}`;
    if (!force && lastViewItemKey === key) {
        return false;
    }

    const item = toGa4Item(product, 1, 0);
    const ok = pushGa4Event('view_item', {
        currency: CURRENCY,
        value: item.price,
        items: [item]
    });

    if (ok) {
        lastViewItemKey = key;
    }
    return ok;
}

export function resetGa4ViewItemDedupe() {
    lastViewItemKey = null;
}

/**
 * add_to_cart
 */
export function trackGa4AddToCart(product, quantity = 1) {
    if (!canTrack() || !product) {
        return false;
    }

    const id = productId(product);
    if (!id) {
        ga4Warn('add_to_cart skipped — missing product id');
        return false;
    }

    const qty = Math.max(1, toNumber(quantity) || 1);
    const item = toGa4Item(product, qty, 0);

    return pushGa4Event('add_to_cart', {
        currency: CURRENCY,
        value: item.price * qty,
        items: [item]
    });
}

/**
 * begin_checkout
 */
export function trackGa4BeginCheckout({ items = [], value, currency = CURRENCY } = {}) {
    if (!canTrack()) {
        return false;
    }

    const ga4Items = toGa4Items(items);
    const total = value != null ? toNumber(value) : ga4Items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const dedupeKey = `${ga4Items.map((i) => i.item_id).sort().join(',')}|${total}`;

    if (lastBeginCheckoutKey === dedupeKey) {
        return false;
    }

    const ok = pushGa4Event('begin_checkout', {
        currency: currency || CURRENCY,
        value: total,
        items: ga4Items
    });

    if (ok) {
        lastBeginCheckoutKey = dedupeKey;
    }
    return ok;
}

/**
 * add_payment_info — when the customer proceeds to the payment provider.
 */
export function trackGa4AddPaymentInfo({ items = [], value, currency = CURRENCY, paymentType } = {}) {
    if (!canTrack()) {
        return false;
    }

    const ga4Items = toGa4Items(items);
    const total = value != null ? toNumber(value) : ga4Items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const dedupeKey = `${ga4Items.map((i) => i.item_id).sort().join(',')}|${total}`;

    if (lastAddPaymentInfoKey === dedupeKey) {
        return false;
    }

    const params = {
        currency: currency || CURRENCY,
        value: total,
        items: ga4Items
    };
    if (paymentType) {
        params.payment_type = paymentType;
    }

    const ok = pushGa4Event('add_payment_info', params);
    if (ok) {
        lastAddPaymentInfoKey = dedupeKey;
    }
    return ok;
}

/**
 * purchase — after confirmed successful payment.
 * Deduped in localStorage by transaction_id (survives refresh).
 */
export function trackGa4Purchase({
    transactionId,
    value,
    currency = CURRENCY,
    items = []
} = {}) {
    if (!canTrack()) {
        ga4Log('purchase skipped — analytics consent not granted', { transactionId });
        return false;
    }

    const id = transactionId != null ? String(transactionId) : '';
    if (!id) {
        ga4Warn('purchase skipped — missing transaction_id');
        return false;
    }

    if (wasPurchaseTracked(id)) {
        ga4Log('purchase skipped — already sent for this transaction', { transactionId: id });
        return false;
    }

    const ga4Items = Array.isArray(items) && items.length && items[0]?.item_id
        ? items.map((item, index) => ({
            item_id: String(item.item_id ?? item.id ?? ''),
            item_name: String(item.item_name ?? item.name_he ?? item.name_en ?? item.name ?? 'Item'),
            price: toNumber(item.price),
            quantity: Math.max(1, toNumber(item.quantity) || 1),
            index: item.index != null ? toNumber(item.index) : index
        })).filter((i) => i.item_id)
        : toGa4Items(items);

    const ok = pushGa4Event('purchase', {
        transaction_id: id,
        value: toNumber(value),
        currency: currency || CURRENCY,
        items: ga4Items
    });

    if (ok) {
        markPurchaseTracked(id);
        clearPendingGa4Purchase(id);
        ga4Log('purchase recorded', { transaction_id: id, items: ga4Items.length });
    } else {
        ga4Warn('purchase push failed', { transactionId: id });
    }

    return ok;
}

export function hasGa4PurchaseBeenTracked(transactionId) {
    if (transactionId == null) return false;
    return wasPurchaseTracked(String(transactionId));
}
