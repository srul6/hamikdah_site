// backend/src/controllers/productController.js
const { databaseController } = require('../config/database');
const { getStorageUrl, getStorageUrls } = require('../utils/storageUtils');

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const products = await databaseController.getAllProducts();

        // Ensure products is an array
        if (!Array.isArray(products)) {
            console.error('⚠️  getAllProducts returned non-array:', typeof products);
            return res.json([]);
        }

        // Add Supabase Storage URL to image paths
        const productsWithImageUrls = products.map(product => {
            // Handle children_playing - could be string, array, or JSON string
            let childrenPlaying = [];
            if (product.children_playing) {
                if (Array.isArray(product.children_playing)) {
                    childrenPlaying = product.children_playing;
                } else if (typeof product.children_playing === 'string') {
                    try {
                        const parsed = JSON.parse(product.children_playing);
                        childrenPlaying = Array.isArray(parsed) ? parsed : [parsed];
                    } catch {
                        childrenPlaying = [product.children_playing];
                    }
                }
            }

            // Handle desktop_hero_images - could be string, array, or JSON string
            let desktopHeroImages = [];
            if (product.desktop_hero_images) {
                if (Array.isArray(product.desktop_hero_images)) {
                    desktopHeroImages = product.desktop_hero_images;
                } else if (typeof product.desktop_hero_images === 'string') {
                    try {
                        const parsed = JSON.parse(product.desktop_hero_images);
                        desktopHeroImages = Array.isArray(parsed) ? parsed : [parsed];
                    } catch {
                        desktopHeroImages = [product.desktop_hero_images];
                    }
                }
            }

            return {
                ...product,
                homepageImage: getStorageUrl(product.homepageimage),
                extraImages: getStorageUrls(product.extraimages),
                // Map children playing media - handle both full URLs and filenames
                childrenPlaying: childrenPlaying.map(media =>
                    typeof media === 'string' && media.startsWith('http') ? media : getStorageUrl(`mikdash_child_playing/${media}`)
                ),
                // Map desktop hero images (handle both filenames and full URLs)
                desktopHeroImages: desktopHeroImages.map(url =>
                    typeof url === 'string' && url.startsWith('http') ? url : getStorageUrl(url)
                )
            };
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
            // Add Supabase Storage URL to image paths
            const productWithImageUrls = {
                ...product,
                homepageImage: getStorageUrl(product.homepageimage),
                extraImages: getStorageUrls(product.extraimages),
                // Map children playing media - handle both full URLs and filenames
                childrenPlaying: (product.children_playing || []).map(media =>
                    media.startsWith('http') ? media : getStorageUrl(`mikdash_child_playing/${media}`)
                ),
                desktopHeroImages: (product.desktop_hero_images || []).map(url =>
                    url.startsWith('http') ? url : getStorageUrl(url)
                )
            };
            res.json(productWithImageUrls);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Error getting product:', error);
        res.status(500).json({ error: 'Failed to get product' });
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
            res.json(updatedProduct);
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