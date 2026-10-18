/**
 * Bundle cart line helpers — uniqueId, selection, hydrate, cookie slim, checkout payload.
 */

/** Same color id derivation as CartContext product lines. */
export function getCartColorId(selectedColor) {
    if (!selectedColor) return null;
    return selectedColor.name || selectedColor.name_en || null;
}

export function isBundleCartItem(item) {
    return item?.type === 'bundle' || String(item?.id || '').startsWith('bundle-');
}

/**
 * Build uniqueId: bundle-{id}-{productId}:{colorId|none}_...
 * Components in position order.
 */
export function buildBundleUniqueId(bundleId, selectionList) {
    const parts = (selectionList || []).map((sel) => {
        const pid = sel.productId;
        const cid = sel.colorId != null && sel.colorId !== '' ? sel.colorId : 'none';
        return `${pid}:${cid}`;
    });
    return `bundle-${bundleId}-${parts.join('_')}`;
}

/**
 * Convert BundlePage selection map { [productId]: colorObject|null }
 * into ordered [{ productId, colorId }] using bundle.items position order.
 */
export function selectionMapToList(bundle, selectionMap = {}) {
    const ordered = [...(bundle?.items || [])].sort(
        (a, b) => Number(a.position) - Number(b.position)
    );
    return ordered.map((item) => {
        const product = item?.product;
        const productId = product?.id;
        const color =
            selectionMap?.[productId] ??
            selectionMap?.[String(productId)] ??
            null;
        return {
            productId,
            colorId: getCartColorId(color)
        };
    });
}

/** Default selection: first color of every component that has colors. */
export function defaultBundleSelectionMap(bundle) {
    const map = {};
    for (const item of bundle?.items || []) {
        const product = item?.product;
        if (!product?.id) continue;
        const colors = Array.isArray(product.colors) ? product.colors : [];
        map[product.id] = colors.length > 0 ? colors[0] : null;
    }
    return map;
}

function findColorById(product, colorId) {
    if (!colorId || !product) return null;
    const colors = Array.isArray(product.colors) ? product.colors : [];
    return (
        colors.find((c) => {
            const id = getCartColorId(c);
            return id === colorId || c.name_en === colorId || c.name_he === colorId;
        }) || null
    );
}

/**
 * Hydrate a slim cookie bundle row from the live bundles catalog.
 * Returns a full display line; marks available:false when missing/invalid.
 */
export function hydrateBundleCartItem(item, bundles, { bundlesLoading = false } = {}) {
    if (!isBundleCartItem(item)) return item;

    const bundleId = item.bundleId != null ? item.bundleId : String(item.id || '').replace(/^bundle-/, '');
    const selection = Array.isArray(item.selection) ? item.selection : [];
    const uniqueId =
        item.uniqueId ||
        buildBundleUniqueId(bundleId, selection);

    if (bundlesLoading) {
        return {
            ...item,
            type: 'bundle',
            id: `bundle-${bundleId}`,
            bundleId: Number(bundleId) || bundleId,
            uniqueId,
            quantity: Math.max(1, Number(item.quantity) || 1),
            selection,
            _pendingHydration: true,
            available: item.available !== false
        };
    }

    const list = Array.isArray(bundles) ? bundles : [];
    const bundle = list.find((b) => String(b.id) === String(bundleId));

    if (!bundle || bundle.is_active === false || bundle.isActive === false) {
        return {
            type: 'bundle',
            id: `bundle-${bundleId}`,
            bundleId: Number(bundleId) || bundleId,
            uniqueId,
            quantity: Math.max(1, Number(item.quantity) || 1),
            selection,
            slug: item.slug || null,
            name_he: item.name_he || 'באנדל',
            name_en: item.name_en || 'Bundle',
            image: item.image || null,
            price: Number(item.price) || 0,
            regularPrice: Number(item.regularPrice) || Number(item.price) || 0,
            available: false,
            maxQuantity: 0,
            components: item.components || [],
            items: item.items || [],
            _missing: true
        };
    }

    let selectionValid = true;
    const components = [];
    const orderedItems = [...(bundle.items || [])].sort(
        (a, b) => Number(a.position) - Number(b.position)
    );

    // Prefer stored selection order; fall back to bundle item order
    const selectionByPid = new Map(
        selection.map((s) => [String(s.productId), s.colorId ?? null])
    );

    for (const bi of orderedItems) {
        const product = bi?.product;
        if (!product) continue;
        const colorId = selectionByPid.has(String(product.id))
            ? selectionByPid.get(String(product.id))
            : null;
        const colors = Array.isArray(product.colors) ? product.colors : [];
        let colorName_he = '';
        let colorName_en = '';

        if (colorId) {
            const color = findColorById(product, colorId);
            if (!color) {
                selectionValid = false;
            } else {
                colorName_he = color.name_he || color.name || '';
                colorName_en = color.name_en || color.name || '';
            }
        } else if (colors.length > 1) {
            // Had a multi-color product but no color stored — treat as invalid
            // (card add always picks first; page always has a selection)
        }

        components.push({
            productId: product.id,
            name_he: product.name_he || '',
            name_en: product.name_en || '',
            colorName_he,
            colorName_en
        });
    }

    const available =
        bundle.available !== false && selectionValid;

    return {
        type: 'bundle',
        id: `bundle-${bundle.id}`,
        bundleId: bundle.id,
        uniqueId,
        quantity: Math.max(1, Number(item.quantity) || 1),
        selection: orderedItems.map((bi) => ({
            productId: bi.product?.id,
            colorId: selectionByPid.has(String(bi.product?.id))
                ? selectionByPid.get(String(bi.product?.id))
                : null
        })),
        slug: bundle.slug,
        name_he: bundle.name_he,
        name_en: bundle.name_en,
        image: bundle.image,
        price: Number(bundle.finalPrice ?? bundle.price) || 0,
        regularPrice: Number(bundle.regularPrice) || 0,
        available,
        maxQuantity: Number(bundle.maxQuantity) || 0,
        components,
        items: bundle.items,
        addedAt: item.addedAt
    };
}

/** Cookie-safe slim row for a bundle line. */
export function slimBundleForCookie(item) {
    return {
        type: 'bundle',
        bundleId: item.bundleId,
        uniqueId: item.uniqueId,
        quantity: item.quantity,
        selection: Array.isArray(item.selection) ? item.selection : []
    };
}

/** Checkout / payment-form item for a bundle (no numeric `id`). */
export function bundleToCheckoutItem(item) {
    return {
        type: 'bundle',
        bundleId: item.bundleId,
        quantity: item.quantity,
        uniqueId: item.uniqueId,
        price: Number(item.price) || 0,
        regular_price: Number(item.regularPrice) || 0,
        selection: Array.isArray(item.selection)
            ? item.selection.map((s) => ({
                productId: s.productId,
                colorId: s.colorId ?? null
            }))
            : []
    };
}

/** Existing product checkout shape — unchanged. */
export function productToCheckoutItem(item) {
    const sc = item.selectedColor;
    const colorNameHe = sc ? (sc.name_he || sc.name || '') : '';
    const colorNameEn = sc ? (sc.name_en || sc.name || '') : '';
    return {
        id: item.id,
        uniqueId: item.uniqueId != null ? item.uniqueId : item.id,
        name: item.name,
        name_he: item.name_he,
        name_en: item.name_en,
        price: item.price,
        quantity: item.quantity,
        color_name_he: colorNameHe,
        color_name_en: colorNameEn
    };
}

export function cartItemToCheckoutPayload(item) {
    if (isBundleCartItem(item)) return bundleToCheckoutItem(item);
    return productToCheckoutItem(item);
}

export function cartHasUnavailableItems(cart) {
    return (cart || []).some(
        (item) => isBundleCartItem(item) && item.available === false
    );
}

/** Analytics / GA4-friendly product-shaped object for a bundle line. */
export function bundleLineToAnalyticsItem(item) {
    return {
        id: item.id || `bundle-${item.bundleId}`,
        name_he: item.name_he,
        name_en: item.name_en,
        price: Number(item.price) || 0,
        quantity: item.quantity || 1
    };
}
