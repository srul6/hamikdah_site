/**
 * Gift-with-purchase slot math and checkout validation helpers.
 */

function toPositiveInt(value, fallback = 0) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Total gift slots required for a line: quantity * gifts_per_unit.
 */
function requiredSlotCount(quantity, giftsPerUnit) {
    return toPositiveInt(quantity, 0) * toPositiveInt(giftsPerUnit, 0);
}

/**
 * Build slot descriptors for a cart line.
 * Slots are ordered unit 0..qty-1, and within each unit slot 0..giftsPerUnit-1.
 * Global slotIndex is sequential: unit*giftsPerUnit + localSlot.
 */
function buildSlots({ quantity, giftsPerUnit }) {
    const qty = toPositiveInt(quantity, 0);
    const per = toPositiveInt(giftsPerUnit, 0);
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

/**
 * If only one book is offered, every slot gets that bookId.
 * @returns {Record<number, number|string>|null} map slotIndex -> bookId, or null if choice needed
 */
function autoAssignIfSingleBook(slots, bookIds) {
    const ids = Array.isArray(bookIds) ? bookIds.filter((id) => id != null && id !== '') : [];
    if (ids.length !== 1) return null;
    const only = ids[0];
    const map = {};
    for (const s of slots) {
        map[s.slotIndex] = only;
    }
    return map;
}

/**
 * Trim or pad selection map when quantity changes.
 * Keeps existing picks for remaining slots; drops trailing.
 */
function resizeSelections(existingMap, newSlotCount) {
    const prev = existingMap && typeof existingMap === 'object' ? existingMap : {};
    const next = {};
    for (let i = 0; i < newSlotCount; i += 1) {
        const key = String(i);
        if (prev[i] != null) next[key] = prev[i];
        else if (prev[key] != null) next[key] = prev[key];
    }
    return next;
}

/**
 * Flatten cart giftSelections object into array for API.
 * giftSelections: { [uniqueId]: { [slotIndex]: bookId } }
 */
function flattenGiftSelections(giftSelections) {
    const out = [];
    if (!giftSelections || typeof giftSelections !== 'object') return out;
    for (const [cartUniqueId, slots] of Object.entries(giftSelections)) {
        if (!slots || typeof slots !== 'object') continue;
        for (const [slotKey, bookId] of Object.entries(slots)) {
            if (bookId == null || bookId === '') continue;
            out.push({
                cartUniqueId: String(cartUniqueId),
                slotIndex: parseInt(slotKey, 10),
                bookId
            });
        }
    }
    return out;
}

/**
 * Validate checkout gift selections against active promotions for cart items.
 *
 * @param {object} args
 * @param {Array<{ id: any, uniqueId?: any, quantity: number }>} args.items
 * @param {Array<{ cartUniqueId: string, productId?: any, slotIndex: number, bookId: any }>} args.selections
 * @param {Array<{
 *   productId: any,
 *   giftsPerUnit: number,
 *   bookIds: any[]
 * }>} args.promotionsByProduct - one active promotion summary per productId
 * @returns {{ ok: true } | { ok: false, error: string, missing?: Array }}
 */
function validateGiftSelectionsForCheckout({ items, selections, promotionsByProduct }) {
    const promoMap = new Map();
    for (const p of promotionsByProduct || []) {
        if (p && p.productId != null) {
            promoMap.set(String(p.productId), p);
        }
    }

    const selectionIndex = new Map();
    for (const sel of selections || []) {
        if (!sel || sel.cartUniqueId == null || sel.slotIndex == null) continue;
        const key = `${String(sel.cartUniqueId)}::${parseInt(sel.slotIndex, 10)}`;
        selectionIndex.set(key, sel);
    }

    const invalid = [];

    for (const item of items || []) {
        if (!item) continue;
        const productId = item.id;
        const uniqueId = item.uniqueId != null ? String(item.uniqueId) : String(productId);
        const promo = promoMap.get(String(productId));
        if (!promo) continue;

        const slots = buildSlots({
            quantity: item.quantity,
            giftsPerUnit: promo.giftsPerUnit
        });
        const allowed = new Set((promo.bookIds || []).map((id) => String(id)));

        // Single-book auto-assign for validation
        let effective = selectionIndex;
        if (allowed.size === 1) {
            const onlyId = [...allowed][0];
            effective = new Map(selectionIndex);
            for (const s of slots) {
                const key = `${uniqueId}::${s.slotIndex}`;
                if (!effective.has(key)) {
                    effective.set(key, {
                        cartUniqueId: uniqueId,
                        productId,
                        slotIndex: s.slotIndex,
                        bookId: onlyId
                    });
                }
            }
        }

        for (const s of slots) {
            const key = `${uniqueId}::${s.slotIndex}`;
            const sel = effective.get(key);
            // Gifts are optional — missing picks are allowed (shopper may decline).
            if (!sel || sel.bookId == null || sel.bookId === '') {
                continue;
            }
            if (!allowed.has(String(sel.bookId))) {
                invalid.push({
                    cartUniqueId: uniqueId,
                    productId,
                    slotIndex: s.slotIndex,
                    bookId: sel.bookId
                });
            }
        }
    }

    if (invalid.length) {
        return { ok: false, error: 'invalid_gift_book', invalid };
    }
    return { ok: true };
}

module.exports = {
    requiredSlotCount,
    buildSlots,
    autoAssignIfSingleBook,
    resizeSelections,
    flattenGiftSelections,
    validateGiftSelectionsForCheckout
};
