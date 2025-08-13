const express = require('express');
const router = express.Router();
const cardcomController = require('../controllers/cardcomController');

// Create payment transaction
router.post('/create-payment', cardcomController.createPayment);

// Handle Cardcom callback
router.post('/callback', cardcomController.handleCallback);

// Get payment status
router.get('/status/:transactionId', cardcomController.getPaymentStatus);

module.exports = router; 