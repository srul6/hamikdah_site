/**
 * Bundle URL helpers — mirror productSlug path/decode conventions.
 * Bundle slugs are stored on the bundle row (stable after create).
 */

/**
 * Public bundle path, e.g. `/bundle/המקדש-מיני-מקדש`.
 * Encodes Hebrew characters for safe Link / navigate URLs.
 */
export function getBundlePath(bundle) {
    if (!bundle) return '/';
    const slug = bundle.slug != null ? String(bundle.slug).trim() : '';
    if (!slug) return '/';
    return `/bundle/${encodeURIComponent(slug)}`;
}

/**
 * Decode a route `:slug` param (React Router may already decode once).
 */
export function decodeBundleSlugParam(rawSlug) {
    if (rawSlug == null) return '';
    let decoded = String(rawSlug).trim();
    try {
        decoded = decodeURIComponent(decoded);
    } catch {
        // keep raw
    }
    return decoded;
}

/**
 * Find a bundle whose slug matches the URL param.
 */
export function findBundleBySlug(bundles, rawSlug) {
    if (!Array.isArray(bundles) || rawSlug == null) return null;
    const decoded = decodeBundleSlugParam(rawSlug);
    if (!decoded) return null;
    return bundles.find((b) => String(b?.slug || '').trim() === decoded) || null;
}
