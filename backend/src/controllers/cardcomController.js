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
        try {
            const { items, totalAmount, currency = 'ILS', customerInfo } = req.body;

            // Generate unique transaction ID
            const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Prepare Cardcom parameters
            const cardcomParams = {
                TerminalNumber: this.terminalNumber,
                UserName: this.userName,
                SumToBill: totalAmount.toFixed(2),
                CoinID: currency === 'ILS' ? '1' : '2', // 1=ILS, 2=USD
                Language: 'he', // Hebrew
                ProductName: items.map(item => item.name_he || item.name_en || item.name).join(', '),
                SuccessRedirectUrl: `${process.env.FRONTEND_URL}/payment/success`,
                ErrorRedirectUrl: `${process.env.FRONTEND_URL}/payment/error`,
                CancelRedirectUrl: `${process.env.FRONTEND_URL}/cart`,
                IndicatorUrl: `${process.env.BACKEND_URL}/api/cardcom/callback`,
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
            res.status(500).json({
                success: false,
                error: 'Payment creation failed',
                message: error.message
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

module.exports = new CardcomController(); 