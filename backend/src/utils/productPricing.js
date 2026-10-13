/**
 * Product discount math — single source of truth for product pricing.
 * Mirrored by frontend/src/utils/productPricing.js; keep both in sync.
 *
 * The stored `price` column is always the regular price and is never overwritten;
 * the discounted price is derived from discount_enabled / discount_type / discount_value.
 * All math is done in agorot (integer cents) to avoid float drift.
 */

const DISCOUNT_TYPES = ['percentage', 'fixed'];

function toAgorot(value) {
    return Math.round(Number(value) * 100);
}

function isDiscountEnabled(value) {
    return value === true || value === 'true' || value === 1 || value === '1';
}

/**
 * @param {{ price, discount_enabled, discount_type, discount_value }} product
 * @returns {{
 *   regularPrice: number, finalPrice: number, discountAmount: number, hasDiscount: boolean,
 *   discountEnabled: boolean, discountType: 'percentage'|'fixed'|null, discountValue: number
 * }}
 */
function computeProductPricing(product) {
    const rawPrice = Number(product?.price);
    const regularAgorot = Number.isFinite(rawPrice) && rawPrice > 0 ? toAgorot(rawPrice) : 0;
    const regularPrice = regularAgorot / 100;

    const discountEnabled = isDiscountEnabled(product?.discount_enabled);
    const discountType = DISCOUNT_TYPES.includes(product?.discount_type) ? product.discount_type : null;
    const rawValue = Number(product?.discount_value);
    const discountValue = Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 0;

    const noDiscount = {
        regularPrice,
        finalPrice: regularPrice,
        discountAmount: 0,
        hasDiscount: false,
        discountEnabled,
        discountType,
        discountValue
    };

    if (!discountEnabled || !discountType || discountValue <= 0 || regularAgorot <= 0) {
        return noDiscount;
    }

    let discountAgorot;
    if (discountType === 'percentage') {
        discountAgorot = Math.round((regularAgorot * Math.min(discountValue, 100)) / 100);
    } else {
        discountAgorot = Math.min(toAgorot(discountValue), regularAgorot);
    }
    discountAgorot = Math.max(0, Math.min(discountAgorot, regularAgorot));

    if (discountAgorot === 0) return noDiscount;

    return {
        ...noDiscount,
        finalPrice: (regularAgorot - discountAgorot) / 100,
        discountAmount: discountAgorot / 100,
        hasDiscount: true
    };
}

/**
 * Validate admin discount input against a regular price.
 * Disabled discounts keep their type/value so re-enabling restores them.
 * @returns {{ ok: true, values: { discount_enabled, discount_type, discount_value } } | { ok: false, error: string }}
 */
function validateDiscountSettings({ price, discount_enabled, discount_type, discount_value }) {
    const enabled = isDiscountEnabled(discount_enabled);
    const type = discount_type == null || discount_type === '' ? null : String(discount_type);
    const hasValue = discount_value !== undefined && discount_value !== null && discount_value !== '';
    const value = hasValue ? Number(discount_value) : null;

    if (type !== null && !DISCOUNT_TYPES.includes(type)) {
        return { ok: false, error: 'Discount type must be "percentage" or "fixed"' };
    }
    if (hasValue && (!Number.isFinite(value) || value < 0)) {
        return { ok: false, error: 'Discount value must be a non-negative number' };
    }

    if (enabled) {
        const regular = Number(price);
        if (!Number.isFinite(regular) || regular <= 0) {
            return { ok: false, error: 'A discount requires a regular price greater than zero' };
        }
        if (!type) {
            return { ok: false, error: 'Choose a discount type' };
        }
        if (!hasValue || value <= 0) {
            return { ok: false, error: 'Discount value must be greater than zero' };
        }
        if (type === 'percentage' && value >= 100) {
            return { ok: false, error: 'Percentage discount must be less than 100%' };
        }
        if (type === 'fixed' && toAgorot(value) >= toAgorot(regular)) {
            return { ok: false, error: 'Fixed discount must be less than the regular price' };
        }
    }

    return {
        ok: true,
        values: {
            discount_enabled: enabled,
            discount_type: type,
            discount_value: hasValue ? Math.round(value * 100) / 100 : null
        }
    };
}

/**
 * Re-price checkout line items from the product catalog (never trust client prices).
 * Rejects when a client-sent unit price differs from the current server price by more than 1 agora,
 * so the customer is never charged an amount they did not see.
 * @returns {{ ok: true, items: object[], subtotal: number } | { ok: false, error: string, details: object[] }}
 */
function priceCheckoutItems(items, products) {
    const byId = new Map((products || []).map((p) => [String(p.id), p]));
    const priced = [];
    const mismatches = [];

    for (const item of items || []) {
        const product = byId.get(String(item.id));
        if (!product) {
            return { ok: false, error: 'unknown_product', details: [{ id: item.id }] };
        }
        const pricing = computeProductPricing(product);
        if (Math.abs(toAgorot(item.price) - toAgorot(pricing.finalPrice)) > 1) {
            mismatches.push({ id: item.id, client: Number(item.price), server: pricing.finalPrice });
        }
        priced.push({
            ...item,
            price: pricing.finalPrice,
            ...(pricing.hasDiscount ? { regular_price: pricing.regularPrice } : {})
        });
    }

    if (mismatches.length) {
        return { ok: false, error: 'price_changed', details: mismatches };
    }

    const subtotalAgorot = priced.reduce((sum, i) => sum + toAgorot(i.price) * i.quantity, 0);
    return { ok: true, items: priced, subtotal: subtotalAgorot / 100 };
}

module.exports = {
    DISCOUNT_TYPES,
    computeProductPricing,
    validateDiscountSettings,
    priceCheckoutItems,
    isDiscountEnabled
};
