const express = require('express');
const router = express.Router();
const GreenInvoiceController = require('../controllers/greenInvoiceController');

// Instantiate the GreenInvoice controller
const greenInvoiceController = new GreenInvoiceController();

// Test endpoint to check environment variables and basic setup
router.get('/test', greenInvoiceController.testConnection.bind(greenInvoiceController));

// Create invoice with payment link
router.post('/create-invoice', (req, res) => {
    console.log('=== GreenInvoice create invoice route hit ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    greenInvoiceController.createInvoiceWithPayment.bind(greenInvoiceController)(req, res);
});

// Get Cardcom payment form
router.post('/payment-form', (req, res) => {
    console.log('=== GreenInvoice payment form route hit ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    greenInvoiceController.getPaymentForm.bind(greenInvoiceController)(req, res);
});

// Get invoice status
router.get('/status/:invoiceId', greenInvoiceController.getInvoiceStatus.bind(greenInvoiceController));

// Handle payment webhook
router.post('/webhook', greenInvoiceController.handlePaymentWebhook.bind(greenInvoiceController));

// Create customer
router.post('/customer', greenInvoiceController.createCustomer.bind(greenInvoiceController));

module.exports = router;
