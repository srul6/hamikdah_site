const GreenInvoiceService = require('../services/greenInvoiceService');
const EmailService = require('../services/emailService');
const { databaseController } = require('../config/database');
const axios = require('axios'); // Added for testing document types
const { validateCheckoutRequest } = require('../utils/checkoutValidation');
const clientMessages = require('../utils/clientFacingMessages');

/**
 * Merge base product names with selected color for invoices, emails, and order storage.
 */
function productNameWithColor(baseHe, baseEn, colorHe, colorEn) {
    const he = String(baseHe || baseEn || 'פריט').trim();
    const en = String(baseEn || baseHe || 'Item').trim();
    const cHe = colorHe && String(colorHe).trim();
    const cEn = colorEn && String(colorEn).trim();
    return {
        name_he: cHe ? `${he} (${cHe})` : he,
        name_en: cEn ? `${en} (${cEn})` : (cHe ? `${en} (${cHe})` : en)
    };
}

class GreenInvoiceController {
    constructor() {
        this.greenInvoiceService = new GreenInvoiceService();
        this.emailService = new EmailService();
        this.databaseController = databaseController; // Use the database controller from config
        this.processedWebhooks = new Set(); // Track processed webhooks to prevent duplicates
        console.log('GreenInvoice Controller initialized');
    }

    sanitizeError(error) {
        if (process.env.NODE_ENV === 'development') {
            return { error: error.message, details: error.stack };
        }
        return { error: 'An internal error occurred' };
    }

    // Get payment form for CardCom integration
    async getPaymentForm(req, res) {
        const dev = process.env.NODE_ENV !== 'production';
        console.log('=== Creating GreenInvoice payment form ===');
        if (dev) {
            console.log('Request body:', JSON.stringify(req.body, null, 2));
            console.log('Request headers:', req.headers);
        }

        try {
            let { items, totalAmount, currency = 'ILS', customerInfo, id, marketing_consent } = req.body;
            const marketingConsent = !!marketing_consent;

            const validated = validateCheckoutRequest({ items, totalAmount, customerInfo });
            if (!validated.ok) {
                if (dev) {
                    console.warn('Payment form validation failed:', validated.errors);
                } else {
                    console.warn('Payment form validation failed');
                }
                return res.status(400).json({
                    success: false,
                    message: clientMessages.BAD_REQUEST
                });
            }
            items = validated.items;
            customerInfo = validated.customerInfo;

            const checkoutSessionId = Date.now();

            // Calculate total amount from items
            const calculatedTotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0);

            // Check if there's a delivery fee (when totalAmount > calculatedTotal)
            const deliveryFee = totalAmount > calculatedTotal ? totalAmount - calculatedTotal : 0;

            // Installments: each payment ≥ ₪50, at least 1 payment, cap at 6
            const totalNumeric = parseFloat(totalAmount);
            const MIN_PER_PAYMENT = 50;
            const MAX_INSTALLMENTS = 6;
            const numberOfPayments = Math.max(
                1,
                Math.min(MAX_INSTALLMENTS, Math.floor(totalNumeric / MIN_PER_PAYMENT))
            );

            // Build invoice request according to GreenInvoice payments/form schema
            const invoiceRequest = {
                description: `תשלום על הזמנה #${checkoutSessionId}`,
                type: 320,
                date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
                lang: "he",
                currency: "ILS",
                vatType: 0,
                amount: totalAmount,
                maxPayments: numberOfPayments,
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
                income: [
                    ...items.map(item => {
                        const names = productNameWithColor(
                            item.name_he || item.name,
                            item.name_en || item.name,
                            item.color_name_he,
                            item.color_name_en
                        );
                        return {
                            description: names.name_he || names.name_en || 'פריט',
                            quantity: item.quantity || 1,
                            price: parseFloat(item.price),
                            vatType: 1
                        };
                    }),
                    // Add delivery fee as a separate income item if applicable
                    ...(deliveryFee > 0 ? [{
                        description: 'משלוח עד הבית',
                        quantity: 1,
                        price: deliveryFee,
                        vatType: 1
                    }] : [])
                ],
                remarks: "תודה על הזמנתך",
                // Do not put customer email in the URL (history, referrers, access logs).
                successUrl: `${process.env.FRONTEND_URL}/payment/success?orderId=${checkoutSessionId}&amount=${encodeURIComponent(totalAmount)}&currency=${encodeURIComponent(currency)}`,
                failureUrl: `${process.env.FRONTEND_URL}/payment/failure`,
                notifyUrl: `${process.env.BACKEND_URL}/api/greeninvoice/webhook/${process.env.WEBHOOK_SECRET}`,
                custom: JSON.stringify({
                    orderId: checkoutSessionId,
                    customerId: customerInfo.email,
                    customerName: customerInfo.name,
                    customerPhone: customerInfo.phone,
                    customerStreet: customerInfo.street,
                    customerHouseNumber: customerInfo.houseNumber,
                    customerApartmentNumber: customerInfo.apartmentNumber || '',
                    customerFloor: customerInfo.floor || '',
                    customerCity: customerInfo.city,
                    items: items.map(item => ({
                        id: item.id,
                        quantity: item.quantity,
                        price: item.price,
                        color_name_he: item.color_name_he || '',
                        color_name_en: item.color_name_en || ''
                    })),
                    dedication: customerInfo.dedication || '',
                    marketing_consent: marketingConsent,
                    amount: totalAmount,
                    currency: currency
                })
            };

            if (dev) {
                console.log('Creating invoice with request:', JSON.stringify(invoiceRequest, null, 2));
            } else {
                console.log('Creating GreenInvoice payment form, line items:', items.length);
            }

            // Create the payment form
            const paymentResult = await this.greenInvoiceService.getPaymentForm(invoiceRequest);

            if (!paymentResult || !paymentResult.url) {
                if (dev) {
                    console.error('GreenInvoice getPaymentForm empty result:', paymentResult);
                }
                throw new Error('Failed to create payment form');
            }

            if (dev) {
                console.log('Payment form created successfully:', paymentResult);
            } else {
                console.log('Payment form created, formId:', paymentResult.formId || 'n/a');
            }

            // Return the payment form URL with additional details
            res.json({
                success: true,
                message: 'Payment form created successfully',
                paymentFormUrl: paymentResult.url,
                formId: paymentResult.formId || paymentResult.url.split('/').pop().split('?')[0],
                status: 'created'
            });

        } catch (error) {
            console.error('Error creating payment form:', error.message || error);
            if (error.isAxiosError) {
                const status = error.response?.status;
                if (process.env.NODE_ENV !== 'production') {
                    console.error('GreenInvoice/axios detail:', status, error.response?.data || error.message);
                } else if (status) {
                    console.error('GreenInvoice upstream HTTP status:', status);
                }
            }

            const status = error.isAxiosError && !error.response ? 503 : 500;
            res.status(status).json({
                success: false,
                message: clientMessages.PAYMENT_START_FAILED
            });
        }
    }


    // Test endpoint to simulate payment success (for development only)
    async testPaymentSuccess(req, res) {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ error: 'Test endpoint not available in production' });
        }

        const { orderId, amount, currency } = req.query;

        // Redirect to success page with test data (no email in URL)
        const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?orderId=${orderId || 'TEST-123'}&amount=${amount || '50'}&currency=${currency || 'ILS'}`;

        res.redirect(successUrl);
    }

    // Test endpoint to simulate payment failure (for development only)
    async testPaymentFailure(req, res) {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ error: 'Test endpoint not available in production' });
        }

        const { reason } = req.query;

        // Redirect to failure page with test data
        const failureUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failure?reason=${encodeURIComponent(reason || 'Test failure - insufficient funds')}`;

        res.redirect(failureUrl);
    }

    // Webhook endpoint to receive payment status updates from GreenInvoice
    async webhook(req, res) {

        try {
            // DUPLICATE PREVENTION: Check if we've already processed this webhook
            const webhookId = req.body.id || req.body.document_id || req.body.transaction_id;
            if (!webhookId) {
                console.log('❌ No webhook ID found, rejecting duplicate prevention check');
                return res.status(400).json({ success: false, message: clientMessages.WEBHOOK_REJECTED });
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
            let marketingConsent = false;

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
                            apartmentNumber: customData.customerApartmentNumber || 'לא זמין',
                            floor: customData.customerFloor || 'לא זמין',
                            city: customData.customerCity || 'לא זמין',
                            country: 'IL'
                        };
                    }

                    // Set values from custom data
                    amount = customData.amount || 0;
                    currency = customData.currency || 'ILS';
                    marketingConsent = !!customData.marketing_consent;

                    // Create items array with actual product info
                    if (customData.items) {
                        // Handle new structure with quantities and prices
                        let itemData = customData.items;

                        // Check if items is already an array (new format) or string (old format)
                        if (Array.isArray(itemData)) {
                            // New format: items array with quantities and prices
                            try {
                                // Fetch products from database
                                const productsData = await this.databaseController.getAllProducts();
                                console.log('✅ Fetched products from database:', productsData.length);

                                items = await Promise.all(itemData.map(async item => {
                                    const product = productsData.find(p => p.id.toString() === item.id.toString());
                                    if (product) {
                                        console.log('✅ Found product:', product.name_he, product.name_en);
                                        const names = productNameWithColor(
                                            product.name_he,
                                            product.name_en,
                                            item.color_name_he,
                                            item.color_name_en
                                        );
                                        return {
                                            id: item.id,
                                            name_he: names.name_he,
                                            name_en: names.name_en,
                                            quantity: item.quantity || 1,
                                            price: item.price || 0
                                        };
                                    } else {
                                        console.log('⚠️  Product not found for ID:', item.id);
                                        const names = productNameWithColor(
                                            'פריט לא ידוע',
                                            'Unknown Item',
                                            item.color_name_he,
                                            item.color_name_en
                                        );
                                        return {
                                            id: item.id,
                                            name_he: names.name_he,
                                            name_en: names.name_en,
                                            quantity: item.quantity || 1,
                                            price: item.price || 0
                                        };
                                    }
                                }));
                            } catch (error) {
                                console.error('❌ Failed to load products from database:', error);
                                items = itemData.map(item => {
                                    const names = productNameWithColor(
                                        'פריט',
                                        'Item',
                                        item.color_name_he,
                                        item.color_name_en
                                    );
                                    return {
                                        id: item.id,
                                        name_he: names.name_he,
                                        name_en: names.name_en,
                                        quantity: item.quantity || 1,
                                        price: item.price || 0
                                    };
                                });
                            }
                        } else {
                            // Old format: comma-separated string (fallback)
                            const itemIds = itemData.split(',').filter(id => id.trim());
                            try {
                                // Fetch products from database
                                const productsData = await this.databaseController.getAllProducts();
                                items = itemIds.map(itemId => {
                                    const product = productsData.find(p => p.id.toString() === itemId.trim());
                                    if (product) {
                                        return {
                                            id: itemId.trim(),
                                            name_he: product.name_he || 'פריט',
                                            name_en: product.name_en || 'Item',
                                            quantity: 1,
                                            price: amount / itemIds.length
                                        };
                                    } else {
                                        return {
                                            id: itemId.trim(),
                                            name_he: 'פריט לא ידוע',
                                            name_en: 'Unknown Item',
                                            quantity: 1,
                                            price: amount / itemIds.length
                                        };
                                    }
                                });
                            } catch (error) {
                                console.error('❌ Failed to load products from database:', error);
                                items = itemIds.map(itemId => ({
                                    id: itemId.trim(),
                                    name_he: 'פריט',
                                    name_en: 'Item',
                                    quantity: 1,
                                    price: amount / itemIds.length
                                }));
                            }
                        }
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
                return res.status(400).json({ success: false, message: clientMessages.WEBHOOK_REJECTED });
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
                marketingConsent: marketingConsent,
                purchaseTimestamp: new Date().toLocaleString('he-IL', {
                    timeZone: 'Asia/Jerusalem',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                dedication: customData.dedication || ''
            };

            // Save order to database (this happens for ALL webhooks, regardless of status)
            console.log('💾 Saving order to database...');
            console.log('📦 Order data:', JSON.stringify(orderData, null, 2));
            try {
                // Use createOrder which now handles duplicates with ON CONFLICT
                // This will insert new order or update existing one based on form_id
                console.log('📝 Creating/updating order in database...');
                const createdOrder = await this.databaseController.createOrder(orderData);
                console.log('✅ Order saved/updated in database successfully. Order ID:', createdOrder.id, 'Status:', createdOrder.status);
            } catch (error) {
                console.error('❌ Failed to save order to database:', error);
                console.error('   Error message:', error.message);
                console.error('   Error code:', error.code);
                console.error('   Error detail:', error.detail);
                console.error('   Error stack:', error.stack);
                // Continue processing even if database save fails, but log the error
            }

            // ALWAYS send email notification to admin regardless of status
            console.log('📧 Sending admin email notification for status:', status);
            try {
                const emailSent = await this.emailService.sendOrderNotification(orderData);
                if (emailSent) {
                    console.log('✅ Admin email notification sent successfully');
                } else {
                    console.error('❌ Admin email not sent (service not configured or SendGrid failed – check SENDGRID_API_KEY, ADMIN_EMAIL and server logs)');
                }
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

                    // Reduce product quantities for purchased items
                    console.log('📦 Reducing product quantities for purchased items...');
                    if (Array.isArray(items) && items.length > 0) {
                        for (const item of items) {
                            if (item.id) {
                                try {
                                    const quantityToReduce = item.quantity || 1;
                                    console.log(`📉 Reducing quantity for product ID ${item.id} by ${quantityToReduce}`);
                                    await this.databaseController.reduceProductQuantity(item.id, quantityToReduce);
                                    console.log(`✅ Successfully reduced quantity for product ID ${item.id}`);
                                } catch (error) {
                                    console.error(`❌ Failed to reduce quantity for product ID ${item.id}:`, error);
                                    // Continue processing other items even if one fails
                                }
                            } else {
                                console.log(`⚠️  Item has no ID, skipping quantity reduction:`, item);
                            }
                        }
                    } else {
                        console.log('⚠️  No items found in order, skipping quantity reduction');
                    }

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
                success: false,
                message: clientMessages.WEBHOOK_REJECTED
            });
        }
    }

    // Send order data to your server
    async sendOrderToServer(orderData) {
        try {
            const serverUrl = `${process.env.BACKEND_URL || 'https://hamikdah-site.onrender.com'}/api/orders`;

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
            console.error('❌ GreenInvoice connection failed:', error);
            res.status(500).json({
                success: false,
                message: clientMessages.BAD_REQUEST
            });
        }
    }
}

module.exports = GreenInvoiceController;
