// backend/src/controllers/productController.js
const supabaseController = require('./supabaseController');
const { getStorageUrl, getStorageUrls } = require('../utils/storageUtils');

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const products = await supabaseController.getAllProducts();
        // Add Supabase Storage URL to image paths
        const productsWithImageUrls = products.map(product => ({
            ...product,
            homepageImage: getStorageUrl(product.homepageimage),
            extraImages: getStorageUrls(product.extraimages),
            // Map children playing media with auto-prepend folder path
            childrenPlaying: getStorageUrls((product.children_playing || []).map(media => `mikdash_child_playing/${media}`)),
            // Map desktop hero images (handle both filenames and full URLs)
            desktopHeroImages: (product.desktop_hero_images || []).map(url =>
                url.startsWith('http') ? url : getStorageUrl(url)
            )
        }));
        res.json(productsWithImageUrls);
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: 'Failed to get products' });
    }
};

// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await supabaseController.getProductById(req.params.id);
        if (product) {
            // Add Supabase Storage URL to image paths
            const productWithImageUrls = {
                ...product,
                homepageImage: getStorageUrl(product.homepageimage),
                extraImages: getStorageUrls(product.extraimages),
                childrenPlaying: getStorageUrls((product.children_playing || []).map(media => `mikdash_child_playing/${media}`)),
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
        const newProduct = await supabaseController.createProduct(req.body);
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
        const updatedProduct = await supabaseController.updateProduct(req.params.id, req.body);
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
        const success = await supabaseController.deleteProduct(req.params.id);
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