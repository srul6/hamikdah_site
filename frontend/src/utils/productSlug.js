/**
 * Hebrew-friendly product URL slug helpers.
 * Slugs are for public SEO URLs only — database product.id remains the internal key.
 */

const HEBREW_AND_WORD = /[^\u0590-\u05FFa-zA-Z0-9\-]+/g;

/**
 * Convert a product display name into a deterministic URL slug.
 * Preserves Hebrew letters; whitespace → `-`.
 */
export function slugifyProductName(name) {
    if (name == null) return '';
    const raw = String(name).trim().normalize('NFC');
    if (!raw) return '';

    return raw
        .replace(/\s+/g, '-')
        .replace(HEBREW_AND_WORD, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * True when the route param is an old numeric product ID URL.
 */
export function isNumericProductParam(param) {
    if (param == null || param === '') return false;
    return /^\d+$/.test(String(param).trim());
}

/**
 * Special Second Temple product classification (data-driven, not URL-driven).
 */
export function isMikdashProduct(product) {
    if (!product) return false;
    const he = product.name_he && String(product.name_he).trim();
    const en = product.name_en && String(product.name_en).trim().toLowerCase();
    return he === 'המקדש' || en === 'the temple';
}

function baseSlugForProduct(product) {
    if (!product) return '';
    return (
        slugifyProductName(product.name_he) ||
        slugifyProductName(product.name_en) ||
        (product.id != null ? `product-${product.id}` : '')
    );
}

/**
 * Build id → unique slug map.
 * Collision strategy: ascending id keeps the bare slug; later collisions get `-{id}`.
 */
export function buildProductSlugMap(products = []) {
    const sorted = [...products].sort((a, b) => Number(a.id) - Number(b.id));
    const used = new Set();
    const map = new Map();

    for (const product of sorted) {
        if (product == null || product.id == null) continue;
        const base = baseSlugForProduct(product) || `product-${product.id}`;
        let slug = base;
        if (used.has(slug)) {
            slug = `${base}-${product.id}`;
        }
        used.add(slug);
        map.set(Number(product.id), slug);
        map.set(String(product.id), slug);
    }

    return map;
}

/**
 * Canonical Hebrew slug for a product.
 * Pass `allProducts` when available so collisions get a stable `-{id}` suffix.
 */
export function getProductSlug(product, allProducts = null) {
    if (!product) return '';
    if (Array.isArray(allProducts) && allProducts.length > 0) {
        const map = buildProductSlugMap(allProducts);
        const fromMap = map.get(Number(product.id)) || map.get(String(product.id));
        if (fromMap) return fromMap;
    }
    return baseSlugForProduct(product);
}

/**
 * Public product path, e.g. `/product/ערכת-המקדש`.
 */
export function getProductPath(product, allProducts = null) {
    const slug = getProductSlug(product, allProducts);
    if (!slug) return '/';
    return `/product/${slug}`;
}

/**
 * Find a product whose unique slug matches the URL param (decoded).
 */
export function findProductBySlug(products, rawSlug) {
    if (!Array.isArray(products) || rawSlug == null) return null;

    let decoded = String(rawSlug).trim();
    try {
        decoded = decodeURIComponent(decoded);
    } catch {
        // keep raw
    }

    if (!decoded) return null;

    const map = buildProductSlugMap(products);
    for (const product of products) {
        const slug = map.get(Number(product.id)) || map.get(String(product.id));
        if (slug === decoded) {
            return product;
        }
    }

    // Fallback: bare name slug match (unique names)
    const matches = products.filter((p) => baseSlugForProduct(p) === decoded);
    if (matches.length === 1) return matches[0];

    return null;
}
