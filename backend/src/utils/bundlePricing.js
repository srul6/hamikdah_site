/**
 * Bundle pricing and availability — pure helpers for the bundles feature.
 * Component prices use computeProductPricing (same as productController).
 */

const { computeProductPricing } = require('./productPricing');

const PRICE_ABOVE_CURRENT_COMPONENTS_WARNING =
    'המחיר גבוה ממחיר הרכישה הנפרדת הנוכחי של המוצרים (בגלל הנחות מוצר)';

/**
 * @param {{ price: number }} bundle
 * @param {object[]} componentProducts — product rows (with price + discount fields)
 * @returns {{
 *   regularPrice: number,
 *   finalPrice: number,
 *   hasDiscount: boolean,
 *   discountAmount: number,
 *   savingsPercent: number,
 *   currentComponentsPrice: number,
 *   available: boolean,
 *   maxQuantity: number
 * }}
 */
function computeBundlePricing(bundle, componentProducts = []) {
    const components = Array.isArray(componentProducts) ? componentProducts : [];

    let regularAgorot = 0;
    let currentAgorot = 0;
    for (const product of components) {
        const pricing = computeProductPricing(product);
        // Struck-through "original" = sum of list prices (before any product discount)
        regularAgorot += Math.round(Number(pricing.regularPrice) * 100);
        // Current buy-separately total = sum of effective (discounted) prices
        currentAgorot += Math.round(Number(pricing.finalPrice) * 100);
    }
    const regularPrice = regularAgorot / 100;
    const currentComponentsPrice = currentAgorot / 100;

    const rawBundlePrice = Number(bundle?.price);
    const finalAgorot =
        Number.isFinite(rawBundlePrice) && rawBundlePrice > 0
            ? Math.round(rawBundlePrice * 100)
            : 0;
    const finalPrice = finalAgorot / 100;

    const discountAmount = Math.max(0, (regularAgorot - finalAgorot) / 100);
    const hasDiscount = finalPrice < regularPrice && regularPrice > 0;
    const savingsPercent =
        hasDiscount && regularPrice > 0
            ? Math.round((discountAmount / regularPrice) * 100)
            : 0;

    const quantities = components.map((p) => {
        const q = Number(p?.quantity);
        return Number.isFinite(q) ? q : 0;
    });
    const available =
        components.length > 0 && quantities.every((q) => q > 0);
    const maxQuantity = available ? Math.min(...quantities) : 0;

    return {
        regularPrice,
        finalPrice,
        hasDiscount,
        discountAmount,
        savingsPercent,
        currentComponentsPrice,
        available,
        maxQuantity
    };
}

/**
 * Non-blocking warnings when the bundle is still valid vs list prices
 * but not cheaper than buying components at their current discounted prices.
 */
function bundlePriceWarnings(pricing) {
    const warnings = [];
    if (!pricing) return warnings;
    const finalPrice = Number(pricing.finalPrice);
    const current = Number(pricing.currentComponentsPrice);
    if (
        Number.isFinite(finalPrice) &&
        Number.isFinite(current) &&
        current > 0 &&
        finalPrice >= current
    ) {
        warnings.push(PRICE_ABOVE_CURRENT_COMPONENTS_WARNING);
    }
    return warnings;
}

/**
 * Validate create/update payload.
 * @returns {{ ok: true, values: object, warnings: string[] } | { ok: false, error: string }}
 */
function validateBundleInput({ productIds, price, image, componentProducts }) {
    const ids = Array.isArray(productIds)
        ? productIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
        : [];

    const unique = [...new Set(ids)];
    if (unique.length !== ids.length) {
        return { ok: false, error: 'לא ניתן לבחור את אותו מוצר יותר מפעם אחת בבאנדל' };
    }
    if (unique.length < 2) {
        return { ok: false, error: 'באנדל חייב לכלול לפחות 2 מוצרים שונים' };
    }
    if (unique.length > 4) {
        return { ok: false, error: 'באנדל יכול לכלול עד 4 מוצרים' };
    }

    const products = Array.isArray(componentProducts) ? componentProducts : [];
    if (products.length !== unique.length) {
        return { ok: false, error: 'אחד או יותר מהמוצרים שנבחרו לא נמצאו' };
    }

    const foundIds = new Set(products.map((p) => Number(p.id)));
    for (const id of unique) {
        if (!foundIds.has(id)) {
            return { ok: false, error: 'אחד או יותר מהמוצרים שנבחרו לא נמצאו' };
        }
    }

    const rawPrice = Number(price);
    if (!Number.isFinite(rawPrice) || rawPrice <= 0) {
        return { ok: false, error: 'מחיר הבאנדל חייב להיות גדול מאפס' };
    }

    const orderedProducts = unique.map((id) => products.find((p) => Number(p.id) === id));
    const pricing = computeBundlePricing({ price: rawPrice }, orderedProducts);
    if (!(rawPrice < pricing.regularPrice)) {
        return {
            ok: false,
            error: `מחיר הבאנדל חייב להיות נמוך מסכום מחירי המוצרים (₪${pricing.regularPrice.toFixed(2)})`
        };
    }

    let imageUrl = null;
    if (image != null && image !== '') {
        if (typeof image !== 'string') {
            return { ok: false, error: 'כתובת התמונה אינה תקינה' };
        }
        const trimmed = image.trim();
        if (!trimmed) {
            imageUrl = null;
        } else if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('/')) {
            return { ok: false, error: 'כתובת התמונה אינה תקינה' };
        } else {
            imageUrl = trimmed;
        }
    }

    return {
        ok: true,
        values: {
            productIds: unique,
            price: Math.round(rawPrice * 100) / 100,
            image: imageUrl,
            regularPrice: pricing.regularPrice,
            currentComponentsPrice: pricing.currentComponentsPrice
        },
        warnings: bundlePriceWarnings(pricing)
    };
}

/**
 * Build automatic bilingual bundle names from ordered component products.
 */
function buildBundleNames(orderedProducts = []) {
    const he = orderedProducts
        .map((p) => String(p?.name_he || p?.name_en || '').trim())
        .filter(Boolean)
        .join(' + ');
    const en = orderedProducts
        .map((p) => String(p?.name_en || p?.name_he || '').trim())
        .filter(Boolean)
        .join(' + ');
    return { name_he: he, name_en: en };
}

module.exports = {
    computeBundlePricing,
    validateBundleInput,
    buildBundleNames,
    bundlePriceWarnings,
    PRICE_ABOVE_CURRENT_COMPONENTS_WARNING
};
