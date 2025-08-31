const express = require('express');
const router = express.Router();
const CardcomController = require('../controllers/cardcomController');

// Instantiate the Cardcom controller
const cardcomController = new CardcomController();

// Test endpoint to check environment variables and basic setup
router.get('/test', (req, res) => {
    console.log('=== Cardcom test endpoint called ===');
    console.log('Environment variables check:');
    console.log('- CARDCOM_TERMINAL_NUMBER:', process.env.CARDCOM_TERMINAL_NUMBER);
    console.log('- CARDCOM_API_NAME:', process.env.CARDCOM_API_NAME);
    console.log('- CARDCOM_API_PASSWORD:', process.env.CARDCOM_API_PASSWORD ? '***' : 'missing');
    console.log('- FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('- BACKEND_URL:', process.env.BACKEND_URL);
    console.log('- NODE_ENV:', process.env.NODE_ENV);

    res.json({
        success: true,
        message: 'Cardcom test endpoint working',
        environment: {
            terminalNumber: !!process.env.CARDCOM_TERMINAL_NUMBER,
            apiName: !!process.env.CARDCOM_API_NAME,
            apiPassword: !!process.env.CARDCOM_API_PASSWORD,
            frontendUrl: process.env.FRONTEND_URL,
            backendUrl: process.env.BACKEND_URL,
            nodeEnv: process.env.NODE_ENV
        }
    });
});

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