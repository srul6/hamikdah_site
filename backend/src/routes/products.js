// backend/src/routes/products.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Add this route for testing - create a product with extra images
router.post('/', productController.createProduct);

// Add routes for updating and deleting products
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;