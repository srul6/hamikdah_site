/**
 * Bundles CRUD + public/admin response mapping.
 * Schema lives in databaseController.ensureBundlesSchema(); queries use the shared pool.
 */

const databaseController = require('./databaseController');
const pool = databaseController.pool;
const { getStorageUrl, getStorageUrls } = require('../utils/storageUtils');
const { computeProductPricing } = require('../utils/productPricing');
const { slugifyProductName } = require('../utils/productSlug');
const {
    computeBundlePricing,
    validateBundleInput,
    buildBundleNames
} = require('../utils/bundlePricing');

function normalizeMediaList(value) {
    if (value == null) return [];
    if (Array.isArray(value)) {
        return value
            .filter((x) => typeof x === 'string' && x.trim())
            .map((s) => s.trim());
    }
    if (typeof value === 'string') {
        const s = value.trim();
        if (!s) return [];
        try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) {
                return parsed
                    .filter((x) => typeof x === 'string' && x.trim())
                    .map((x) => x.trim());
            }
        } catch {
            // ignore
        }
        if (s.includes(',')) {
            return s
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean);
        }
        return [s];
    }
    return [];
}

function normalizeColorExtraImages(value) {
    if (value == null) return [];
    if (Array.isArray(value)) {
        return value.filter((x) => typeof x === 'string' && x.trim()).map((s) => s.trim());
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    return [];
}

function normalizeProductColors(product) {
    if (!product || !Array.isArray(product.colors)) return product;
    return {
        ...product,
        colors: product.colors.map((c) => ({
            ...c,
            extraImages: normalizeColorExtraImages(c && c.extraImages)
        }))
    };
}

function withProductPricing(product) {
    const pricing = computeProductPricing(product);
    return {
        ...product,
        price: pricing.regularPrice,
        discount_enabled: pricing.discountEnabled,
        discount_type: pricing.discountType,
        discount_value: pricing.discountValue,
        regularPrice: pricing.regularPrice,
        finalPrice: pricing.finalPrice,
        discountAmount: pricing.discountAmount,
        hasDiscount: pricing.hasDiscount
    };
}

/** Map a product DB row exactly like GET /api/products. */
function mapProductForApi(product) {
    if (!product) return null;
    const childrenPlayingArray = normalizeMediaList(product.children_playing);
    const desktopHeroImagesArray = normalizeMediaList(product.desktop_hero_images);
    const extraImagesArray = normalizeMediaList(product.extraimages);
    const price = product.price ? parseFloat(product.price) : 0;

    return withProductPricing(
        normalizeProductColors({
            ...product,
            price,
            buildingTime: product.buildingtime ?? product.buildingTime,
            recommendedAge: product.recommendedage ?? product.recommendedAge,
            homepageImage: getStorageUrl(product.homepageimage),
            extraImages: getStorageUrls(extraImagesArray),
            extraimages: getStorageUrls(extraImagesArray),
            childrenPlaying: getStorageUrls(childrenPlayingArray),
            desktopHeroImages: getStorageUrls(desktopHeroImagesArray)
        })
    );
}

async function allocateUniqueSlug(baseNameHe) {
    const base =
        slugifyProductName(baseNameHe) ||
        slugifyProductName('bundle') ||
        'bundle';
    let candidate = base;
    let suffix = 2;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const existing = await pool.query('SELECT 1 FROM bundles WHERE slug = $1 LIMIT 1', [
            candidate
        ]);
        if (existing.rows.length === 0) return candidate;
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
}

async function fetchProductsByIds(ids) {
    if (!ids.length) return [];
    const result = await pool.query(
        `SELECT * FROM products WHERE id = ANY($1::int[])`,
        [ids]
    );
    return result.rows || [];
}

async function loadBundleItems(bundleIds) {
    if (!bundleIds.length) return [];
    const result = await pool.query(
        `SELECT bi.bundle_id, bi.product_id, bi.position, p.*
         FROM bundle_items bi
         JOIN products p ON p.id = bi.product_id
         WHERE bi.bundle_id = ANY($1::int[])
         ORDER BY bi.bundle_id ASC, bi.position ASC, bi.product_id ASC`,
        [bundleIds]
    );
    return result.rows || [];
}

function assembleBundle(bundleRow, itemRows) {
    const ordered = (itemRows || []).sort(
        (a, b) => Number(a.position) - Number(b.position) || Number(a.product_id) - Number(b.product_id)
    );
    const componentProducts = ordered.map((row) => {
        // Strip join columns so mapProductForApi sees a clean product row
        const {
            bundle_id: _bid,
            product_id: _pid,
            position: _pos,
            ...product
        } = row;
        return product;
    });
    const names = buildBundleNames(componentProducts);
    const pricing = computeBundlePricing(bundleRow, componentProducts);
    const items = ordered.map((row, index) => {
        const {
            bundle_id: _bid,
            product_id: _pid,
            position,
            ...product
        } = row;
        return {
            position: position != null ? Number(position) : index,
            product: mapProductForApi(product)
        };
    });

    const image = bundleRow.image ? getStorageUrl(bundleRow.image) || bundleRow.image : null;

    return {
        id: bundleRow.id,
        slug: bundleRow.slug,
        name_he: names.name_he,
        name_en: names.name_en,
        image,
        price: pricing.finalPrice,
        regularPrice: pricing.regularPrice,
        finalPrice: pricing.finalPrice,
        hasDiscount: pricing.hasDiscount,
        discountAmount: pricing.discountAmount,
        savingsPercent: pricing.savingsPercent,
        currentComponentsPrice: pricing.currentComponentsPrice,
        available: pricing.available,
        maxQuantity: pricing.maxQuantity,
        is_active: !!bundleRow.is_active,
        isActive: !!bundleRow.is_active,
        sort_order: Number(bundleRow.sort_order) || 0,
        sortOrder: Number(bundleRow.sort_order) || 0,
        created_at: bundleRow.created_at,
        updated_at: bundleRow.updated_at,
        items
    };
}

async function loadBundles({ activeOnly = false } = {}) {
    await databaseController.ensureBundlesSchema();
    const where = activeOnly ? 'WHERE is_active = TRUE' : '';
    const bundlesResult = await pool.query(
        `SELECT * FROM bundles ${where} ORDER BY sort_order ASC, id ASC`
    );
    const rows = bundlesResult.rows || [];
    if (!rows.length) return [];

    const itemRows = await loadBundleItems(rows.map((r) => r.id));
    const byBundle = new Map();
    for (const item of itemRows) {
        if (!byBundle.has(item.bundle_id)) byBundle.set(item.bundle_id, []);
        byBundle.get(item.bundle_id).push(item);
    }
    return rows.map((row) => assembleBundle(row, byBundle.get(row.id) || []));
}

async function loadBundleBySlug(slug, { activeOnly = true } = {}) {
    await databaseController.ensureBundlesSchema();
    const decoded = (() => {
        try {
            return decodeURIComponent(String(slug || '').trim());
        } catch {
            return String(slug || '').trim();
        }
    })();
    if (!decoded) return null;

    const clauses = ['slug = $1'];
    if (activeOnly) clauses.push('is_active = TRUE');
    const result = await pool.query(
        `SELECT * FROM bundles WHERE ${clauses.join(' AND ')} LIMIT 1`,
        [decoded]
    );
    const row = result.rows[0];
    if (!row) return null;
    const itemRows = await loadBundleItems([row.id]);
    return assembleBundle(row, itemRows);
}

async function loadBundleById(id) {
    await databaseController.ensureBundlesSchema();
    const numericId = parseInt(id, 10);
    if (!Number.isFinite(numericId) || numericId <= 0) return null;
    const result = await pool.query('SELECT * FROM bundles WHERE id = $1', [numericId]);
    const row = result.rows[0];
    if (!row) return null;
    const itemRows = await loadBundleItems([row.id]);
    return assembleBundle(row, itemRows);
}

/** Hebrew display names of bundles that include this product (for delete 409). */
async function getBundleNamesContainingProduct(productId) {
    await databaseController.ensureBundlesSchema();
    const numericId = parseInt(productId, 10);
    if (!Number.isFinite(numericId) || numericId <= 0) return [];

    const result = await pool.query(
        `SELECT b.id AS bundle_id, bi.position, p.name_he, p.name_en
         FROM bundle_items bi
         JOIN bundles b ON b.id = bi.bundle_id
         JOIN products p ON p.id = bi.product_id
         WHERE bi.bundle_id IN (
             SELECT bundle_id FROM bundle_items WHERE product_id = $1
         )
         ORDER BY b.id ASC, bi.position ASC`,
        [numericId]
    );

    const byBundle = new Map();
    for (const row of result.rows || []) {
        if (!byBundle.has(row.bundle_id)) byBundle.set(row.bundle_id, []);
        byBundle.get(row.bundle_id).push(row);
    }

    const names = [];
    for (const products of byBundle.values()) {
        const { name_he } = buildBundleNames(products);
        if (name_he) names.push(name_he);
    }
    return names;
}

async function replaceBundleItems(client, bundleId, productIds) {
    await client.query('DELETE FROM bundle_items WHERE bundle_id = $1', [bundleId]);
    for (let i = 0; i < productIds.length; i += 1) {
        await client.query(
            `INSERT INTO bundle_items (bundle_id, product_id, position)
             VALUES ($1, $2, $3)`,
            [bundleId, productIds[i], i]
        );
    }
}

// ----- HTTP handlers -----

exports.getPublicBundles = async (req, res) => {
    try {
        const bundles = await loadBundles({ activeOnly: true });
        res.json(bundles);
    } catch (error) {
        console.error('❌ GET /api/bundles:', error);
        res.status(500).json([]);
    }
};

exports.getPublicBundleBySlug = async (req, res) => {
    try {
        const bundle = await loadBundleBySlug(req.params.slug, { activeOnly: true });
        if (!bundle) {
            return res.status(404).json({ error: 'Bundle not found' });
        }
        res.json(bundle);
    } catch (error) {
        console.error('❌ GET /api/bundles/:slug:', error);
        res.status(500).json({ error: 'Failed to get bundle' });
    }
};

exports.getAdminBundles = async (req, res) => {
    try {
        const bundles = await loadBundles({ activeOnly: false });
        res.json({ success: true, bundles });
    } catch (error) {
        console.error('❌ GET /api/bundles/admin/all:', error);
        res.status(500).json({ success: false, message: 'שגיאה בטעינת הבאנדלים' });
    }
};

exports.createBundle = async (req, res) => {
    const client = await pool.connect();
    try {
        await databaseController.ensureBundlesSchema();
        const body = req.body || {};
        const productIds = Array.isArray(body.productIds)
            ? body.productIds
            : Array.isArray(body.product_ids)
              ? body.product_ids
              : [];

        const products = await fetchProductsByIds(
            productIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
        );
        const validation = validateBundleInput({
            productIds,
            price: body.price,
            image: body.image,
            componentProducts: products
        });
        if (!validation.ok) {
            return res.status(400).json({ success: false, message: validation.error });
        }

        const orderedProducts = validation.values.productIds.map((id) =>
            products.find((p) => Number(p.id) === id)
        );
        const names = buildBundleNames(orderedProducts);
        const slug = await allocateUniqueSlug(names.name_he);
        const isActive = body.is_active != null || body.isActive != null
            ? !!(body.is_active ?? body.isActive)
            : true;
        const sortOrder =
            parseInt(body.sort_order != null ? body.sort_order : body.sortOrder, 10) || 0;

        await client.query('BEGIN');
        const insert = await client.query(
            `INSERT INTO bundles (slug, price, image, is_active, sort_order)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [slug, validation.values.price, validation.values.image, isActive, sortOrder]
        );
        const bundleRow = insert.rows[0];
        await replaceBundleItems(client, bundleRow.id, validation.values.productIds);
        await client.query('COMMIT');

        const bundle = await loadBundleById(bundleRow.id);
        res.status(201).json({
            success: true,
            bundle,
            warnings: validation.warnings || []
        });
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (_) {
            /* ignore */
        }
        console.error('❌ POST /api/bundles:', error);
        res.status(500).json({ success: false, message: 'שגיאה ביצירת הבאנדל' });
    } finally {
        client.release();
    }
};

exports.updateBundle = async (req, res) => {
    const client = await pool.connect();
    try {
        await databaseController.ensureBundlesSchema();
        const numericId = parseInt(req.params.id, 10);
        if (!Number.isFinite(numericId) || numericId <= 0) {
            return res.status(404).json({ success: false, message: 'הבאנדל לא נמצא' });
        }
        const rawResult = await pool.query('SELECT * FROM bundles WHERE id = $1', [numericId]);
        const rawRow = rawResult.rows[0];
        if (!rawRow) {
            return res.status(404).json({ success: false, message: 'הבאנדל לא נמצא' });
        }
        const existing = await loadBundleById(numericId);

        const body = req.body || {};
        const hasProductIds = body.productIds !== undefined || body.product_ids !== undefined;
        const productIds = hasProductIds
            ? Array.isArray(body.productIds)
                ? body.productIds
                : Array.isArray(body.product_ids)
                  ? body.product_ids
                  : []
            : existing.items.map((item) => item.product.id);

        const products = await fetchProductsByIds(
            productIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
        );
        const price = body.price !== undefined ? body.price : Number(rawRow.price);
        // Keep the raw DB image unless the client explicitly sends a new value
        const image = body.image !== undefined ? body.image : rawRow.image;

        const validation = validateBundleInput({
            productIds,
            price,
            image,
            componentProducts: products
        });
        if (!validation.ok) {
            return res.status(400).json({ success: false, message: validation.error });
        }

        const isActive =
            body.is_active != null || body.isActive != null
                ? !!(body.is_active ?? body.isActive)
                : !!rawRow.is_active;
        const sortOrder =
            body.sort_order != null || body.sortOrder != null
                ? parseInt(body.sort_order != null ? body.sort_order : body.sortOrder, 10) || 0
                : Number(rawRow.sort_order) || 0;

        await client.query('BEGIN');
        await client.query(
            `UPDATE bundles SET
                price = $2,
                image = $3,
                is_active = $4,
                sort_order = $5,
                updated_at = NOW()
             WHERE id = $1`,
            [numericId, validation.values.price, validation.values.image, isActive, sortOrder]
        );
        await replaceBundleItems(client, numericId, validation.values.productIds);
        await client.query('COMMIT');

        const bundle = await loadBundleById(numericId);
        res.json({
            success: true,
            bundle,
            warnings: validation.warnings || []
        });
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (_) {
            /* ignore */
        }
        console.error('❌ PUT /api/bundles/:id:', error);
        res.status(500).json({ success: false, message: 'שגיאה בעדכון הבאנדל' });
    } finally {
        client.release();
    }
};

exports.deleteBundle = async (req, res) => {
    try {
        await databaseController.ensureBundlesSchema();
        const numericId = parseInt(req.params.id, 10);
        if (!Number.isFinite(numericId) || numericId <= 0) {
            return res.status(404).json({ success: false, message: 'הבאנדל לא נמצא' });
        }
        const result = await pool.query('DELETE FROM bundles WHERE id = $1 RETURNING id', [
            numericId
        ]);
        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: 'הבאנדל לא נמצא' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('❌ DELETE /api/bundles/:id:', error);
        res.status(500).json({ success: false, message: 'שגיאה במחיקת הבאנדל' });
    }
};

exports.getBundleNamesContainingProduct = getBundleNamesContainingProduct;
exports.ensureBundlesSchema = () => databaseController.ensureBundlesSchema();
exports.loadBundleById = loadBundleById;
