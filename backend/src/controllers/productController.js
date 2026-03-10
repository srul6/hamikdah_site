// backend/src/controllers/productController.js
const { databaseController } = require('../config/database');
const { getStorageUrl, getStorageUrls } = require('../utils/storageUtils');

/** Flatten and normalize to array of non-empty strings (handles malformed/nested JSON from DB). */
function normalizeToStrings(value) {
    if (value == null) return [];
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return normalizeToStrings(parsed);
        } catch {
            return value.trim() ? [value.trim()] : [];
        }
    }
    if (!Array.isArray(value)) return [];
    const out = [];
    for (const item of value) {
        if (typeof item === 'string' && item.trim()) out.push(item.trim());
        else if (Array.isArray(item)) out.push(...normalizeToStrings(item));
    }
    return out;
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
            const childrenPlaying = normalizeToStrings(product.children_playing);
            const desktopHeroImages = normalizeToStrings(product.desktop_hero_images);
            const price = product.price ? parseFloat(product.price) : 0;

            let extraImagesArray = [];
            if (product.extraimages) {
                if (Array.isArray(product.extraimages)) {
                    extraImagesArray = product.extraimages.filter(x => typeof x === 'string' && x.trim());
                } else if (typeof product.extraimages === 'string') {
                    try {
                        const parsed = JSON.parse(product.extraimages);
                        extraImagesArray = Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string' && x.trim()) : [];
                    } catch {
                        extraImagesArray = product.extraimages.includes(',')
                            ? product.extraimages.split(',').map(s => s.trim()).filter(Boolean)
                            : (product.extraimages.trim() ? [product.extraimages.trim()] : []);
                    }
                }
            }

            const productWithUrls = {
                ...product,
                price: price,
                buildingTime: product.buildingtime ?? product.buildingTime,
                recommendedAge: product.recommendedage ?? product.recommendedAge,
                homepageImage: getStorageUrl(product.homepageimage),
                extraImages: getStorageUrls(extraImagesArray),
                extraimages: getStorageUrls(extraImagesArray),
                childrenPlaying: childrenPlaying.map(media =>
                    media.startsWith('http') ? media : getStorageUrl(`mikdash_child_playing/${media}`)
                ).filter(Boolean),
                desktopHeroImages: desktopHeroImages.map(url =>
                    url.startsWith('http') ? url : getStorageUrl(url)
                ).filter(Boolean)
            };
            return normalizeProductColors(productWithUrls);
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
        console.log('🔍 Fetching product ID:', req.params.id);
        const product = await databaseController.getProductById(req.params.id);
        console.log('✅ Product fetched from database:', product ? `ID ${product.id}` : 'null');

        if (product) {
            const childrenPlaying = normalizeToStrings(product.children_playing);
            const desktopHeroImages = normalizeToStrings(product.desktop_hero_images);
            const price = product.price ? parseFloat(product.price) : 0;

            let extraImagesArray = [];
            if (product.extraimages) {
                if (Array.isArray(product.extraimages)) {
                    extraImagesArray = product.extraimages.filter(x => typeof x === 'string' && x.trim());
                } else if (typeof product.extraimages === 'string') {
                    try {
                        const parsed = JSON.parse(product.extraimages);
                        extraImagesArray = Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string' && x.trim()) : [];
                    } catch {
                        extraImagesArray = product.extraimages.includes(',')
                            ? product.extraimages.split(',').map(s => s.trim()).filter(Boolean)
                            : (product.extraimages.trim() ? [product.extraimages.trim()] : []);
                    }
                }
            }

            const productWithImageUrls = normalizeProductColors({
                ...product,
                price: price,
                homepageImage: getStorageUrl(product.homepageimage),
                buildingTime: product.buildingtime ?? product.buildingTime,
                recommendedAge: product.recommendedage ?? product.recommendedAge,
                extraImages: getStorageUrls(extraImagesArray),
                extraimages: getStorageUrls(extraImagesArray),
                childrenPlaying: childrenPlaying.map(media =>
                    media.startsWith('http') ? media : getStorageUrl(`mikdash_child_playing/${media}`)
                ).filter(Boolean),
                desktopHeroImages: desktopHeroImages.map(url =>
                    url.startsWith('http') ? url : getStorageUrl(url)
                ).filter(Boolean)
            });
            res.json(productWithImageUrls);
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
        console.log('Creating product with data:', req.body);
        const newProduct = await databaseController.createProduct(req.body);
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        res.status(500).json({ error: `Failed to create product: ${error.message}` });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        console.log('Updating product with data:', req.body);
        const updatedProduct = await databaseController.updateProduct(req.params.id, req.body);
        if (updatedProduct) {
            const childrenPlaying = normalizeToStrings(updatedProduct.children_playing);
            const desktopHeroImages = normalizeToStrings(updatedProduct.desktop_hero_images);
            const price = updatedProduct.price ? parseFloat(updatedProduct.price) : 0;

            let extraImagesArray = [];
            if (updatedProduct.extraimages) {
                if (Array.isArray(updatedProduct.extraimages)) {
                    extraImagesArray = updatedProduct.extraimages.filter(x => typeof x === 'string' && x.trim());
                } else if (typeof updatedProduct.extraimages === 'string') {
                    try {
                        const parsed = JSON.parse(updatedProduct.extraimages);
                        extraImagesArray = Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string' && x.trim()) : [];
                    } catch {
                        extraImagesArray = updatedProduct.extraimages.includes(',')
                            ? updatedProduct.extraimages.split(',').map(s => s.trim()).filter(Boolean)
                            : (updatedProduct.extraimages.trim() ? [updatedProduct.extraimages.trim()] : []);
                    }
                }
            }

            const productWithImageUrls = normalizeProductColors({
                ...updatedProduct,
                price: price,
                buildingTime: updatedProduct.buildingtime ?? updatedProduct.buildingTime,
                recommendedAge: updatedProduct.recommendedage ?? updatedProduct.recommendedAge,
                homepageImage: getStorageUrl(updatedProduct.homepageimage),
                extraImages: getStorageUrls(extraImagesArray),
                extraimages: getStorageUrls(extraImagesArray),
                childrenPlaying: childrenPlaying.map(media =>
                    media.startsWith('http') ? media : getStorageUrl(`mikdash_child_playing/${media}`)
                ).filter(Boolean),
                desktopHeroImages: desktopHeroImages.map(url =>
                    url.startsWith('http') ? url : getStorageUrl(url)
                ).filter(Boolean)
            });

            res.json(productWithImageUrls);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Error updating product:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        res.status(500).json({ error: `Failed to update product: ${error.message}` });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const success = await databaseController.deleteProduct(req.params.id);
        if (success) {
            res.json({ message: 'Product deleted successfully' });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};