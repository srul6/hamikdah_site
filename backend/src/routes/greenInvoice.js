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

// Test endpoint to verify email service
router.get('/test-email', async (req, res) => {
    try {
        console.log('=== Testing email service ===');

        const testOrderData = {
            formId: 'TEST-' + Date.now(),
            status: 'approved',
            documentId: 'DOC-TEST-123',
            paymentId: 'PAY-TEST-456',
            amount: 150,
            currency: 'ILS',
            customerInfo: {
                name: 'Test Customer',
                email: 'test@example.com',
                phone: '050-1234567',
                street: 'Test Street',
                houseNumber: '123',
                apartmentNumber: '4',
                floor: '2',
                city: 'Jerusalem'
            },
            items: [
                { name_he: 'בית המקדש', name_en: 'The Temple', quantity: 1, price: 150 }
            ],
            purchaseTimestamp: new Date().toISOString(),
            dedication: 'לעילוי נשמת'
        };

        const emailService = greenInvoiceController.emailService;
        const result = await emailService.sendOrderNotification(testOrderData);

        if (result) {
            res.json({
                success: true,
                message: 'Test email sent successfully to ' + emailService.adminEmail
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send test email. Check server logs for details.'
            });
        }
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
