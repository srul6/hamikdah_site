const express = require('express');
const router = express.Router();

router.get('/env-check', (req, res) => {
    const envVars = {
        NODE_ENV: process.env.NODE_ENV,
        ADMIN_EMAIL: process.env.ADMIN_EMAIL ? 'SET (' + process.env.ADMIN_EMAIL.length + ' chars)' : 'NOT SET',
        ADMIN_EMAIL_PASSWORD: process.env.ADMIN_EMAIL_PASSWORD ? 'SET (' + process.env.ADMIN_EMAIL_PASSWORD.length + ' chars)' : 'NOT SET',
        SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com (default)',
        SMTP_PORT: process.env.SMTP_PORT || '587 (default)',
        BACKEND_URL: process.env.BACKEND_URL || 'NOT SET',
        FRONTEND_URL: process.env.FRONTEND_URL || 'NOT SET',
        CARDCOM_PLUGIN_ID: process.env.CARDCOM_PLUGIN_ID ? 'SET' : 'NOT SET',
        GREENINVOICE_API_KEY_ID: process.env.GREENINVOICE_API_KEY_ID ? 'SET' : 'NOT SET',
        GREENINVOICE_API_KEY_SECRET: process.env.GREENINVOICE_API_KEY_SECRET ? 'SET' : 'NOT SET'
    };

    res.json({
        success: true,
        message: 'Environment variables check',
        environment: envVars,
        timestamp: new Date().toISOString()
    });
});

router.get('/email-test', async (req, res) => {
    try {
        const EmailService = require('../services/emailService');
        const emailService = new EmailService();

        if (!emailService.transporter) {
            return res.status(500).json({
                success: false,
                message: 'Email service not configured',
                error: 'No transporter available'
            });
        }

        // Test email with minimal data
        const testData = {
            formId: 'debug-test-' + Date.now(),
            status: 'completed',
            documentId: 'doc-debug',
            paymentId: 'pay-debug',
            amount: 50.00,
            currency: 'ILS',
            customerInfo: {
                name: 'Debug Test',
                email: 'debug@test.com',
                phone: '050-0000000',
                street: 'Debug St',
                houseNumber: '1',
                city: 'Debug City'
            },
            items: [{
                name_he: 'פריט בדיקה',
                name_en: 'Debug Item',
                quantity: 1,
                price: 50.00
            }],
            purchaseTimestamp: new Date().toISOString(),
            dedication: 'Debug dedication'
        };

        const result = await emailService.sendOrderNotification(testData);

        res.json({
            success: true,
            message: 'Email test completed',
            emailSent: result,
            testData: testData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Email test failed',
            error: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;
