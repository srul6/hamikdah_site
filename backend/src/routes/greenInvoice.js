const express = require('express');
const router = express.Router();
const GreenInvoiceController = require('../controllers/greenInvoiceController');

const greenInvoiceController = new GreenInvoiceController();

// Get payment form for CardCom integration
router.post('/payment-form', (req, res) => {
    console.log('=== GreenInvoice payment form route hit ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    greenInvoiceController.getPaymentForm.bind(greenInvoiceController)(req, res);
});

// Webhook endpoint to receive payment status updates from GreenInvoice
router.post('/webhook', (req, res) => {
    console.log('=== GreenInvoice webhook route hit ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    greenInvoiceController.webhook.bind(greenInvoiceController)(req, res);
});

// Test endpoint to verify GreenInvoice connection
router.get('/test', (req, res) => {
    console.log('=== GreenInvoice test route hit ===');
    greenInvoiceController.test.bind(greenInvoiceController)(req, res);
});

// Test endpoint to simulate payment success (development only)
router.get('/test-success', (req, res) => {
    console.log('=== GreenInvoice test success route hit ===');
    greenInvoiceController.testPaymentSuccess.bind(greenInvoiceController)(req, res);
});

// Test endpoint to simulate payment failure (development only)
router.get('/test-failure', (req, res) => {
    console.log('=== GreenInvoice test failure route hit ===');
    greenInvoiceController.testPaymentFailure.bind(greenInvoiceController)(req, res);
});

module.exports = router;
