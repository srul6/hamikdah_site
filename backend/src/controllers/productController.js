// backend/src/controllers/productController.js
const { databaseController } = require('../config/database');
const { getStorageUrl, getStorageUrls } = require('../utils/storageUtils');
const { computeProductPricing, validateDiscountSettings } = require('../utils/productPricing');
const {
    validateProductSlugInput,
    validateSpecialPageInput,
    assertSlugAvailable,
    allocateInitialSlug
} = require('../utils/productSlug');

/**
 * Attach normalized discount fields + server-computed pricing.
 * `price` remains the regular price; `finalPrice` is what the customer pays.
 */
function withPricing(product) {
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
        hasDiscount: pricing.hasDiscount,
        slug: product.slug != null && String(product.slug).trim() ? String(product.slug).trim() : null,
        specialPage:
            product.special_page != null && String(product.special_page).trim()
                ? String(product.special_page).trim()
                : product.specialPage != null && String(product.specialPage).trim()
                  ? String(product.specialPage).trim()
                  : null,
        special_page:
            product.special_page != null && String(product.special_page).trim()
                ? String(product.special_page).trim()
                : product.specialPage != null && String(product.specialPage).trim()
                  ? String(product.specialPage).trim()
                  : null
    };
}

/**
 * Resolve slug + special_page from a create/update body.
 * Omitting fields on update leaves existing values (caller must not pass them).
 * @returns {{ ok: true, slug?: string|null, special_page?: string|null } | { ok: false, status: number, error: string }}
 */
function resolvePageFields(body, existing, allProducts, { isCreate }) {
    const out = {};

    const touchesSlug = body.slug !== undefined;
    const touchesSpecial =
        body.special_page !== undefined || body.specialPage !== undefined;

    if (isCreate || touchesSpecial) {
        const raw =
            body.specialPage !== undefined ? body.specialPage : body.special_page;
        const sp = validateSpecialPageInput(isCreate && raw === undefined ? null : raw);
        if (!sp.ok) return { ok: false, status: 400, error: sp.message };
        if (isCreate || touchesSpecial) out.special_page = sp.value;
    }

    if (isCreate || touchesSlug) {
        let slugValue = null;
        if (touchesSlug) {
            const sl = validateProductSlugInput(body.slug);
            if (!sl.ok) return { ok: false, status: 400, error: sl.message };
            slugValue = sl.value;
        }
        // POST with no/empty slug → store computed slug from initial name
        if (isCreate && !slugValue) {
            slugValue = allocateInitialSlug(
                {
                    name_he: body.name_he,
                    name_en: body.name_en
                },
                allProducts
            );
        }

        if (slugValue) {
            const avail = assertSlugAvailable(
                slugValue,
                allProducts,
                existing?.id ?? null
            );
            if (!avail.ok) {
                return { ok: false, status: 409, error: avail.message };
            }
        }
        if (isCreate || touchesSlug) out.slug = slugValue;
    }

    return { ok: true, ...out };
}

const DISCOUNT_KEYS = ['discount_enabled', 'discount_type', 'discount_value'];

/**
 * Validate discount fields in a create/update body, merged with the existing row (for updates).
 * Mutates nothing; returns sanitized discount values to persist, or an error.
 */
function resolveDiscountUpdate(body, existing) {
    const touchesDiscount = DISCOUNT_KEYS.some((k) => body[k] !== undefined);
    const touchesPrice = body.price !== undefined;
    if (!touchesDiscount && !touchesPrice) return { ok: true, values: null };

    const merged = {
        price: touchesPrice ? body.price : existing?.price,
        discount_enabled: body.discount_enabled !== undefined ? body.discount_enabled : existing?.discount_enabled,
        discount_type: body.discount_type !== undefined ? body.discount_type : existing?.discount_type,
        discount_value: body.discount_value !== undefined ? body.discount_value : existing?.discount_value
    };
    const result = validateDiscountSettings(merged);
    if (!result.ok) return result;
    return { ok: true, values: touchesDiscount ? result.values : null };
}

/**
 * Normalize a "media list" field the same way as `extraimages`:
 * - accept array of strings
 * - accept JSON stringified array
 * - accept comma-separated string
 * - accept single string
 */
function normalizeMediaList(value) {
    if (value == null) return [];
    if (Array.isArray(value)) {
        return value
            .filter(x => typeof x === 'string' && x.trim())
            .map(s => s.trim());
    }
    if (typeof value === 'string') {
        const s = value.trim();
        if (!s) return [];
        try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) {
                return parsed
                    .filter(x => typeof x === 'string' && x.trim())
                    .map(x => x.trim());
            }
        } catch {
            // ignore
        }
        if (s.includes(',')) {
            return s
                .split(',')
                .map(x => x.trim())
                .filter(Boolean);
        }
        return [s];
    }
    return [];
}

/** Ensure extraImages is always an array (DB may have stored comma-separated string). */
function normalizeColorExtraImages(value) {
    if (value == null) return [];
    if (Array.isArray(value)) return value.filter(x => typeof x === 'string' && x.trim()).map(s => s.trim());
    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
    return [];
}

/** Normalize product.colors so each color.extraImages is an array for API response. */
function normalizeProductColors(product) {
    if (!product || !Array.isArray(product.colors)) return product;
    return {
        ...product,
        colors: product.colors.map(c => ({
            ...c,
            extraImages: normalizeColorExtraImages(c && c.extraImages)
        }))
    };
}

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const products = await databaseController.getAllProducts();

        // Ensure products is an array
        if (!Array.isArray(products)) {
            console.error('⚠️  getAllProducts returned non-array:', typeof products);
            return res.json([]);
        }

        // Add storage URL to image paths (R2)
        const productsWithImageUrls = products.map(product => {
            const childrenPlayingArray = normalizeMediaList(product.children_playing);
            const desktopHeroImagesArray = normalizeMediaList(product.desktop_hero_images);
            const extraImagesArray = normalizeMediaList(product.extraimages);
            const price = product.price ? parseFloat(product.price) : 0;

            const productWithUrls = {
                ...product,
                price: price,
                buildingTime: product.buildingtime ?? product.buildingTime,
                recommendedAge: product.recommendedage ?? product.recommendedAge,
                homepageImage: getStorageUrl(product.homepageimage),
                extraImages: getStorageUrls(extraImagesArray),
                extraimages: getStorageUrls(extraImagesArray),
                // handled exactly like extraImages: normalize list then map to storage URLs
                childrenPlaying: getStorageUrls(childrenPlayingArray),
                desktopHeroImages: getStorageUrls(desktopHeroImagesArray)
            };
            return withPricing(normalizeProductColors(productWithUrls));
        });

        res.json(productsWithImageUrls);
    } catch (error) {
        console.error('❌ Error getting products:', error);
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
        // Return empty array instead of error object to prevent frontend crashes
        res.status(500).json([]);
    }
};

// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await databaseController.getProductById(req.params.id);

        if (product) {
            const childrenPlayingArray = normalizeMediaList(product.children_playing);
            const desktopHeroImagesArray = normalizeMediaList(product.desktop_hero_images);
            const price = product.price ? parseFloat(product.price) : 0;

            const extraImagesArray = normalizeMediaList(product.extraimages);

            const productWithImageUrls = normalizeProductColors({
                ...product,
                price: price,
                homepageImage: getStorageUrl(product.homepageimage),
                buildingTime: product.buildingtime ?? product.buildingTime,
                recommendedAge: product.recommendedage ?? product.recommendedAge,
                extraImages: getStorageUrls(extraImagesArray),
                extraimages: getStorageUrls(extraImagesArray),
                // handled exactly like extraImages: normalize list then map to storage URLs
                childrenPlaying: getStorageUrls(childrenPlayingArray),
                desktopHeroImages: getStorageUrls(desktopHeroImagesArray)
            });
            res.json(withPricing(productWithImageUrls));
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('❌ Error getting product:', error);
        console.error('   Product ID:', req.params.id);
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
        res.status(500).json({
            error: 'Failed to get product',
            message: error.message
        });
    }
};

// Create new product
exports.createProduct = async (req, res) => {
    try {
        const body = req.body || {};
        const discount = resolveDiscountUpdate(body, null);
        if (!discount.ok) {
            return res.status(400).json({ error: discount.error });
        }
        const allProducts = await databaseController.getAllProducts();
        const pageFields = resolvePageFields(body, null, allProducts, { isCreate: true });
        if (!pageFields.ok) {
            return res.status(pageFields.status).json({ error: pageFields.error });
        }
        const newProduct = await databaseController.createProduct({
            ...body,
            ...(discount.values || {}),
            special_page: pageFields.special_page,
            slug: pageFields.slug
        });
        res.status(201).json(withPricing(newProduct));
    } catch (error) {
        if (error.code === '23505' && /slug/i.test(String(error.constraint || error.detail || ''))) {
            return res.status(409).json({ error: 'כתובת הדף כבר בשימוש' });
        }
        console.error('Error creating product:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        res.status(500).json({ error: `Failed to create product: ${error.message}` });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const body = req.body || {};
        const existing = await databaseController.getProductById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const discount = resolveDiscountUpdate(body, existing);
        if (!discount.ok) {
            return res.status(400).json({ error: discount.error });
        }
        const allProducts = await databaseController.getAllProducts();
        const pageFields = resolvePageFields(body, existing, allProducts, { isCreate: false });
        if (!pageFields.ok) {
            return res.status(pageFields.status).json({ error: pageFields.error });
        }

        // Do not clear slug/special_page when omitted — only pass when present in pageFields
        const patch = {
            ...body,
            ...(discount.values || {})
        };
        delete patch.specialPage;
        delete patch.special_page;
        delete patch.slug;
        if (pageFields.special_page !== undefined) {
            patch.special_page = pageFields.special_page;
        }
        if (pageFields.slug !== undefined) {
            patch.slug = pageFields.slug;
        }

        const updatedProduct = await databaseController.updateProduct(req.params.id, patch);
        if (updatedProduct) {
            const childrenPlayingArray = normalizeMediaList(updatedProduct.children_playing);
            const desktopHeroImagesArray = normalizeMediaList(updatedProduct.desktop_hero_images);
            const price = updatedProduct.price ? parseFloat(updatedProduct.price) : 0;

            const extraImagesArray = normalizeMediaList(updatedProduct.extraimages);

            const productWithImageUrls = normalizeProductColors({
                ...updatedProduct,
                price: price,
                buildingTime: updatedProduct.buildingtime ?? updatedProduct.buildingTime,
                recommendedAge: updatedProduct.recommendedage ?? updatedProduct.recommendedAge,
                homepageImage: getStorageUrl(updatedProduct.homepageimage),
                extraImages: getStorageUrls(extraImagesArray),
                extraimages: getStorageUrls(extraImagesArray),
                // handled exactly like extraImages: normalize list then map to storage URLs
                childrenPlaying: getStorageUrls(childrenPlayingArray),
                desktopHeroImages: getStorageUrls(desktopHeroImagesArray)
            });

            res.json(withPricing(productWithImageUrls));
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        if (error.code === '23505' && /slug/i.test(String(error.constraint || error.detail || ''))) {
            return res.status(409).json({ error: 'כתובת הדף כבר בשימוש' });
        }
        console.error('Error updating product:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        res.status(500).json({ error: `Failed to update product: ${error.message}` });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        // Ensure bundles FK exists so RESTRICT can protect bundled products
        try {
            await databaseController.ensureBundlesSchema();
        } catch (schemaErr) {
            console.warn('ensureBundlesSchema before delete:', schemaErr.message);
        }
        const success = await databaseController.deleteProduct(req.params.id);
        if (success) {
            res.json({ message: 'Product deleted successfully' });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        const detail = String(error.detail || error.message || '');
        if (error.code === '23503' && /bundle_items/i.test(detail)) {
            try {
                const {
                    getBundleNamesContainingProduct
                } = require('./bundleController');
                const names = await getBundleNamesContainingProduct(req.params.id);
                const list = names.length ? names.join(', ') : 'באנדל';
                return res.status(409).json({
                    error: `לא ניתן למחוק את המוצר כי הוא חלק מהבאנדלים הבאים: ${list}`
                });
            } catch (lookupErr) {
                console.error('Error looking up bundles for product delete:', lookupErr);
                return res.status(409).json({
                    error: 'לא ניתן למחוק את המוצר כי הוא חלק מבאנדל'
                });
            }
        }
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};