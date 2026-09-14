/**
 * Client-side gift slot helpers (mirrors backend/src/utils/giftSlots.js).
 */

export function requiredSlotCount(quantity, giftsPerUnit) {
    const qty = Math.max(0, parseInt(quantity, 10) || 0);
    const per = Math.max(0, parseInt(giftsPerUnit, 10) || 0);
    return qty * per;
}

export function buildSlots({ quantity, giftsPerUnit }) {
    const qty = Math.max(0, parseInt(quantity, 10) || 0);
    const per = Math.max(0, parseInt(giftsPerUnit, 10) || 0);
    const slots = [];
    for (let unitIndex = 0; unitIndex < qty; unitIndex += 1) {
        for (let local = 0; local < per; local += 1) {
            slots.push({
                slotIndex: unitIndex * per + local,
                unitIndex,
                localIndex: local
            });
        }
    }
    return slots;
}

export function autoAssignIfSingleBook(slots, bookIds) {
    const ids = Array.isArray(bookIds) ? bookIds.filter((id) => id != null && id !== '') : [];
    if (ids.length !== 1) return null;
    const only = ids[0];
    const map = {};
    for (const s of slots) {
        map[String(s.slotIndex)] = only;
    }
    return map;
}

export function resizeSelections(existingMap, newSlotCount) {
    const prev = existingMap && typeof existingMap === 'object' ? existingMap : {};
    const next = {};
    for (let i = 0; i < newSlotCount; i += 1) {
        const key = String(i);
        if (prev[i] != null) next[key] = prev[i];
        else if (prev[key] != null) next[key] = prev[key];
    }
    return next;
}

export function flattenGiftSelections(giftSelections, cartItems = []) {
    const out = [];
    if (!giftSelections || typeof giftSelections !== 'object') return out;
    const productByUnique = new Map();
    for (const item of cartItems || []) {
        const uid = String(item.uniqueId != null ? item.uniqueId : item.id);
        productByUnique.set(uid, item.id);
    }
    for (const [cartUniqueId, slots] of Object.entries(giftSelections)) {
        if (!slots || typeof slots !== 'object') continue;
        for (const [slotKey, bookId] of Object.entries(slots)) {
            if (bookId == null || bookId === '') continue;
            out.push({
                cartUniqueId: String(cartUniqueId),
                productId: productByUnique.get(String(cartUniqueId)),
                slotIndex: parseInt(slotKey, 10),
                bookId
            });
        }
    }
    return out;
}

export function findMissingGiftSelections(cart, promotions, giftSelections) {
    const promoByProduct = new Map();
    for (const p of promotions || []) {
        if (p?.productId != null) promoByProduct.set(String(p.productId), p);
    }
    const missing = [];
    for (const item of cart || []) {
        const promo = promoByProduct.get(String(item.id));
        if (!promo) continue;
        const uniqueId = String(item.uniqueId != null ? item.uniqueId : item.id);
        const bookIds = (promo.bookIds || promo.books?.map((b) => b.id) || []).filter(Boolean);
        const slots = buildSlots({
            quantity: item.quantity,
            giftsPerUnit: promo.giftsPerUnit
        });
        if (bookIds.length === 1) continue; // auto-assigned
        const map = giftSelections?.[uniqueId] || {};
        for (const s of slots) {
            const val = map[s.slotIndex] ?? map[String(s.slotIndex)];
            if (val == null || val === '') {
                missing.push({
                    cartUniqueId: uniqueId,
                    productId: item.id,
                    slotIndex: s.slotIndex,
                    item,
                    promo
                });
            }
        }
    }
    return missing;
}

export function applyAutoAssignments(cart, promotions, giftSelections) {
    const next = { ...(giftSelections || {}) };
    const promoByProduct = new Map();
    for (const p of promotions || []) {
        if (p?.productId != null) promoByProduct.set(String(p.productId), p);
    }
    for (const item of cart || []) {
        const promo = promoByProduct.get(String(item.id));
        if (!promo) continue;
        const uniqueId = String(item.uniqueId != null ? item.uniqueId : item.id);
        const bookIds = (promo.bookIds || promo.books?.map((b) => b.id) || []).filter(Boolean);
        const slots = buildSlots({
            quantity: item.quantity,
            giftsPerUnit: promo.giftsPerUnit
        });
        const resized = resizeSelections(next[uniqueId], slots.length);
        const auto = autoAssignIfSingleBook(slots, bookIds);
        next[uniqueId] = auto || resized;
    }
    // Drop selections for removed cart lines
    const liveIds = new Set(
        (cart || []).map((item) => String(item.uniqueId != null ? item.uniqueId : item.id))
    );
    for (const key of Object.keys(next)) {
        if (!liveIds.has(key)) delete next[key];
    }
    return next;
}
