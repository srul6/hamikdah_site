/**
 * Product URL slug helpers (shared rules with the frontend).
 * Used for HTTP 301 redirects, sitemap, newsletter links, and create/update validation.
 */

const HEBREW_AND_WORD = /[^\u0590-\u05FFa-zA-Z0-9\-]+/g;
const SLUG_FORMAT_RE = /^[\u0590-\u05FFa-zA-Z0-9-]+$/;
const SPECIAL_PAGES = new Set(['mikdash', 'third_temple']);

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

function normalizeOverrideSlug(product) {
    if (!product) return null;
    const raw = product.slug != null ? product.slug : null;
    if (raw == null) return null;
    const s = String(raw).trim();
    return s || null;
}

function getSpecialPage(product) {
    if (!product) return null;
    const raw =
        product.specialPage !== undefined
            ? product.specialPage
            : product.special_page !== undefined
              ? product.special_page
              : undefined;
    if (raw == null || raw === '') return null;
    const s = String(raw).trim();
    return s || null;
}

function isMikdashProduct(product) {
    return getSpecialPage(product) === 'mikdash';
}

function isThirdTempleProduct(product) {
    return getSpecialPage(product) === 'third_temple';
}

/**
 * Legacy name-matching used ONLY to seed special_page when it is still NULL.
 * Never used at runtime for page routing. Safe to expand; callers must not overwrite
 * an existing special_page value.
 */
function matchLegacySpecialPageByName(product) {
    if (!product) return null;
    const he = product.name_he != null ? String(product.name_he).trim() : '';
    const en =
        product.name_en != null ? String(product.name_en).trim().toLowerCase() : '';
    if (
        he === 'המקדש' ||
        he === 'ערכת המקדש' ||
        en === 'the temple' ||
        en === 'the second mikdash' ||
        en === 'the second temple'
    ) {
        return 'mikdash';
    }
    if (he === 'בית המקדש השלישי' || en === 'the third temple') {
        return 'third_temple';
    }
    return null;
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
 * Override slugs win exactly (no collision suffix) and are reserved so
 * computed slugs never collide with them.
 */
function buildProductSlugMap(products = []) {
    const sorted = [...products].sort((a, b) => Number(a.id) - Number(b.id));
    const used = new Set();
    const map = new Map();

    for (const product of sorted) {
        if (product == null || product.id == null) continue;
        const override = normalizeOverrideSlug(product);
        if (override) {
            used.add(override);
            map.set(Number(product.id), override);
            map.set(String(product.id), override);
        }
    }

    for (const product of sorted) {
        if (product == null || product.id == null) continue;
        if (normalizeOverrideSlug(product)) continue;
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
    const override = normalizeOverrideSlug(product);
    if (override) return override;
    if (Array.isArray(allProducts) && allProducts.length > 0) {
        const map = buildProductSlugMap(allProducts);
        return (
            map.get(Number(product.id)) ||
            map.get(String(product.id)) ||
            baseSlugForProduct(product)
        );
    }
    return baseSlugForProduct(product);
}

function getProductPath(product, allProducts = null) {
    const slug = getProductSlug(product, allProducts);
    if (!slug) return '/';
    return `/product/${slug}`;
}

function findProductBySlug(products, rawSlug) {
    if (!Array.isArray(products) || rawSlug == null) return null;

    let decoded = String(rawSlug).trim();
    try {
        decoded = decodeURIComponent(decoded);
    } catch {
        // keep raw
    }
    if (!decoded) return null;

    for (const product of products) {
        const override = normalizeOverrideSlug(product);
        if (override && override === decoded) return product;
    }

    const map = buildProductSlugMap(products);
    for (const product of products) {
        if (product == null || product.id == null) continue;
        const slug = map.get(Number(product.id)) || map.get(String(product.id));
        if (slug === decoded) return product;
    }

    const matches = products.filter((p) => baseSlugForProduct(p) === decoded);
    if (matches.length === 1) return matches[0];

    return null;
}

function isNumericProductParam(param) {
    if (param == null || param === '') return false;
    return /^\d+$/.test(String(param).trim());
}

/**
 * Validate optional slug string.
 * @returns {{ ok: true, value: string|null } | { ok: false, message: string }}
 */
function validateProductSlugInput(raw) {
    if (raw == null || raw === '') {
        return { ok: true, value: null };
    }
    if (typeof raw !== 'string') {
        return { ok: false, message: 'כתובת הדף חייבת להיות מחרוזת' };
    }
    const s = raw.trim();
    if (!s) return { ok: true, value: null };
    if (s.length < 1 || s.length > 100) {
        return { ok: false, message: 'כתובת הדף חייבת להיות בין 1 ל־100 תווים' };
    }
    if (/\s/.test(s) || /[/.?#&=]/.test(s)) {
        return {
            ok: false,
            message: 'כתובת הדף אינה יכולה להכיל רווחים, קווים נטויים, נקודות או תווי שאילתה'
        };
    }
    if (s.startsWith('-') || s.endsWith('-')) {
        return { ok: false, message: 'כתובת הדף אינה יכולה להתחיל או להסתיים במקף' };
    }
    if (!SLUG_FORMAT_RE.test(s)) {
        return {
            ok: false,
            message: 'כתובת הדף יכולה להכיל רק אותיות עבריות/לטיניות, ספרות ומקפים'
        };
    }
    return { ok: true, value: s };
}

/**
 * @returns {{ ok: true, value: string|null } | { ok: false, message: string }}
 */
function validateSpecialPageInput(raw) {
    if (raw == null || raw === '') {
        return { ok: true, value: null };
    }
    const s = String(raw).trim();
    if (!s) return { ok: true, value: null };
    if (!SPECIAL_PAGES.has(s)) {
        return {
            ok: false,
            message: 'סוג דף מוצר לא תקין (רגיל / המקדש / בית המקדש השלישי)'
        };
    }
    return { ok: true, value: s };
}

/**
 * Ensure proposedSlug does not equal any OTHER product's effective slug.
 * @returns {{ ok: true } | { ok: false, message: string, conflictProduct?: object }}
 */
function assertSlugAvailable(proposedSlug, allProducts, excludeProductId = null) {
    if (!proposedSlug) return { ok: true };
    const list = Array.isArray(allProducts) ? allProducts : [];
    for (const other of list) {
        if (other == null || other.id == null) continue;
        if (
            excludeProductId != null &&
            Number(other.id) === Number(excludeProductId)
        ) {
            continue;
        }
        const effective = getProductSlug(other, list);
        if (effective === proposedSlug) {
            const label = other.name_he || other.name_en || `#${other.id}`;
            return {
                ok: false,
                message: `כתובת הדף תפוסה על ידי המוצר "${label}"`,
                conflictProduct: other
            };
        }
    }
    return { ok: true };
}

/**
 * Compute a stored slug for a brand-new product (collision-aware).
 */
function allocateInitialSlug(productLike, existingProducts = []) {
    const list = Array.isArray(existingProducts) ? existingProducts : [];
    const used = new Set();
    for (const p of list) {
        const eff = getProductSlug(p, list);
        if (eff) used.add(eff);
        const ov = normalizeOverrideSlug(p);
        if (ov) used.add(ov);
    }
    const base =
        slugifyProductName(productLike?.name_he) ||
        slugifyProductName(productLike?.name_en) ||
        'product';
    let candidate = base || 'product';
    if (!used.has(candidate)) return candidate;
    // Prefer id suffix when available; otherwise numeric counter
    if (productLike?.id != null) {
        const withId = `${base}-${productLike.id}`;
        if (!used.has(withId)) return withId;
    }
    let n = 2;
    while (used.has(`${base}-${n}`)) n += 1;
    return `${base}-${n}`;
}

module.exports = {
    SPECIAL_PAGES,
    slugifyProductName,
    getProductSlug,
    getProductPath,
    buildProductSlugMap,
    findProductBySlug,
    isNumericProductParam,
    isMikdashProduct,
    isThirdTempleProduct,
    getSpecialPage,
    matchLegacySpecialPageByName,
    validateProductSlugInput,
    validateSpecialPageInput,
    assertSlugAvailable,
    allocateInitialSlug,
    normalizeOverrideSlug,
    baseSlugForProduct
};
