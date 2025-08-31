const crypto = require('crypto');
const GreenInvoiceService = require('../services/greenInvoiceService');

class GreenInvoiceController {
    constructor() {
        this.greenInvoiceService = new GreenInvoiceService();

        // Debug logging
        console.log('GreenInvoice Controller initialized');
    }

    // Create invoice with payment link
    async createInvoiceWithPayment(req, res) {
        console.log('=== GreenInvoice createInvoiceWithPayment called ===');
        console.log('Request body:', req.body);

        try {
            const { items, totalAmount, currency = 'ILS', customerInfo } = req.body;

            // Validate input parameters
            const validationErrors = this.validateInvoiceParams(items, totalAmount, customerInfo);
            if (validationErrors.length > 0) {
                console.log('Validation errors:', validationErrors);
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    message: validationErrors.join(', ')
                });
            }

            // Check if GreenInvoice credentials are available
            if (!this.greenInvoiceService.apiKeyId || !this.greenInvoiceService.apiKeySecret) {
                console.error('GreenInvoice credentials not found');
                return res.status(500).json({
                    success: false,
                    error: 'GreenInvoice configuration missing',
                    message: 'Invoice service is not properly configured'
                });
            }

            // Prepare invoice data in the correct format for Document Type 305 (Tax Invoice)
            const invoiceRequest = {
                type: 305,
                description: "Tax Invoice for Online Order",
                date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
                lang: "he", // Hebrew language
                currency: currency,
                income: items.map(item => ({
                    description: item.name_he || item.name_en || item.name,
                    quantity: item.quantity || 1,
                    price: parseFloat(item.price),
                    vatType: 1 // Standard VAT
                })),
                client: {
                    name: customerInfo.name,
                    email: customerInfo.email,
                    phone: customerInfo.phone,
                    address: customerInfo.address || ''
                },
                payment: {
                    method: 1, // Credit card
                    cardComPlugin: true
                }
            };

            // Debug logging
            console.log('GreenInvoice request:', JSON.stringify(invoiceRequest, null, 2));

            // Create invoice using the service
            const result = await this.greenInvoiceService.createInvoice(invoiceRequest);

            console.log('GreenInvoice API response:', result);

            // Check if invoice creation was successful (GreenInvoice returns invoice data directly)
            if (result && result.id) {
                console.log('Invoice created successfully:', result.id);

                res.json({
                    success: true,
                    invoiceId: result.id,
                    invoiceNumber: result.number,
                    paymentUrl: result.url?.origin || result.url,
                    invoiceUrl: result.url?.he || result.url?.origin || result.url,
                    message: 'Invoice created successfully',
                    details: result
                });
            } else {
                console.error('GreenInvoice invoice creation failed:', result);
                res.status(500).json({
                    success: false,
                    error: 'Invoice creation failed',
                    message: 'Invalid response from GreenInvoice API',
                    details: result
                });
            }

        } catch (error) {
            console.error('GreenInvoice invoice creation failed:', error);

            // Log more details about the error
            if (error.response) {
                console.error('GreenInvoice API error response:', {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers
                });
            } else if (error.request) {
                console.error('GreenInvoice API request error:', error.request);
            } else {
                console.error('GreenInvoice API error:', error.message);
            }

            // Fallback for testing when GreenInvoice API is not available
            if (process.env.NODE_ENV === 'development' || !this.greenInvoiceService.apiKeyId || !this.greenInvoiceService.apiKeySecret) {
                console.log('Using fallback mode for testing');
                const testInvoiceId = `TEST_INV_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

                res.json({
                    success: true,
                    invoiceId: testInvoiceId,
                    paymentUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?test=true`,
                    invoiceUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?test=true`,
                    message: 'Test invoice created successfully (GreenInvoice API not configured)'
                });
                return;
            }

            res.status(500).json({
                success: false,
                error: 'Invoice creation failed',
                message: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    // Get invoice status
    async getInvoiceStatus(req, res) {
        try {
            const { invoiceId } = req.params;

            if (!invoiceId) {
                return res.status(400).json({
                    success: false,
                    error: 'Invoice ID is required'
                });
            }

            const result = await this.greenInvoiceService.getInvoiceStatus(invoiceId);

            if (result.success && result.data) {
                res.json({
                    success: true,
                    invoice: result.data
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Invoice status check failed',
                    message: result.message
                });
            }

        } catch (error) {
            console.error('Invoice status check failed:', error);
            res.status(500).json({
                success: false,
                error: 'Status check failed',
                message: error.message
            });
        }
    }

    // Handle payment webhook
    async handlePaymentWebhook(req, res) {
        try {
            const webhookData = req.body;
            console.log('GreenInvoice payment webhook received:', webhookData);

            // Process the webhook data
            const {
                documentId,
                status,
                paymentStatus,
                paymentAmount,
                paymentDate,
                customerEmail
            } = webhookData;

            // Handle different payment statuses
            switch (paymentStatus) {
                case 'paid':
                    console.log('Payment successful for invoice:', documentId);
                    // Here you can update your database, send confirmation emails, etc.
                    break;
                case 'failed':
                    console.log('Payment failed for invoice:', documentId);
                    break;
                case 'pending':
                    console.log('Payment pending for invoice:', documentId);
                    break;
                default:
                    console.log('Unknown payment status:', paymentStatus);
            }

            // Respond to GreenInvoice with OK
            res.send('OK');

        } catch (error) {
            console.error('Payment webhook processing failed:', error);
            res.status(500).send('Webhook processing failed');
        }
    }

    // Create customer in GreenInvoice
    async createCustomer(req, res) {
        try {
            const { name, email, phone, address, city, zip } = req.body;

            const customerRequest = {
                name: name,
                email: email,
                phone: phone,
                address: address || '',
                city: city || '',
                zip: zip || '',
                country: 'IL'
            };

            const result = await this.greenInvoiceService.createCustomer(customerRequest);

            if (result.success && result.data) {
                res.json({
                    success: true,
                    customerId: result.data.id,
                    message: 'Customer created successfully'
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Customer creation failed',
                    message: result.message
                });
            }

        } catch (error) {
            console.error('Customer creation failed:', error);
            res.status(500).json({
                success: false,
                error: 'Customer creation failed',
                message: error.message
            });
        }
    }

    // Validate invoice parameters
    validateInvoiceParams(items, totalAmount, customerInfo) {
        const errors = [];

        if (!items || items.length === 0) {
            errors.push('Items array is required and cannot be empty');
        }

        if (!totalAmount || totalAmount <= 0) {
            errors.push('Total amount must be greater than 0');
        }

        if (!customerInfo) {
            errors.push('Customer information is required');
        } else {
            if (!customerInfo.name || customerInfo.name.trim() === '') {
                errors.push('Customer name is required');
            }
            if (!customerInfo.email || customerInfo.email.trim() === '') {
                errors.push('Customer email is required');
            }
            if (!customerInfo.phone || customerInfo.phone.trim() === '') {
                errors.push('Customer phone is required');
            }
        }

        return errors;
    }

    // Test endpoint to check environment variables
    async testConnection(req, res) {
        console.log('=== GreenInvoice test endpoint called ===');
        console.log('Environment variables check:');
        console.log('- GREENINVOICE_API_KEY_ID:', process.env.GREENINVOICE_API_KEY_ID ? '***' : 'missing');
        console.log('- GREENINVOICE_API_KEY_SECRET:', process.env.GREENINVOICE_API_KEY_SECRET ? '***' : 'missing');
        console.log('- NODE_ENV:', process.env.NODE_ENV);

        res.json({
            success: true,
            message: 'GreenInvoice test endpoint working',
            environment: {
                apiKeyId: !!process.env.GREENINVOICE_API_KEY_ID,
                apiKeySecret: !!process.env.GREENINVOICE_API_KEY_SECRET,
                nodeEnv: process.env.NODE_ENV
            }
        });
    }
}

module.exports = GreenInvoiceController;
