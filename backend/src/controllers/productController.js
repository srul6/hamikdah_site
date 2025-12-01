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

        // Add storage URL to image paths (R2 or Supabase)
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

            // Ensure price is a number (PostgreSQL DECIMAL returns as string)
            const price = product.price ? parseFloat(product.price) : 0;

            // Handle extraImages - could be string, array, or JSON string
            let extraImagesArray = [];
            if (product.extraimages) {
                if (Array.isArray(product.extraimages)) {
                    extraImagesArray = product.extraimages;
                } else if (typeof product.extraimages === 'string') {
                    try {
                        const parsed = JSON.parse(product.extraimages);
                        extraImagesArray = Array.isArray(parsed) ? parsed : [parsed];
                    } catch {
                        // If not JSON, treat as comma-separated string or single value
                        extraImagesArray = product.extraimages.includes(',')
                            ? product.extraimages.split(',').map(s => s.trim()).filter(Boolean)
                            : [product.extraimages];
                    }
                }
            }

            return {
                ...product,
                price: price, // Ensure price is always a number
                homepageImage: getStorageUrl(product.homepageimage),
                // Keep both camelCase and lowercase for compatibility
                extraImages: getStorageUrls(extraImagesArray), // camelCase (for some components)
                extraimages: getStorageUrls(extraImagesArray), // lowercase (for MikdashProductPage)
                // Map children playing media - handle both full URLs and filenames
                childrenPlaying: childrenPlaying.map(media => {
                    if (!media) return null;
                    return typeof media === 'string' && media.startsWith('http')
                        ? media
                        : getStorageUrl(`mikdash_child_playing/${media}`);
                }).filter(Boolean),
                // Map desktop hero images (handle both filenames and full URLs)
                desktopHeroImages: desktopHeroImages.map(url => {
                    if (!url) return null;
                    return typeof url === 'string' && url.startsWith('http')
                        ? url
                        : getStorageUrl(url);
                }).filter(Boolean)
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
        console.log('🔍 Fetching product ID:', req.params.id);
        const product = await databaseController.getProductById(req.params.id);
        console.log('✅ Product fetched from database:', product ? `ID ${product.id}` : 'null');

        if (product) {
            // Handle children_playing - could be string, array, or JSON string
            let childrenPlaying = [];
            try {
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
            } catch (error) {
                console.error('⚠️  Error processing children_playing:', error);
                childrenPlaying = [];
            }

            // Handle desktop_hero_images - could be string, array, or JSON string
            let desktopHeroImages = [];
            try {
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
            } catch (error) {
                console.error('⚠️  Error processing desktop_hero_images:', error);
                desktopHeroImages = [];
            }

            // Ensure price is a number (PostgreSQL DECIMAL returns as string)
            const price = product.price ? parseFloat(product.price) : 0;

            // Handle extraImages - could be string, array, or JSON string
            let extraImagesArray = [];
            try {
                if (product.extraimages) {
                    if (Array.isArray(product.extraimages)) {
                        extraImagesArray = product.extraimages;
                    } else if (typeof product.extraimages === 'string') {
                        try {
                            const parsed = JSON.parse(product.extraimages);
                            extraImagesArray = Array.isArray(parsed) ? parsed : [parsed];
                        } catch {
                            // If not JSON, treat as comma-separated string or single value
                            extraImagesArray = product.extraimages.includes(',')
                                ? product.extraimages.split(',').map(s => s.trim()).filter(Boolean)
                                : [product.extraimages];
                        }
                    }
                }
            } catch (error) {
                console.error('⚠️  Error processing extraimages:', error);
                extraImagesArray = [];
            }

            // Ensure all arrays are arrays before processing
            if (!Array.isArray(extraImagesArray)) {
                extraImagesArray = [];
            }
            if (!Array.isArray(childrenPlaying)) {
                childrenPlaying = [];
            }
            if (!Array.isArray(desktopHeroImages)) {
                desktopHeroImages = [];
            }

            // Add storage URL to image paths (R2 or Supabase)
            const productWithImageUrls = {
                ...product,
                price: price, // Ensure price is always a number
                homepageImage: getStorageUrl(product.homepageimage),
                // Keep both camelCase and lowercase for compatibility
                extraImages: getStorageUrls(extraImagesArray), // camelCase (for some components)
                extraimages: getStorageUrls(extraImagesArray), // lowercase (for MikdashProductPage)
                // Map children playing media - handle both full URLs and filenames
                childrenPlaying: childrenPlaying.map(media => {
                    if (!media) return null;
                    try {
                        return typeof media === 'string' && media.startsWith('http')
                            ? media
                            : getStorageUrl(`mikdash_child_playing/${media}`);
                    } catch (error) {
                        console.error('⚠️  Error processing children playing media:', media, error);
                        return null;
                    }
                }).filter(Boolean),
                desktopHeroImages: desktopHeroImages.map(url => {
                    if (!url) return null;
                    try {
                        return typeof url === 'string' && url.startsWith('http')
                            ? url
                            : getStorageUrl(url);
                    } catch (error) {
                        console.error('⚠️  Error processing desktop hero image:', url, error);
                        return null;
                    }
                }).filter(Boolean)
            };
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
            // Process the updated product to add image URLs (same as getProductById)
            // Handle children_playing - could be string, array, or JSON string
            let childrenPlaying = [];
            if (updatedProduct.children_playing) {
                if (Array.isArray(updatedProduct.children_playing)) {
                    childrenPlaying = updatedProduct.children_playing;
                } else if (typeof updatedProduct.children_playing === 'string') {
                    try {
                        const parsed = JSON.parse(updatedProduct.children_playing);
                        childrenPlaying = Array.isArray(parsed) ? parsed : [parsed];
                    } catch {
                        childrenPlaying = [updatedProduct.children_playing];
                    }
                }
            }

            // Handle desktop_hero_images - could be string, array, or JSON string
            let desktopHeroImages = [];
            if (updatedProduct.desktop_hero_images) {
                if (Array.isArray(updatedProduct.desktop_hero_images)) {
                    desktopHeroImages = updatedProduct.desktop_hero_images;
                } else if (typeof updatedProduct.desktop_hero_images === 'string') {
                    try {
                        const parsed = JSON.parse(updatedProduct.desktop_hero_images);
                        desktopHeroImages = Array.isArray(parsed) ? parsed : [parsed];
                    } catch {
                        desktopHeroImages = [updatedProduct.desktop_hero_images];
                    }
                }
            }

            // Handle extraImages - could be string, array, or JSON string
            let extraImagesArray = [];
            if (updatedProduct.extraimages) {
                if (Array.isArray(updatedProduct.extraimages)) {
                    extraImagesArray = updatedProduct.extraimages;
                } else if (typeof updatedProduct.extraimages === 'string') {
                    try {
                        const parsed = JSON.parse(updatedProduct.extraimages);
                        extraImagesArray = Array.isArray(parsed) ? parsed : [parsed];
                    } catch {
                        // If not JSON, treat as comma-separated string or single value
                        extraImagesArray = updatedProduct.extraimages.includes(',')
                            ? updatedProduct.extraimages.split(',').map(s => s.trim()).filter(Boolean)
                            : [updatedProduct.extraimages];
                    }
                }
            }

            // Ensure price is a number (PostgreSQL DECIMAL returns as string)
            const price = updatedProduct.price ? parseFloat(updatedProduct.price) : 0;

            // Add storage URL to image paths (R2 or Supabase)
            const productWithImageUrls = {
                ...updatedProduct,
                price: price, // Ensure price is always a number
                homepageImage: getStorageUrl(updatedProduct.homepageimage),
                // Keep both camelCase and lowercase for compatibility
                extraImages: getStorageUrls(extraImagesArray), // camelCase (for some components)
                extraimages: getStorageUrls(extraImagesArray), // lowercase (for MikdashProductPage)
                // Map children playing media - handle both full URLs and filenames
                childrenPlaying: Array.isArray(childrenPlaying) ? childrenPlaying.map(media => {
                    if (!media) return null;
                    try {
                        return typeof media === 'string' && media.startsWith('http')
                            ? media
                            : getStorageUrl(`mikdash_child_playing/${media}`);
                    } catch (error) {
                        console.error('⚠️  Error processing children playing media:', media, error);
                        return null;
                    }
                }).filter(Boolean) : [],
                desktopHeroImages: Array.isArray(desktopHeroImages) ? desktopHeroImages.map(url => {
                    if (!url) return null;
                    try {
                        return typeof url === 'string' && url.startsWith('http')
                            ? url
                            : getStorageUrl(url);
                    } catch (error) {
                        console.error('⚠️  Error processing desktop hero image:', url, error);
                        return null;
                    }
                }).filter(Boolean) : []
            };

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