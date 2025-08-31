const express = require('express');
const router = express.Router();
const CardcomController = require('../controllers/cardcomController');

// Instantiate the Cardcom controller
const cardcomController = new CardcomController();

// Create LowProfile deal for payment page
router.post('/create-lowprofile', (req, res) => {
    console.log('=== Cardcom LowProfile route hit ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    cardcomController.createLowProfile.bind(cardcomController)(req, res);
});

// Process transaction directly (alternative to LowProfile)
router.post('/process-transaction', (req, res) => {
    console.log('=== Cardcom direct transaction route hit ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    cardcomController.processTransaction.bind(cardcomController)(req, res);
});

// Handle Cardcom callback
router.post('/callback', cardcomController.handleCallback.bind(cardcomController));

// Get payment status
router.get('/status/:lowProfileId', cardcomController.getPaymentStatus.bind(cardcomController));

module.exports = router; 