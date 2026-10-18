/**
 * Pure validation helpers for promo slides (Hebrew error messages).
 */

const LINK_TYPES = new Set(['none', 'page', 'section', 'external']);
const SECTION_KEY_RE = /^[a-z0-9_-]{1,40}$/;
const MAX_ALT = 200;
const MAX_PAGE = 300;
const MAX_EXTERNAL = 500;
const MAX_IMAGE = 2000;

function trimOrNull(value) {
    if (value == null) return null;
    const s = String(value).trim();
    return s ? s : null;
}

function isValidImageUrl(value, { required }) {
    if (value == null || value === '') {
        return required ? false : true;
    }
    if (typeof value !== 'string') return false;
    const s = value.trim();
    if (!s) return required ? false : true;
    if (s.length > MAX_IMAGE) return false;
    if (/\s/.test(s)) return false;
    // Absolute URLs: http(s) only
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) {
        return /^https?:\/\//i.test(s);
    }
    return true;
}

/**
 * Validate / normalize a promo slide payload.
 * @returns {{ ok: true, value: object } | { ok: false, message: string }}
 */
function validatePromoSlideInput(raw = {}, { partial = false } = {}) {
    const src = raw && typeof raw === 'object' ? raw : {};

    const imageRaw = src.image !== undefined ? src.image : undefined;
    const imageMobileRaw =
        src.imageMobile !== undefined
            ? src.imageMobile
            : src.image_mobile !== undefined
              ? src.image_mobile
              : undefined;
    const altHeRaw =
        src.altHe !== undefined ? src.altHe : src.alt_he !== undefined ? src.alt_he : undefined;
    const altEnRaw =
        src.altEn !== undefined ? src.altEn : src.alt_en !== undefined ? src.alt_en : undefined;
    const linkTypeRaw =
        src.linkType !== undefined
            ? src.linkType
            : src.link_type !== undefined
              ? src.link_type
              : undefined;
    const linkTargetRaw =
        src.linkTarget !== undefined
            ? src.linkTarget
            : src.link_target !== undefined
              ? src.link_target
              : undefined;
    const openInNewTabRaw =
        src.openInNewTab !== undefined
            ? src.openInNewTab
            : src.open_in_new_tab !== undefined
              ? src.open_in_new_tab
              : undefined;
    const isActiveRaw =
        src.isActive !== undefined
            ? src.isActive
            : src.is_active !== undefined
              ? src.is_active
              : undefined;
    const sortOrderRaw =
        src.sortOrder !== undefined
            ? src.sortOrder
            : src.sort_order !== undefined
              ? src.sort_order
              : undefined;

    // --- image ---
    if (!partial || imageRaw !== undefined) {
        if (!isValidImageUrl(imageRaw, { required: true })) {
            return { ok: false, message: 'תמונת דסקטופ נדרשת וחייבת להיות כתובת תקינה' };
        }
    }

    // --- image_mobile (optional) ---
    if (imageMobileRaw !== undefined && imageMobileRaw !== null && imageMobileRaw !== '') {
        if (!isValidImageUrl(imageMobileRaw, { required: false })) {
            return { ok: false, message: 'תמונת מובייל חייבת להיות כתובת תקינה' };
        }
    }

    // --- alt texts ---
    const altHe = altHeRaw !== undefined ? trimOrNull(altHeRaw) : undefined;
    const altEn = altEnRaw !== undefined ? trimOrNull(altEnRaw) : undefined;
    if (altHe != null && altHe.length > MAX_ALT) {
        return { ok: false, message: `טקסט חלופי בעברית מוגבל ל-${MAX_ALT} תווים` };
    }
    if (altEn != null && altEn.length > MAX_ALT) {
        return { ok: false, message: `טקסט חלופי באנגלית מוגבל ל-${MAX_ALT} תווים` };
    }

    // --- link type ---
    let linkType = 'none';
    if (linkTypeRaw !== undefined) {
        const t = String(linkTypeRaw).trim().toLowerCase();
        if (!LINK_TYPES.has(t)) {
            return {
                ok: false,
                message: 'סוג קישור לא תקין (none / page / section / external)'
            };
        }
        linkType = t;
    } else if (partial) {
        linkType = undefined;
    }

    // --- link target (depends on type) ---
    let linkTarget = null;
    const targetProvided = linkTargetRaw !== undefined;
    const targetStr = targetProvided ? trimOrNull(linkTargetRaw) : null;

    if (linkType === 'none') {
        linkTarget = null;
    } else if (linkType === 'page') {
        if (!targetStr) {
            return { ok: false, message: 'נתיב פנימי נדרש עבור קישור מסוג עמוד' };
        }
        if (targetStr.length > MAX_PAGE) {
            return { ok: false, message: `נתיב פנימי מוגבל ל-${MAX_PAGE} תווים` };
        }
        if (!targetStr.startsWith('/') || targetStr.startsWith('//')) {
            return {
                ok: false,
                message: 'נתיב פנימי חייב להתחיל ב־"/" בודד ולא ב־"//"'
            };
        }
        if (targetStr.includes('://') || /\s/.test(targetStr)) {
            return { ok: false, message: 'נתיב פנימי אינו יכול להכיל כתובת מלאה או רווחים' };
        }
        linkTarget = targetStr;
    } else if (linkType === 'section') {
        if (!targetStr || !SECTION_KEY_RE.test(targetStr)) {
            return {
                ok: false,
                message: 'מפתח סקציה חייב להיות אותיות קטנות, ספרות, מקף או קו תחתון (עד 40 תווים)'
            };
        }
        linkTarget = targetStr;
    } else if (linkType === 'external') {
        if (!targetStr) {
            return { ok: false, message: 'כתובת חיצונית נדרשת' };
        }
        if (targetStr.length > MAX_EXTERNAL) {
            return { ok: false, message: `כתובת חיצונית מוגבלת ל-${MAX_EXTERNAL} תווים` };
        }
        let parsed;
        try {
            parsed = new URL(targetStr);
        } catch {
            return { ok: false, message: 'כתובת חיצונית אינה תקינה' };
        }
        const protocol = (parsed.protocol || '').toLowerCase();
        if (protocol !== 'http:' && protocol !== 'https:') {
            return {
                ok: false,
                message: 'כתובת חיצונית חייבת להתחיל ב־http או https בלבד'
            };
        }
        linkTarget = targetStr;
    } else if (linkType === undefined && partial && targetProvided) {
        // Partial update without linkType: still validate target loosely only if type known elsewhere
        linkTarget = targetStr;
    }

    const openInNewTab =
        openInNewTabRaw !== undefined ? !!openInNewTabRaw : partial ? undefined : false;
    const isActive = isActiveRaw !== undefined ? !!isActiveRaw : partial ? undefined : true;

    let sortOrder;
    if (sortOrderRaw !== undefined) {
        const n = parseInt(sortOrderRaw, 10);
        sortOrder = Number.isFinite(n) ? n : 0;
    } else if (!partial) {
        sortOrder = 0;
    }

    const value = {};
    if (!partial || imageRaw !== undefined) {
        value.image = String(imageRaw).trim();
    }
    if (imageMobileRaw !== undefined) {
        value.imageMobile = trimOrNull(imageMobileRaw);
    } else if (!partial) {
        value.imageMobile = null;
    }
    if (altHeRaw !== undefined) {
        value.altHe = altHe;
    } else if (!partial) {
        value.altHe = null;
    }
    if (altEnRaw !== undefined) {
        value.altEn = altEn;
    } else if (!partial) {
        value.altEn = null;
    }
    if (linkType !== undefined) {
        value.linkType = linkType;
        value.linkTarget = linkType === 'none' ? null : linkTarget;
    } else if (partial && targetProvided) {
        value.linkTarget = linkTarget;
    }
    if (openInNewTab !== undefined) value.openInNewTab = openInNewTab;
    if (isActive !== undefined) value.isActive = isActive;
    if (sortOrder !== undefined) value.sortOrder = sortOrder;

    return { ok: true, value };
}

/**
 * Validate an ordered list of ids for reorder.
 * @param {unknown} orderedIds
 * @param {number[]} existingIds — all current slide ids
 * @returns {{ ok: true, ids: number[] } | { ok: false, message: string }}
 */
function validateReorderIds(orderedIds, existingIds = []) {
    if (!Array.isArray(orderedIds)) {
        return { ok: false, message: 'יש לשלוח מערך מזהים ממוין' };
    }
    const existing = existingIds.map((id) => Number(id)).filter((n) => Number.isFinite(n));
    const existingSet = new Set(existing);
    const seen = new Set();
    const ids = [];

    for (const raw of orderedIds) {
        const id = Number(raw);
        if (!Number.isFinite(id) || !Number.isInteger(id)) {
            return { ok: false, message: 'מזהה שקופית אינו תקין' };
        }
        if (!existingSet.has(id)) {
            return { ok: false, message: 'מזהה שקופית לא קיים' };
        }
        if (seen.has(id)) {
            return { ok: false, message: 'מזהה שקופית מופיע יותר מפעם אחת' };
        }
        seen.add(id);
        ids.push(id);
    }

    if (ids.length !== existing.length) {
        return { ok: false, message: 'יש לכלול את כל השקופיות בסדר החדש' };
    }

    return { ok: true, ids };
}

/**
 * Build sort_order map from ordered ids (0-based index).
 */
function buildSortOrderMap(orderedIds) {
    const map = new Map();
    (orderedIds || []).forEach((id, index) => {
        map.set(Number(id), index);
    });
    return map;
}

module.exports = {
    LINK_TYPES,
    SECTION_KEY_RE,
    validatePromoSlideInput,
    validateReorderIds,
    buildSortOrderMap,
    isValidImageUrl
};
