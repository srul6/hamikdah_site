const express = require('express');
const router = express.Router();
const CardcomController = require('../controllers/cardcomController');

// Instantiate the Cardcom controller
const cardcomController = new CardcomController();

// Create payment transaction
router.post('/create-payment', (req, res) => {
    console.log('=== Cardcom route hit ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    cardcomController.createPayment.bind(cardcomController)(req, res);
});

// Handle Cardcom callback
router.post('/callback', cardcomController.handleCallback.bind(cardcomController));

// Get payment status
router.get('/status/:transactionId', cardcomController.getPaymentStatus.bind(cardcomController));

module.exports = router; 