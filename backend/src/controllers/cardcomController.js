const axios = require('axios');
const crypto = require('crypto');

class CardcomController {
    constructor() {
        this.terminalNumber = process.env.CARDCOM_TERMINAL_NUMBER;
        this.userName = process.env.CARDCOM_USERNAME;
        this.password = process.env.CARDCOM_PASSWORD;
        this.baseUrl = 'https://secure.cardcom.co.il/Interface/LowProfile.aspx';

        // Debug logging (only in development)
        if (process.env.NODE_ENV === 'development') {
            console.log('Cardcom Controller initialized with:', {
                terminalNumber: this.terminalNumber,
                userName: this.userName,
                password: this.password ? '***' : 'missing',
                baseUrl: this.baseUrl
            });
        }
    }

    // Generate Cardcom signature with ALL parameters including credentials
    generateSignature(params) {
        // Include credentials in signature calculation as required by Cardcom
        const allParams = {
            ...params,
            TerminalNumber: this.terminalNumber,
            UserName: this.userName,
            Password: this.password
        };

        // Sort parameters alphabetically and create signature string
        const sortedParams = Object.keys(allParams)
            .sort()
            .map(key => `${key}=${allParams[key]}`)
            .join('&');

        return crypto.createHash('md5').update(sortedParams).digest('hex');
    }

    // Validate required parameters
    validatePaymentParams(items, totalAmount, customerInfo) {
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

    // Create payment transaction
    async createPayment(req, res) {
        if (process.env.NODE_ENV === 'development') {
            console.log('=== Cardcom createPayment called ===');
            console.log('Request body:', req.body);
        }

        try {
            const { items, totalAmount, currency = 'ILS', customerInfo } = req.body;

            // Validate input parameters
            const validationErrors = this.validatePaymentParams(items, totalAmount, customerInfo);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    message: validationErrors.join(', ')
                });
            }

            // Check if Cardcom credentials are available
            if (!this.terminalNumber || !this.userName || !this.password) {
                console.error('Cardcom credentials not found');
                return res.status(500).json({
                    success: false,
                    error: 'Cardcom configuration missing',
                    message: 'Payment service is not properly configured'
                });
            }

            // Generate unique transaction ID with better randomness
            const transactionId = `TXN_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

            // Prepare Cardcom parameters with ALL required fields
            const cardcomParams = {
                TerminalNumber: this.terminalNumber,
                UserName: this.userName,
                SumToBill: totalAmount.toFixed(2),
                CoinID: currency === 'ILS' ? '1' : '2', // 1=ILS, 2=USD
                Language: 'he', // Hebrew
                Operation: '1', // Payment operation
                IsIframe: 'false', // Not in iframe
                IsMobile: 'false', // Desktop mode
                ProductName: items.map(item => {
                    const itemName = item.name_he || item.name_en || item.name || 'Product';
                    // Ensure Hebrew text is properly encoded
                    return encodeURIComponent(itemName);
                }).join(', '),
                SuccessRedirectUrl: `${process.env.FRONTEND_URL}/payment/success`,
                ErrorRedirectUrl: `${process.env.FRONTEND_URL}/payment/error`,
                CancelRedirectUrl: `${process.env.FRONTEND_URL}/cart`,
                IndicatorUrl: `${process.env.BACKEND_URL}/api/cardcom/callback`,
                TransactionId: transactionId,
                CustomerName: customerInfo.name.trim(),
                CustomerEmail: customerInfo.email.trim(),
                CustomerPhone: customerInfo.phone.trim(),
                CustomerAddress: customerInfo.address ? customerInfo.address.trim() : '',
                MaxNumOfPayments: '1', // Single payment
                MinNumOfPayments: '1',
                NumOfPayments: '1'
            };

            // Generate signature AFTER all parameters are set
            cardcomParams.Signature = this.generateSignature(cardcomParams);

            // Debug logging (only in development)
            if (process.env.NODE_ENV === 'development') {
                console.log('Params sent to Cardcom:', {
                    ...cardcomParams,
                    Password: '***' // Hide password in logs
                });
            }

            // Create payment URL with proper encoding
            const queryString = Object.keys(cardcomParams)
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(cardcomParams[key])}`)
                .join('&');

            const paymentUrl = `${this.baseUrl}?${queryString}`;

            res.json({
                success: true,
                paymentUrl,
                transactionId,
                message: 'Payment URL generated successfully'
            });

        } catch (error) {
            console.error('Cardcom payment creation failed:', error);
            res.status(500).json({
                success: false,
                error: 'Payment creation failed',
                message: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    // Handle Cardcom callback with proper response code handling
    async handleCallback(req, res) {
        try {
            const callbackData = req.body;

            // Verify callback signature
            const receivedSignature = callbackData.Signature;
            delete callbackData.Signature;
            const calculatedSignature = this.generateSignature(callbackData);

            if (receivedSignature !== calculatedSignature) {
                console.error('Cardcom callback signature verification failed');
                return res.status(400).send('Signature verification failed');
            }

            // Process the callback
            const {
                ResponseCode,
                ResponseText,
                TransactionId,
                ApprovalNumber,
                CardType,
                CardSuffix,
                SumToBill,
                PaymentSum,
                PaymentCurrency
            } = callbackData;

            // Log the callback data
            console.log('Cardcom callback received:', {
                ResponseCode,
                ResponseText,
                TransactionId,
                ApprovalNumber,
                CardType,
                CardSuffix,
                SumToBill,
                PaymentSum,
                PaymentCurrency
            });

            // Handle different response codes properly
            switch (ResponseCode) {
                case '0':
                case '1':
                    // Payment successful
                    console.log('Payment successful:', TransactionId);
                    // Here you can update your database, send confirmation emails, etc.
                    break;
                case '2':
                    // Transaction declined
                    console.log('Payment declined:', ResponseText);
                    break;
                case '3':
                    // Transaction error
                    console.log('Payment error:', ResponseText);
                    break;
                case '4':
                    // Transaction timeout
                    console.log('Payment timeout:', ResponseText);
                    break;
                default:
                    // Unknown response code
                    console.log('Unknown response code:', ResponseCode, ResponseText);
            }

            // Respond to Cardcom with OK
            res.send('OK');

        } catch (error) {
            console.error('Cardcom callback processing failed:', error);
            res.status(500).send('Callback processing failed');
        }
    }

    // Get payment status with proper error handling
    async getPaymentStatus(req, res) {
        try {
            const { transactionId } = req.params;

            if (!transactionId) {
                return res.status(400).json({
                    success: false,
                    error: 'Transaction ID is required'
                });
            }

            // Query Cardcom for transaction status
            const statusParams = {
                TerminalNumber: this.terminalNumber,
                UserName: this.userName,
                TransactionId: transactionId
            };

            statusParams.Signature = this.generateSignature(statusParams);

            const response = await axios.post(
                'https://secure.cardcom.co.il/Interface/QueryTransaction.aspx',
                statusParams,
                {
                    timeout: 10000, // 10 second timeout
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            res.json({
                success: true,
                status: response.data
            });

        } catch (error) {
            console.error('Payment status check failed:', error);
            res.status(500).json({
                success: false,
                error: 'Status check failed',
                message: error.message
            });
        }
    }
}

module.exports = CardcomController; 