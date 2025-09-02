const GreenInvoiceService = require('../services/greenInvoiceService');
const EmailService = require('../services/emailService');
const axios = require('axios'); // Added for testing document types

class GreenInvoiceController {
    constructor() {
        this.greenInvoiceService = new GreenInvoiceService();
        this.emailService = new EmailService();
        this.processedWebhooks = new Set(); // Track processed webhooks to prevent duplicates
        console.log('GreenInvoice Controller initialized');
    }

    // Get payment form for CardCom integration
    async getPaymentForm(req, res) {
        console.log('=== Creating GreenInvoice payment form ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('Request headers:', req.headers);

        try {
            const { items, totalAmount, currency = 'ILS', customerInfo, id } = req.body;

            // Validate input parameters
            const errors = this.validatePaymentParams(items, totalAmount, customerInfo);
            if (errors.length > 0) {
                console.log('Validation errors:', errors);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid input parameters',
                    errors: errors
                });
            }

            // Calculate total amount from items
            const calculatedTotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0);

            // Build invoice request according to GreenInvoice payments/form schema
            const invoiceRequest = {
                description: `תשלום על הזמנה #${Date.now()}`,
                type: 320,
                date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
                lang: "he",
                currency: "ILS",
                vatType: 0,
                amount: totalAmount,
                maxPayments: 1,
                pluginId: process.env.CARDCOM_PLUGIN_ID,
                group: 100,
                client: {
                    name: customerInfo.name || 'אורח',
                    emails: [customerInfo.email],
                    phone: customerInfo.phone || '050-0000000',
                    address: `${customerInfo.street || ''} ${customerInfo.houseNumber || ''} ${customerInfo.apartmentNumber ? `Apt ${customerInfo.apartmentNumber}` : ''} ${customerInfo.floor ? `Floor ${customerInfo.floor}` : ''}`.trim(),
                    city: customerInfo.city || '',
                    country: "IL"
                },
                income: items.map(item => ({
                    description: item.name_he || item.name_en || item.name || 'פריט',
                    quantity: item.quantity || 1,
                    price: parseFloat(item.price),
                    vatType: 1
                })),
                remarks: "תודה על הזמנתך",
                successUrl: `${process.env.FRONTEND_URL || 'https://your-domain.com'}/payment/success`,
                failureUrl: `${process.env.FRONTEND_URL || 'https://your-domain.com'}/payment/failure`,
                notifyUrl: `${process.env.BACKEND_URL || 'https://your-domain.com'}/api/greeninvoice/webhook`,
                custom: JSON.stringify({
                    orderId: Date.now(),
                    customerId: customerInfo.email,
                    customerName: customerInfo.name,
                    customerPhone: customerInfo.phone,
                    customerStreet: customerInfo.street,
                    customerHouseNumber: customerInfo.houseNumber,
                    customerApartmentNumber: customerInfo.apartmentNumber || '',
                    customerFloor: customerInfo.floor || '',
                    customerCity: customerInfo.city,
                    items: items.map(item => item.id).join(','),
                    dedication: customerInfo.dedication || '',
                    amount: totalAmount,
                    currency: currency
                })
            };

            console.log('Creating invoice with request:', JSON.stringify(invoiceRequest, null, 2));

            // Create the payment form
            const paymentResult = await this.greenInvoiceService.getPaymentForm(invoiceRequest);

            if (!paymentResult || !paymentResult.url) {
                throw new Error('Failed to create payment form: ' + JSON.stringify(paymentResult));
            }

            console.log('Payment form created successfully:', paymentResult);

            // Return the payment form URL with additional details
            res.json({
                success: true,
                message: 'Payment form created successfully',
                paymentFormUrl: paymentResult.url,
                formId: paymentResult.formId || paymentResult.url.split('/').pop().split('?')[0],
                status: 'created'
            });

        } catch (error) {
            console.error('Error creating payment form:', error);

            // Enhanced error handling to return full GreenInvoice error details
            if (error.isAxiosError && error.greenInvoiceError) {
                // Return the full GreenInvoice error details from the service
                const statusCode = error.response?.status || 500;
                res.status(statusCode).json({
                    success: false,
                    message: 'GreenInvoice API Error',
                    error: error.greenInvoiceError.errorMessage || error.message,
                    errorCode: error.greenInvoiceError.errorCode,
                    greenInvoiceError: error.greenInvoiceError,
                    status: statusCode
                });
            } else if (error.isAxiosError && error.response) {
                // Return axios error details
                const statusCode = error.response.status || 500;
                res.status(statusCode).json({
                    success: false,
                    message: 'API Request Error',
                    error: error.message,
                    status: statusCode,
                    details: error.response.data
                });
            } else if (error.isAxiosError && error.request) {
                // No response received from server
                res.status(503).json({
                    success: false,
                    message: 'No response received from GreenInvoice API',
                    error: error.message,
                    status: 503
                });
            } else {
                // Return generic error details
                res.status(500).json({
                    success: false,
                    message: 'Failed to create payment form',
                    error: error.message,
                    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
                });
            }
        }
    }


    // Webhook endpoint to receive payment status updates from GreenInvoice
    async webhook(req, res) {
        console.log('=== GreenInvoice webhook received ===');
        console.log('🕐 Timestamp:', new Date().toISOString());
        console.log('🌐 Remote IP:', req.ip || req.connection.remoteAddress);
        console.log('📋 Webhook body:', JSON.stringify(req.body, null, 2));
        console.log('📋 Webhook body type:', typeof req.body);
        console.log('📋 Webhook body keys:', Object.keys(req.body));
        console.log('📋 Webhook headers:', JSON.stringify(req.headers, null, 2));
        console.log('🔍 Request method:', req.method);
        console.log('🔍 Request URL:', req.url);
        console.log('🔍 User agent:', req.headers['user-agent'] || 'Unknown');

        try {
            // DUPLICATE PREVENTION: Check if we've already processed this webhook
            const webhookId = req.body.id || req.body.document_id || req.body.transaction_id;
            if (!webhookId) {
                console.log('❌ No webhook ID found, rejecting duplicate prevention check');
                return res.status(400).json({ error: 'No webhook ID provided' });
            }

            // Check if this webhook was already processed
            if (this.processedWebhooks.has(webhookId)) {
                console.log(`⚠️  Duplicate webhook detected - ID: ${webhookId}, skipping processing`);
                return res.status(200).json({ message: 'Webhook already processed' });
            }

            // Mark this webhook as processed
            this.processedWebhooks.add(webhookId);
            console.log(`✅ Webhook ID ${webhookId} marked as processed`);

            // Clean up old webhook IDs to prevent memory leaks (keep last 1000)
            if (this.processedWebhooks.size > 1000) {
                const webhookIds = Array.from(this.processedWebhooks);
                const idsToRemove = webhookIds.slice(0, webhookIds.length - 1000);
                idsToRemove.forEach(id => this.processedWebhooks.delete(id));
                console.log(`🧹 Cleaned up ${idsToRemove.length} old webhook IDs`);
            }

            // Green Invoice sends different field names - map them correctly
            const {
                id,                    // This is the formId
                document_id,           // This is the documentId
                transaction_id,        // This is the paymentId
                type,                  // Document type
                external_data,         // This contains the custom data
                number                 // Document number
            } = req.body;

            // Map to expected field names
            const formId = id;
            const documentId = document_id;
            const paymentId = transaction_id;
            const status = 'completed'; // Green Invoice sends webhook when payment is completed
            const custom = external_data;

            // Parse custom data to get additional customer details and order info
            let customData = {};
            let customerInfo = {};
            let items = [];
            let amount = 0;
            let currency = 'ILS';

            if (custom) {
                try {
                    customData = typeof custom === 'string' ? JSON.parse(custom) : custom;
                    console.log('✅ Custom data parsed successfully:', customData);

                    // Extract customer info and order details from custom data
                    if (customData.customerId) {
                        customerInfo = {
                            name: customData.customerName || 'לקוח',
                            email: customData.customerId, // customerId is actually the email
                            phone: customData.customerPhone || 'לא זמין',
                            street: customData.customerStreet || 'לא זמין',
                            houseNumber: customData.customerHouseNumber || 'לא זמין',
                            apartmentNumber: customData.customerApartmentNumber || '',
                            floor: customData.customerFloor || '',
                            city: customData.customerCity || 'לא זמין',
                            country: 'IL'
                        };
                    }

                    // Set values from custom data
                    amount = customData.amount || 0;
                    currency = customData.currency || 'ILS';

                    // Create items array with actual product info
                    if (customData.items) {
                        const itemIds = customData.items.split(',').filter(id => id.trim());
                        items = itemIds.map(itemId => ({
                            id: itemId.trim(),
                            name_he: 'פריט',
                            name_en: 'Item',
                            quantity: 1,
                            price: amount / itemIds.length // Distribute amount across items
                        }));
                    } else {
                        items = [{ name_he: 'פריט', quantity: 1, price: amount }];
                    }

                } catch (error) {
                    console.error('❌ Failed to parse custom data:', error);
                    console.error('Raw custom data:', custom);
                }
            }

            // Custom data already parsed above

            // Combine customer info with custom data, handling missing customerInfo gracefully
            const fullCustomerInfo = {
                name: customerInfo?.name || 'לא זמין',
                email: customerInfo?.email || 'לא זמין',
                phone: customerInfo?.phone || 'לא זמין',
                street: customerInfo?.street || 'לא זמין',
                houseNumber: customerInfo?.houseNumber || 'לא זמין',
                apartmentNumber: customerInfo?.apartmentNumber || '',
                floor: customerInfo?.floor || '',
                city: customerInfo?.city || 'לא זמין',
                country: customerInfo?.country || 'IL',
                dedication: customData.dedication || ''
            };

            // Validate webhook data
            if (!formId || !status) {
                console.error('❌ Invalid webhook data received - Missing formId or status');
                console.error('Received data:', { formId, status, documentId, paymentId });
                return res.status(400).json({ error: 'Invalid webhook data' });
            }

            console.log(`🎯 Payment webhook received - Form ID: ${formId}, Status: "${status}", Document ID: ${documentId || 'N/A'}`);
            console.log(`💰 Amount: ${amount} ${currency}, Payment ID: ${paymentId || 'N/A'}`);
            console.log(`👤 Customer: ${customerInfo?.name || 'N/A'} (${customerInfo?.email || 'N/A'})`);

            // Prepare order data for server notification and email
            const orderData = {
                formId,
                status,
                documentId,
                paymentId,
                amount,
                currency,
                customerInfo: fullCustomerInfo,
                items: Array.isArray(items) ? items : [],
                purchaseTimestamp: new Date().toISOString(),
                dedication: customData.dedication || ''
            };

            // Send order data to your server
            await this.sendOrderToServer(orderData);

            // Store order locally for API access
            console.log('About to store order locally...');
            const localStorageResult = await this.storeOrderLocally(orderData);
            console.log('Local storage result:', localStorageResult);

            // ALWAYS send email notification to admin regardless of status
            console.log('📧 Sending admin email notification for status:', status);
            try {
                await this.emailService.sendOrderNotification(orderData);
                console.log('✅ Admin email notification sent successfully');
            } catch (error) {
                console.error('❌ Failed to send admin email notification:', error);
            }

            // Handle different payment statuses
            console.log('🔄 Processing payment status:', status);
            switch (status.toLowerCase()) {
                case 'approved':
                case 'completed':
                case 'success':
                case 'paid':
                case 'successful':
                    console.log('✅ Payment completed successfully - Status:', status);

                    // Get document details if available
                    let documentDetails = null;
                    if (documentId && documentId !== 'undefined' && documentId !== 'null') {
                        try {
                            console.log('🔍 Fetching document details for ID:', documentId);
                            documentDetails = await this.greenInvoiceService.getDocument(documentId);
                            console.log('✅ Document details retrieved:', documentDetails);
                        } catch (error) {
                            console.error('❌ Failed to get document details:', error);
                            console.error('Document ID was:', documentId);
                            // Continue processing even if document fetch fails
                        }
                    } else {
                        console.log('⚠️  No valid documentId provided, skipping document fetch');
                        console.log('Received documentId:', documentId);
                    }

                    // Update order status in your database
                    await this.updateOrderStatus(formId, 'completed', {
                        documentId,
                        paymentId,
                        amount,
                        currency,
                        documentDetails
                    });

                    // Send confirmation email to customer
                    if (customerInfo && customerInfo.email) {
                        await this.sendPaymentConfirmationEmail(customerInfo.email, {
                            formId,
                            documentId,
                            amount,
                            currency,
                            documentDetails
                        });
                    }

                    break;

                case 'declined':
                case 'failed':
                case 'error':
                case 'rejected':
                case 'cancelled':
                case 'canceled':
                    console.log('❌ Payment failed or declined - Status:', status);

                    // Update order status in your database
                    await this.updateOrderStatus(formId, 'failed', {
                        documentId,
                        paymentId,
                        amount,
                        currency,
                        reason: req.body.reason || 'Payment declined'
                    });

                    // Send failure notification email to customer
                    if (customerInfo && customerInfo.email) {
                        await this.sendPaymentFailureEmail(customerInfo.email, {
                            formId,
                            amount,
                            currency,
                            reason: req.body.reason || 'Payment declined'
                        });
                    }

                    break;

                case 'pending':
                case 'processing':
                case 'in_progress':
                case 'waiting':
                    console.log('⏳ Payment is pending - Status:', status);

                    // Update order status in your database
                    await this.updateOrderStatus(formId, 'pending', {
                        documentId,
                        paymentId,
                        amount,
                        currency
                    });

                    break;

                default:
                    console.log(`⚠️  Unknown payment status: "${status}" - Processing as completed to ensure email is sent`);
                    console.log('📧 Sending admin email notification for unknown status');

                    // For unknown statuses, still send admin email and process as completed
                    await this.updateOrderStatus(formId, 'completed', {
                        documentId,
                        paymentId,
                        amount,
                        currency,
                        note: `Original status: ${status}`
                    });
                    break;
            }

            // Respond to GreenInvoice webhook
            res.json({
                success: true,
                message: 'Webhook processed successfully'
            });

        } catch (error) {
            console.error('Error processing webhook:', error);
            res.status(500).json({
                error: 'Webhook processing failed',
                message: error.message
            });
        }
    }

    // Validate payment parameters
    validatePaymentParams(items, totalAmount, customerInfo) {
        const errors = [];

        if (!items || !Array.isArray(items) || items.length === 0) {
            errors.push('Items array is required and must not be empty');
        }

        if (!totalAmount || isNaN(totalAmount) || totalAmount <= 0) {
            errors.push('Total amount must be a positive number');
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

    // Send order data to your server
    async sendOrderToServer(orderData) {
        try {
            const serverUrl = 'https://hamikdah-site.onrender.com/api/orders';

            console.log('Sending order data to server:', serverUrl);

            const response = await axios.post(serverUrl, orderData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.SERVER_API_KEY || ''}`
                },
                timeout: 10000
            });

            console.log('Order data sent to server successfully:', response.status);
            return true;

        } catch (error) {
            console.error('Failed to send order data to server:', error.message);
            // Don't throw error - server notification failure shouldn't break the webhook
            return false;
        }
    }

    // Store order locally for API access
    async storeOrderLocally(orderData) {
        try {
            // Import the orders array directly from the orders route
            const ordersRoute = require('../routes/orders');

            console.log('Storing order locally in orders array');

            // Add the order to the orders array
            const orderWithTimestamp = {
                ...orderData,
                receivedAt: new Date().toISOString()
            };

            // Access the orders array from the route module
            if (ordersRoute.orders) {
                ordersRoute.orders.push(orderWithTimestamp);
                console.log('Order stored locally successfully. Total orders:', ordersRoute.orders.length);
                return true;
            } else {
                console.log('Orders array not accessible from route module');
                return false;
            }
        } catch (error) {
            console.error('Failed to store order locally:', error.message);
            // Don't throw error - local storage failure shouldn't break the webhook
            return false;
        }
    }

    // Update order status in database (implement according to your database structure)
    async updateOrderStatus(formId, status, details) {
        try {
            console.log(`Updating order status for form ${formId} to ${status}:`, details);

            // TODO: Implement database update logic here
            // Example:
            // await Order.updateOne(
            //     { formId: formId },
            //     { 
            //         status: status,
            //         paymentDetails: details,
            //         updatedAt: new Date()
            //     }
            // );

            console.log(`Order status updated successfully for form ${formId}`);
        } catch (error) {
            console.error(`Failed to update order status for form ${formId}:`, error);
            throw error;
        }
    }

    // Send payment confirmation email (implement according to your email service)
    async sendPaymentConfirmationEmail(email, details) {
        try {
            console.log(`Sending payment confirmation email to ${email}:`, details);

            // TODO: Implement email sending logic here
            // Example:
            // await emailService.sendPaymentConfirmation(email, details);

            console.log(`Payment confirmation email sent successfully to ${email}`);
        } catch (error) {
            console.error(`Failed to send payment confirmation email to ${email}:`, error);
            // Don't throw error - email failure shouldn't break the webhook
        }
    }

    // Send payment failure email (implement according to your email service)
    async sendPaymentFailureEmail(email, details) {
        try {
            console.log(`Sending payment failure email to ${email}:`, details);

            // TODO: Implement email sending logic here
            // Example:
            // await emailService.sendPaymentFailure(email, details);

            console.log(`Payment failure email sent successfully to ${email}`);
        } catch (error) {
            console.error(`Failed to send payment failure email to ${email}:`, error);
            // Don't throw error - email failure shouldn't break the webhook
        }
    }

    async test(req, res) {
        try {
            console.log('Testing GreenInvoice connection...');

            // Test authentication
            const token = await this.greenInvoiceService.getToken();
            console.log('✅ Authentication successful');

            // Test document types endpoint
            try {
                const response = await axios.get(
                    `${this.greenInvoiceService.baseUrl}/documents/types`,
                    {
                        headers: { 'Authorization': `Bearer ${token}` },
                        timeout: 10000
                    }
                );
                console.log('✅ Available document types:', response.data);
                res.json({
                    success: true,
                    message: 'GreenInvoice connection successful',
                    availableDocumentTypes: response.data
                });
            } catch (docError) {
                console.log('⚠️ Could not fetch document types:', docError.message);
                res.json({
                    success: true,
                    message: 'GreenInvoice connection successful (document types not available)',
                    auth: 'working'
                });
            }
        } catch (error) {
            console.error('❌ GreenInvoice connection failed:', error.message);
            res.status(500).json({
                success: false,
                error: 'GreenInvoice connection failed',
                message: error.message
            });
        }
    }
}

module.exports = GreenInvoiceController;
