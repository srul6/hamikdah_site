/**
 * Client-side product pricing (mirrors backend/src/utils/productPricing.js — keep in sync).
 * `product.price` is always the regular price; the discounted price is derived, never stored.
 */

export const DISCOUNT_TYPES = ['percentage', 'fixed'];

function toAgorot(value) {
    return Math.round(Number(value) * 100);
}

function isDiscountEnabled(value) {
    return value === true || value === 'true' || value === 1 || value === '1';
}

export function computeProductPricing(product) {
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

/** Same rules as the backend validator; returns an error string or null. */
export function validateDiscountSettings({ price, discount_enabled, discount_type, discount_value }) {
    const hasType = discount_type != null && discount_type !== '';
    const hasValue = discount_value !== '' && discount_value != null;
    const value = Number(discount_value);
    if (hasType && !DISCOUNT_TYPES.includes(discount_type)) return 'Discount type must be "percentage" or "fixed"';
    if (hasValue && (!Number.isFinite(value) || value < 0)) return 'Discount value must be a non-negative number';
    if (!isDiscountEnabled(discount_enabled)) return null;
    const regular = Number(price);
    if (!Number.isFinite(regular) || regular <= 0) return 'A discount requires a regular price greater than zero';
    if (!DISCOUNT_TYPES.includes(discount_type)) return 'Choose a discount type';
    if (discount_value === '' || discount_value == null || !Number.isFinite(value) || value <= 0) {
        return 'Discount value must be greater than zero';
    }
    if (discount_type === 'percentage' && value >= 100) return 'Percentage discount must be less than 100%';
    if (discount_type === 'fixed' && toAgorot(value) >= toAgorot(regular)) {
        return 'Fixed discount must be less than the regular price';
    }
    return null;
}

/**
 * Cart line pricing. Cart items store the charged unit price in `price` and the list price in
 * `regularPrice`; they carry no discount config, so the discount can never be applied twice.
 */
export function getCartLinePricing(item) {
    const finalPrice = Number(item?.price) || 0;
    const regular = Number(item?.regularPrice);
    const regularPrice = Number.isFinite(regular) && regular > finalPrice ? regular : finalPrice;
    return { regularPrice, finalPrice, hasDiscount: regularPrice > finalPrice };
}

/** Build the price fields stored on a cart item from a catalog product. */
export function cartPriceFieldsFromProduct(product) {
    const pricing = computeProductPricing(product);
    return {
        price: pricing.finalPrice,
        regularPrice: pricing.regularPrice
    };
}

/** Strip catalog discount config so cart items are priced only by price/regularPrice. */
export function stripDiscountConfig(obj) {
    const {
        discount_enabled, discount_type, discount_value,
        finalPrice, discountAmount, hasDiscount,
        ...rest
    } = obj || {};
    return rest;
}

export function formatShekel(amount) {
    return `₪${(Number(amount) || 0).toFixed(2)}`;
}
