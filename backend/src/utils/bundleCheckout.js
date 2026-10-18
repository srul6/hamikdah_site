/**
 * Bundle checkout: selection validation, proportional price allocation,
 * expansion to flat product lines, Green Invoice income grouping, stock demand.
 *
 * Pure helpers are unit-tested; DB loading is injected via loadBundleById.
 */

const { computeBundlePricing } = require('./bundlePricing');
const { computeProductPricing } = require('./productPricing');

/** Same color-id derivation as CartContext / frontend bundleCart.getCartColorId. */
function getCartColorId(selectedColor) {
    if (!selectedColor) return null;
    return selectedColor.name || selectedColor.name_en || null;
}

function toAgorot(value) {
    return Math.round(Number(value) * 100);
}

function getProductColors(product) {
    let colors = product?.colors;
    if (typeof colors === 'string') {
        try {
            colors = JSON.parse(colors);
        } catch {
            colors = [];
        }
    }
    return Array.isArray(colors) ? colors : [];
}

function findColorOnProduct(product, colorId) {
    if (colorId == null || colorId === '') return null;
    const colors = getProductColors(product);
    return (
        colors.find((c) => {
            const id = getCartColorId(c);
            return id === colorId || c.name_en === colorId || c.name_he === colorId;
        }) || null
    );
}

/**
 * Split ONE bundle unit price across components proportional to each component's
 * REGULAR (list) price. Rounded to 2 decimals; remainder goes to the last component
 * so allocated prices sum EXACTLY to bundleUnitPrice.
 *
 * @param {number} bundleUnitPrice
 * @param {number[]} componentRegularPrices — same length/order as components
 * @returns {number[]} allocated unit prices
 */
function allocateBundleUnitPrice(bundleUnitPrice, componentRegularPrices) {
    const regs = (componentRegularPrices || []).map((p) => {
        const n = Number(p);
        return Number.isFinite(n) && n > 0 ? n : 0;
    });
    const n = regs.length;
    if (n === 0) return [];

    const unitAgorot = toAgorot(bundleUnitPrice);
    const regularAgorot = regs.map((p) => toAgorot(p));
    const regularSum = regularAgorot.reduce((s, a) => s + a, 0);

    if (regularSum <= 0) {
        const base = Math.floor(unitAgorot / n);
        const out = Array(n).fill(base);
        out[n - 1] = unitAgorot - base * (n - 1);
        return out.map((a) => a / 100);
    }

    const allocatedAgorot = [];
    let used = 0;
    for (let i = 0; i < n; i += 1) {
        if (i === n - 1) {
            allocatedAgorot.push(unitAgorot - used);
        } else {
            const share = Math.round((unitAgorot * regularAgorot[i]) / regularSum);
            allocatedAgorot.push(share);
            used += share;
        }
    }
    return allocatedAgorot.map((a) => a / 100);
}

/**
 * Validate selection against a loaded (assembled) bundle.
 * @returns {{ ok: true, orderedSelection: object[], colors: object[] } | { ok: false, error: string, message: string }}
 */
function validateBundleSelection(bundle, selection) {
    const name = bundle?.name_he || bundle?.name_en || String(bundle?.id || '');
    const unavailableMsg = `הבאנדל ${name} אינו זמין עוד`;

    if (!bundle || bundle.is_active === false || bundle.isActive === false) {
        return { ok: false, error: 'bundle_unavailable', message: unavailableMsg };
    }

    const components = [...(bundle.items || [])].sort(
        (a, b) => Number(a.position) - Number(b.position)
    );
    if (components.length < 2) {
        return { ok: false, error: 'bundle_unavailable', message: unavailableMsg };
    }

    const expectedIds = components.map((c) => Number(c.product?.id)).filter((id) => id > 0);
    const sel = Array.isArray(selection) ? selection : [];
    const selIds = sel.map((s) => Number(s.productId));

    if (selIds.length !== expectedIds.length) {
        return {
            ok: false,
            error: 'bundle_selection_invalid',
            message: `בחירת המוצרים בבאנדל ${name} אינה תקינה`
        };
    }

    const seen = new Set();
    for (const id of selIds) {
        if (!Number.isFinite(id) || id <= 0) {
            return {
                ok: false,
                error: 'bundle_selection_invalid',
                message: `בחירת המוצרים בבאנדל ${name} אינה תקינה`
            };
        }
        if (seen.has(id)) {
            return {
                ok: false,
                error: 'bundle_selection_invalid',
                message: `בחירת המוצרים בבאנדל ${name} אינה תקינה`
            };
        }
        seen.add(id);
    }

    for (const id of expectedIds) {
        if (!seen.has(id)) {
            return {
                ok: false,
                error: 'bundle_selection_invalid',
                message: `בחירת המוצרים בבאנדל ${name} אינה תקינה`
            };
        }
    }
    for (const id of selIds) {
        if (!expectedIds.includes(id)) {
            return {
                ok: false,
                error: 'bundle_selection_invalid',
                message: `בחירת המוצרים בבאנדל ${name} אינה תקינה`
            };
        }
    }

    const selByPid = new Map(sel.map((s) => [Number(s.productId), s.colorId ?? null]));
    const orderedSelection = [];
    const resolvedColors = [];

    for (const comp of components) {
        const product = comp.product;
        const productId = Number(product.id);
        const colorId = selByPid.get(productId);
        const colors = getProductColors(product);

        if (colors.length > 0) {
            if (colorId == null || colorId === '') {
                return {
                    ok: false,
                    error: 'bundle_selection_invalid',
                    message: `יש לבחור צבע לכל מוצר בבאנדל ${name}`
                };
            }
            const color = findColorOnProduct(product, colorId);
            if (!color) {
                return {
                    ok: false,
                    error: 'bundle_selection_invalid',
                    message: `צבע לא תקין בבאנדל ${name}`
                };
            }
            orderedSelection.push({ productId, colorId: getCartColorId(color) });
            resolvedColors.push(color);
        } else {
            if (colorId != null && colorId !== '') {
                return {
                    ok: false,
                    error: 'bundle_selection_invalid',
                    message: `צבע לא תקין בבאנדל ${name}`
                };
            }
            orderedSelection.push({ productId, colorId: null });
            resolvedColors.push(null);
        }
    }

    return { ok: true, orderedSelection, resolvedColors, components };
}

/**
 * Expand one sanitized bundle cart line into flat product order lines.
 * Uses server finalPrice / regularPrice; rejects client price mismatch (>1 agora).
 *
 * @returns {{ ok: true, lines: object[], unitPrice: number, regularPrice: number }
 *   | { ok: false, error: string, message?: string, details?: object }}
 */
function priceAndExpandBundleLine(bundleLine, bundle) {
    const name = bundle?.name_he || bundle?.name_en || String(bundleLine?.bundleId || '');
    const unavailableMsg = `הבאנדל ${name} אינו זמין עוד`;

    if (!bundle || bundle.is_active === false || bundle.isActive === false) {
        return { ok: false, error: 'bundle_unavailable', message: unavailableMsg };
    }

    const selCheck = validateBundleSelection(bundle, bundleLine.selection);
    if (!selCheck.ok) return selCheck;

    const componentProducts = selCheck.components.map((c) => c.product);
    const pricing = computeBundlePricing(bundle, componentProducts);
    const serverUnit = pricing.finalPrice;
    const serverRegular = pricing.regularPrice;

    if (Math.abs(toAgorot(bundleLine.price) - toAgorot(serverUnit)) > 1) {
        return {
            ok: false,
            error: 'price_changed',
            details: {
                bundleId: bundle.id,
                client: Number(bundleLine.price),
                server: serverUnit
            },
            message: unavailableMsg
        };
    }

    const regularPrices = componentProducts.map(
        (p) => computeProductPricing(p).regularPrice
    );
    const allocated = allocateBundleUnitPrice(serverUnit, regularPrices);

    const qty = bundleLine.quantity;
    const bundleRowKey = bundleLine.uniqueId || `bundle-${bundle.id}`;
    const lines = selCheck.components.map((comp, index) => {
        const product = comp.product;
        const color = selCheck.resolvedColors[index];
        const colorHe = color ? color.name_he || color.name || '' : '';
        const colorEn = color ? color.name_en || color.name || '' : '';
        const allocatedUnit = allocated[index];
        const componentRegular = regularPrices[index];

        return {
            id: product.id,
            uniqueId: `${bundleRowKey}::${product.id}`,
            quantity: qty,
            price: allocatedUnit,
            regular_price: componentRegular,
            name_he: product.name_he || '',
            name_en: product.name_en || '',
            color_name_he: colorHe,
            color_name_en: colorEn,
            bundleId: bundle.id,
            bundleRowKey,
            bundleName_he: bundle.name_he || name,
            bundleName_en: bundle.name_en || '',
            bundleUnitPrice: serverUnit,
            bundleUnitRegularPrice: serverRegular
        };
    });

    const allocSum = allocated.reduce((s, p) => s + toAgorot(p), 0);
    if (allocSum !== toAgorot(serverUnit)) {
        return {
            ok: false,
            error: 'allocation_error',
            message: 'שגיאת תמחור באנדל'
        };
    }

    return {
        ok: true,
        lines,
        unitPrice: serverUnit,
        regularPrice: serverRegular
    };
}

/**
 * Price all product + bundle lines for checkout.
 * @param {object[]} sanitizedItems — from checkoutValidation
 * @param {object[]} catalog — products
 * @param {Map<number, object>|function} bundlesById — assembled bundles or async loader result map
 * @param {function} priceCheckoutItemsFn — productPricing.priceCheckoutItems
 */
function priceMixedCheckoutItems(sanitizedItems, catalog, bundlesById, priceCheckoutItemsFn) {
    const productLines = [];
    const bundleLines = [];
    for (const item of sanitizedItems || []) {
        if (item.type === 'bundle') bundleLines.push(item);
        else productLines.push(item);
    }

    let pricedProducts = [];
    let productSubtotal = 0;
    if (productLines.length) {
        const priced = priceCheckoutItemsFn(productLines, catalog);
        if (!priced.ok) return priced;
        pricedProducts = priced.items;
        productSubtotal = priced.subtotal;
    }

    const expanded = [];
    let bundleSubtotalAgorot = 0;
    const getBundle = (id) => {
        if (bundlesById instanceof Map) return bundlesById.get(Number(id)) || bundlesById.get(String(id));
        return bundlesById?.[id] || bundlesById?.[Number(id)];
    };

    for (const bl of bundleLines) {
        const bundle = getBundle(bl.bundleId);
        if (!bundle) {
            return {
                ok: false,
                error: 'bundle_unavailable',
                message: `הבאנדל ${bl.bundleId} אינו זמין עוד`
            };
        }
        const result = priceAndExpandBundleLine(bl, bundle);
        if (!result.ok) return result;
        expanded.push(...result.lines);
        bundleSubtotalAgorot += toAgorot(result.unitPrice) * bl.quantity;
    }

    const storageItems = [...pricedProducts, ...expanded];

    // Integrity: sum of stored line totals must equal product subtotal + bundle totals
    const storedAgorot = storageItems.reduce(
        (sum, i) => sum + toAgorot(i.price) * (i.quantity || 1),
        0
    );
    const expectedFromParts =
        Math.round(Number(productSubtotal) * 100) + bundleSubtotalAgorot;
    if (storedAgorot !== expectedFromParts) {
        return {
            ok: false,
            error: 'allocation_error',
            message: 'שגיאת תמחור הזמנה',
            details: { storedAgorot, expectedFromParts }
        };
    }

    return {
        ok: true,
        items: storageItems,
        productItems: pricedProducts,
        bundleRequestLines: bundleLines,
        subtotal: expectedFromParts / 100,
        hasBundles: bundleLines.length > 0
    };
}

/**
 * Aggregate demand per productId from storage (expanded) items.
 * @returns {Map<string, number>}
 */
function aggregateProductDemand(storageItems) {
    const demand = new Map();
    for (const item of storageItems || []) {
        if (item.id == null) continue;
        const key = String(item.id);
        demand.set(key, (demand.get(key) || 0) + (item.quantity || 0));
    }
    return demand;
}

/**
 * Reject when any product's stock < demand. Fresh catalog quantities.
 * @returns {{ ok: true } | { ok: false, error: string, message: string, shortages: object[] }}
 */
function checkAggregatedStock(storageItems, catalog) {
    const byId = new Map((catalog || []).map((p) => [String(p.id), p]));
    const demand = aggregateProductDemand(storageItems);
    const shortages = [];

    for (const [pid, needed] of demand) {
        const product = byId.get(pid);
        const available = product ? Number(product.quantity) || 0 : 0;
        if (!product || available < needed) {
            const name =
                product?.name_he || product?.name_en || `מוצר ${pid}`;
            shortages.push({
                productId: pid,
                name,
                needed,
                available: product ? available : 0
            });
        }
    }

    if (!shortages.length) return { ok: true };

    const message = shortages
        .map(
            (s) =>
                `${s.name}: נדרשים ${s.needed}, זמינים במלאי ${s.available}`
        )
        .join('; ');

    return {
        ok: false,
        error: 'insufficient_stock',
        message: `אין מספיק מלאי: ${message}`,
        shortages
    };
}

/**
 * Build Green Invoice income lines from expanded storage items.
 * Standalone products as today; each bundleRowKey → one income line at bundle unit price.
 */
function buildGreenInvoiceIncome(storageItems, { deliveryFee = 0, discount = 0 } = {}) {
    const standalone = [];
    const bundleGroups = new Map();

    for (const item of storageItems || []) {
        if (item.bundleRowKey) {
            if (!bundleGroups.has(item.bundleRowKey)) {
                bundleGroups.set(item.bundleRowKey, []);
            }
            bundleGroups.get(item.bundleRowKey).push(item);
        } else {
            standalone.push(item);
        }
    }

    const income = [];

    for (const item of standalone) {
        const he = String(item.name_he || item.name || 'פריט').trim();
        const cHe = item.color_name_he && String(item.color_name_he).trim();
        const description = cHe ? `${he} (${cHe})` : he;
        income.push({
            description: description || 'פריט',
            quantity: item.quantity || 1,
            price: parseFloat(item.price),
            vatType: 1
        });
    }

    for (const [, comps] of bundleGroups) {
        const first = comps[0];
        income.push({
            description: first.bundleName_he || first.bundleName_en || 'באנדל',
            quantity: first.quantity || 1,
            price: parseFloat(first.bundleUnitPrice),
            vatType: 1
        });
    }

    if (deliveryFee > 0) {
        income.push({
            description: 'משלוח עד הבית',
            quantity: 1,
            price: deliveryFee,
            vatType: 1
        });
    }
    if (discount > 0) {
        income.push({
            description: 'הנחה (קופון)',
            quantity: 1,
            price: -discount,
            vatType: 1
        });
    }

    return income;
}

/** Sum of income lines excluding coupon (negative) and optionally delivery. */
function incomeMerchandiseSubtotal(income) {
    return (income || [])
        .filter((l) => l.description !== 'הנחה (קופון)' && l.description !== 'משלוח עד הבית')
        .reduce((sum, l) => sum + toAgorot(l.price) * (l.quantity || 1), 0) / 100;
}

/**
 * Group expanded order items for owner-facing display / analytics.
 * @returns {Array<{ kind: 'product'|'bundle', ... }>}
 */
function groupOrderItemsForDisplay(items) {
    const out = [];
    const bundleGroups = new Map();
    const bundleOrder = [];

    for (const item of items || []) {
        if (item?.bundleRowKey) {
            if (!bundleGroups.has(item.bundleRowKey)) {
                bundleGroups.set(item.bundleRowKey, []);
                bundleOrder.push(item.bundleRowKey);
            }
            bundleGroups.get(item.bundleRowKey).push(item);
        } else {
            out.push({ kind: 'product', item });
        }
    }

    for (const key of bundleOrder) {
        const comps = bundleGroups.get(key);
        const first = comps[0];
        out.push({
            kind: 'bundle',
            bundleRowKey: key,
            bundleId: first.bundleId,
            name_he: first.bundleName_he,
            name_en: first.bundleName_en,
            quantity: first.quantity,
            unitPrice: first.bundleUnitPrice,
            unitRegularPrice: first.bundleUnitRegularPrice,
            components: comps
        });
    }

    return out;
}

/**
 * GA4 / purchase-summary friendly flat list: one row per bundle, one per product.
 */
function summarizeItemsForPurchase(items) {
    return groupOrderItemsForDisplay(items).map((row) => {
        if (row.kind === 'bundle') {
            return {
                id: `bundle-${row.bundleId}`,
                name_he: row.name_he,
                name_en: row.name_en,
                quantity: row.quantity,
                price: Number(row.unitPrice) || 0,
                ...(Number(row.unitRegularPrice) > Number(row.unitPrice)
                    ? { regular_price: Number(row.unitRegularPrice) }
                    : {})
            };
        }
        const item = row.item;
        return {
            id: item.id,
            name_he: item.name_he,
            name_en: item.name_en,
            quantity: item.quantity,
            price: Number(item.price) || 0,
            ...(item.regular_price != null ? { regular_price: item.regular_price } : {})
        };
    });
}

function isBundleStorageItem(item) {
    return !!(item && (item.bundleRowKey || item.bundleId != null || item.type === 'bundle'));
}

module.exports = {
    getCartColorId,
    getProductColors,
    findColorOnProduct,
    allocateBundleUnitPrice,
    validateBundleSelection,
    priceAndExpandBundleLine,
    priceMixedCheckoutItems,
    aggregateProductDemand,
    checkAggregatedStock,
    buildGreenInvoiceIncome,
    incomeMerchandiseSubtotal,
    groupOrderItemsForDisplay,
    summarizeItemsForPurchase,
    isBundleStorageItem,
    toAgorot
};
