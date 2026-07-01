const express = require('express');
const router = express.Router();
const GreenInvoiceController = require('../controllers/greenInvoiceController');

const greenInvoiceController = new GreenInvoiceController();

const devLog = (...args) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(...args);
    }
};

function blockTestRoutesInProduction(req, res, next) {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Not available in production' });
    }
    next();
}

// Get payment form for CardCom integration
router.post('/payment-form', (req, res) => {
    devLog('=== GreenInvoice payment form route hit ===');
    devLog('Request method:', req.method);
    devLog('Request URL:', req.url);
    greenInvoiceController.getPaymentForm.bind(greenInvoiceController)(req, res);
});

// Webhook endpoint to receive payment status updates from GreenInvoice
router.post('/webhook/:secret', (req, res, next) => {
    if (req.params.secret !== process.env.WEBHOOK_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}, greenInvoiceController.webhook.bind(greenInvoiceController));

// Test endpoint to verify GreenInvoice connection
router.get('/test', blockTestRoutesInProduction, (req, res) => {
    devLog('=== GreenInvoice test route hit ===');
    greenInvoiceController.test.bind(greenInvoiceController)(req, res);
});

// Test endpoint to simulate payment success (development only)
router.get('/test-success', blockTestRoutesInProduction, (req, res) => {
    devLog('=== GreenInvoice test success route hit ===');
    greenInvoiceController.testPaymentSuccess.bind(greenInvoiceController)(req, res);
});

// Test endpoint to simulate payment failure (development only)
router.get('/test-failure', blockTestRoutesInProduction, (req, res) => {
    devLog('=== GreenInvoice test failure route hit ===');
    greenInvoiceController.testPaymentFailure.bind(greenInvoiceController)(req, res);
});

// Test endpoint to verify email service
router.get('/test-email', blockTestRoutesInProduction, async (req, res) => {
    try {
        devLog('=== Testing email service ===');

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
                {
                    name_he: 'קופת צדקה (כחול)',
                    name_en: 'Charity box (Blue)',
                    quantity: 2,
                    price: 50
                },
                { name_he: 'בית המקדש', name_en: 'The Temple', quantity: 1, price: 50 }
            ],
            purchaseTimestamp: new Date().toISOString(),
            dedication: 'לעילוי נשמת'
        };

        const emailService = greenInvoiceController.emailService;
        const googleSheetsService = greenInvoiceController.googleSheetsService;

        const emailResult = await emailService.sendOrderNotification(testOrderData);
        const sheetResult = await googleSheetsService.sendOrderToGoogleSheet(testOrderData);

        if (emailResult || sheetResult) {
            res.json({
                success: true,
                message: 'Test completed',
                email: emailResult ? 'sent' : 'failed',
                googleSheets: sheetResult ? 'appended' : 'failed'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send test email and append to Google Sheets. Check server logs for details.',
                email: 'failed',
                googleSheets: 'failed'
            });
        }
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test email'
        });
    }
});

module.exports = router;
