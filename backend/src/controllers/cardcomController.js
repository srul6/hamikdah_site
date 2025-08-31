const axios = require('axios');
const crypto = require('crypto');

class CardcomController {
    constructor() {
        this.terminalNumber = process.env.CARDCOM_TERMINAL_NUMBER;
        this.userName = process.env.CARDCOM_USERNAME;
        this.password = process.env.CARDCOM_PASSWORD;
        this.baseUrl = process.env.NODE_ENV === 'production'
            ? 'https://secure.cardcom.co.il/Interface/LowProfile.aspx'
            : 'https://secure.cardcom.co.il/Interface/LowProfile.aspx'; // Test URL

        // Debug logging
        console.log('Cardcom Controller initialized with:', {
            terminalNumber: this.terminalNumber,
            userName: this.userName,
            password: this.password ? '***' : 'missing',
            baseUrl: this.baseUrl
        });
    }

    // Generate Cardcom signature
    generateSignature(params) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');

        return crypto.createHash('md5').update(sortedParams).digest('hex');
    }

    // Create payment transaction
    async createPayment(req, res) {
        console.log('=== Cardcom createPayment called ===');
        console.log('Request body:', req.body);
        console.log('Environment variables:', {
            FRONTEND_URL: process.env.FRONTEND_URL,
            BACKEND_URL: process.env.BACKEND_URL,
            NODE_ENV: process.env.NODE_ENV
        });
        try {
            const { items, totalAmount, currency = 'ILS', customerInfo } = req.body;

            // Check if Cardcom credentials are available
            if (!this.terminalNumber || !this.userName || !this.password) {
                console.error('Cardcom credentials not found:', {
                    terminalNumber: this.terminalNumber,
                    userName: this.userName,
                    password: this.password ? '***' : 'missing'
                });
                return res.status(500).json({
                    success: false,
                    error: 'Cardcom configuration missing',
                    message: 'Payment service is not properly configured'
                });
            }

            // Generate unique transaction ID
            const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Prepare Cardcom parameters
            const cardcomParams = {
                TerminalNumber: this.terminalNumber,
                UserName: this.userName,
                SumToBill: totalAmount.toFixed(2),
                CoinID: currency === 'ILS' ? '1' : '2', // 1=ILS, 2=USD
                Language: 'he', // Hebrew
                ProductName: items.map(item => {
                    // Debug: Log the item to see what fields it has
                    console.log('Item in payment:', item);
                    return item.name_he || item.name_en || item.name || 'Product';
                }).join(', '),
                SuccessRedirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`,
                ErrorRedirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/error`,
                CancelRedirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart`,
                IndicatorUrl: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/cardcom/callback`,
                TransactionId: transactionId,
                CustomerName: customerInfo?.name || '',
                CustomerEmail: customerInfo?.email || '',
                CustomerPhone: customerInfo?.phone || '',
                CustomerAddress: customerInfo?.address || '',
                MaxNumOfPayments: '1', // Single payment
                MinNumOfPayments: '1',
                NumOfPayments: '1'
            };

            // Generate signature
            cardcomParams.Signature = this.generateSignature(cardcomParams);

            // Debug: Log parameters being sent to Cardcom
            console.log('Params sent to Cardcom:', cardcomParams);

            // Create payment URL
            const paymentUrl = `${this.baseUrl}?${new URLSearchParams(cardcomParams).toString()}`;

            res.json({
                success: true,
                paymentUrl,
                transactionId,
                message: 'Payment URL generated successfully'
            });

        } catch (error) {
            console.error('Cardcom payment creation failed:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({
                success: false,
                error: 'Payment creation failed',
                message: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    // Handle Cardcom callback
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

            // Handle different response codes
            if (ResponseCode === '0') {
                // Payment successful
                console.log('Payment successful:', TransactionId);
                // Here you can update your database, send confirmation emails, etc.
            } else {
                // Payment failed
                console.log('Payment failed:', ResponseText);
            }

            // Respond to Cardcom
            res.send('OK');

        } catch (error) {
            console.error('Cardcom callback processing failed:', error);
            res.status(500).send('Callback processing failed');
        }
    }

    // Get payment status
    async getPaymentStatus(req, res) {
        try {
            const { transactionId } = req.params;

            // Query Cardcom for transaction status
            const statusParams = {
                TerminalNumber: this.terminalNumber,
                UserName: this.userName,
                TransactionId: transactionId
            };

            statusParams.Signature = this.generateSignature(statusParams);

            const response = await axios.post(
                'https://secure.cardcom.co.il/Interface/QueryTransaction.aspx',
                statusParams
            );

            res.json({
                success: true,
                status: response.data
            });

        } catch (error) {
            console.error('Payment status check failed:', error);
            res.status(500).json({
                success: false,
                error: 'Status check failed'
            });
        }
    }
}

module.exports = CardcomController; 