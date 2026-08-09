/**
 * Product URL slug helpers (shared rules with the frontend).
 * Used for HTTP 301 redirects and sitemap generation on Express.
 */

const HEBREW_AND_WORD = /[^\u0590-\u05FFa-zA-Z0-9\-]+/g;

function slugifyProductName(name) {
    if (name == null) return '';
    const raw = String(name).trim().normalize('NFC');
    if (!raw) return '';
    return raw
        .replace(/\s+/g, '-')
        .replace(HEBREW_AND_WORD, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function baseSlugForProduct(product) {
    if (!product) return '';
    return (
        slugifyProductName(product.name_he) ||
        slugifyProductName(product.name_en) ||
        (product.id != null ? `product-${product.id}` : '')
    );
}

function buildProductSlugMap(products = []) {
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

function getProductSlug(product, allProducts = null) {
    if (!product) return '';
    if (Array.isArray(allProducts) && allProducts.length > 0) {
        const map = buildProductSlugMap(allProducts);
        return map.get(Number(product.id)) || map.get(String(product.id)) || baseSlugForProduct(product);
    }
    return baseSlugForProduct(product);
}

function isNumericProductParam(param) {
    if (param == null || param === '') return false;
    return /^\d+$/.test(String(param).trim());
}

module.exports = {
    slugifyProductName,
    getProductSlug,
    buildProductSlugMap,
    isNumericProductParam
};
