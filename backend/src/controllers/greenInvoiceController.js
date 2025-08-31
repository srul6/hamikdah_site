const axios = require('axios');
const crypto = require('crypto');

class GreenInvoiceController {
    constructor() {
        this.apiKeyId = process.env.GREENINVOICE_API_KEY_ID;
        this.apiKeySecret = process.env.GREENINVOICE_API_KEY_SECRET;
        this.baseUrl = 'https://api.greeninvoice.co.il/api/v1';
        this.jwtToken = null;
        this.tokenExpiry = null;

        // Debug logging
        console.log('GreenInvoice Controller initialized with:', {
            apiKeyId: this.apiKeyId ? '***' : 'missing',
            apiKeySecret: this.apiKeySecret ? '***' : 'missing',
            baseUrl: this.baseUrl,
            nodeEnv: process.env.NODE_ENV
        });
    }

    // Get JWT token from GreenInvoice
    async getJWTToken() {
        try {
            // Check if we have a valid token
            if (this.jwtToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
                return this.jwtToken;
            }

            console.log('Getting new JWT token from GreenInvoice...');

            const response = await axios.post(
                `${this.baseUrl}/account/token`,
                {
                    id: this.apiKeyId,
                    secret: this.apiKeySecret
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            console.log('JWT token response:', response.data);

            if (response.data && response.data.token) {
                this.jwtToken = response.data.token;
                // Set token expiry based on the expires field from GreenInvoice
                this.tokenExpiry = response.data.expires * 1000; // Convert to milliseconds
                console.log('JWT token obtained successfully, expires:', new Date(this.tokenExpiry));
                return this.jwtToken;
            } else {
                throw new Error('No token received from GreenInvoice');
            }

        } catch (error) {
            console.error('Failed to get JWT token:', error);
            throw error;
        }
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
            if (!this.apiKeyId || !this.apiKeySecret) {
                console.error('GreenInvoice credentials not found:', {
                    apiKeyId: !!this.apiKeyId,
                    apiKeySecret: !!this.apiKeySecret
                });
                return res.status(500).json({
                    success: false,
                    error: 'GreenInvoice configuration missing',
                    message: 'Invoice service is not properly configured'
                });
            }

            // Get JWT token for authentication
            let jwtToken;
            try {
                jwtToken = await this.getJWTToken();
            } catch (error) {
                console.error('Failed to get JWT token:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Authentication failed',
                    message: 'Failed to authenticate with GreenInvoice'
                });
            }

            // Generate unique invoice ID
            const invoiceId = `INV_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

            // Prepare GreenInvoice request
            const invoiceRequest = {
                documentType: 200, // Invoice type
                currency: currency,
                language: 'he',
                description: items.map(item => item.name_he || item.name_en || item.name).join(', '),
                notes: 'תשלום מאובטח דרך חשבונית ירוקה',
                paymentTerms: 0, // Immediate payment
                paymentMethod: 1, // Credit card
                paymentLink: true, // Enable payment link
                sendByEmail: true, // Send invoice by email
                emailTemplate: 'default',
                client: {
                    name: customerInfo.name,
                    email: customerInfo.email,
                    phone: customerInfo.phone,
                    address: customerInfo.address || '',
                    city: customerInfo.city || '',
                    zip: customerInfo.zip || '',
                    country: 'IL'
                },
                items: items.map(item => ({
                    catalogId: item.id || 'product-' + Math.random().toString(36).substr(2, 9),
                    description: item.name_he || item.name_en || item.name,
                    quantity: item.quantity || 1,
                    price: parseFloat(item.price),
                    vatType: 0, // Include VAT
                    discount: 0
                })),
                payment: {
                    method: 1, // Credit card
                    cardComPlugin: true, // Enable Cardcom plugin
                    paymentLink: true,
                    paymentLinkExpiry: 7, // Link expires in 7 days
                    autoPayment: true // Auto-process payment when link is accessed
                }
            };

            // Debug logging
            console.log('GreenInvoice request:', invoiceRequest);

            // Create invoice with GreenInvoice API
            console.log('Making request to GreenInvoice API...');
            const response = await axios.post(
                `${this.baseUrl}/documents`,
                invoiceRequest,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${jwtToken}`
                    },
                    timeout: 30000
                }
            );

            console.log('GreenInvoice API response:', response.data);
            const result = response.data;

            if (result.success && result.data) {
                const invoiceData = result.data;
                console.log('Invoice created successfully:', invoiceData.id);

                res.json({
                    success: true,
                    invoiceId: invoiceData.id,
                    paymentUrl: invoiceData.paymentLink,
                    invoiceUrl: invoiceData.url,
                    message: 'Invoice created successfully with payment link'
                });
            } else {
                console.error('GreenInvoice invoice creation failed:', result);
                res.status(500).json({
                    success: false,
                    error: 'Invoice creation failed',
                    message: result.message || 'Unknown error'
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
            if (process.env.NODE_ENV === 'development' || !this.apiKeyId || !this.apiKeySecret) {
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

            // Get JWT token for authentication
            let jwtToken;
            try {
                jwtToken = await this.getJWTToken();
            } catch (error) {
                console.error('Failed to get JWT token for status check:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Authentication failed',
                    message: 'Failed to authenticate with GreenInvoice'
                });
            }

            const response = await axios.get(
                `${this.baseUrl}/documents/${invoiceId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${jwtToken}`
                    },
                    timeout: 10000
                }
            );

            const result = response.data;

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

            // Get JWT token for authentication
            let jwtToken;
            try {
                jwtToken = await this.getJWTToken();
            } catch (error) {
                console.error('Failed to get JWT token for customer creation:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Authentication failed',
                    message: 'Failed to authenticate with GreenInvoice'
                });
            }

            const customerRequest = {
                name: name,
                email: email,
                phone: phone,
                address: address || '',
                city: city || '',
                zip: zip || '',
                country: 'IL'
            };

            const response = await axios.post(
                `${this.baseUrl}/clients`,
                customerRequest,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${jwtToken}`
                    }
                }
            );

            const result = response.data;

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
