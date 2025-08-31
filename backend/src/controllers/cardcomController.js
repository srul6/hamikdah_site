const axios = require('axios');
const crypto = require('crypto');

class CardcomController {
    constructor() {
        this.terminalNumber = process.env.CARDCOM_TERMINAL_NUMBER;
        this.apiName = process.env.CARDCOM_API_NAME;
        this.apiPassword = process.env.CARDCOM_API_PASSWORD;
        this.cardcomUrl = 'https://secure.cardcom.solutions';

        // Debug logging (only in development)
        if (process.env.NODE_ENV === 'development') {
            console.log('Cardcom Controller initialized with:', {
                terminalNumber: this.terminalNumber,
                apiName: this.apiName,
                apiPassword: this.apiPassword ? '***' : 'missing',
                cardcomUrl: this.cardcomUrl
            });
        }
    }

    // Create LowProfile deal according to official Cardcom API
    async createLowProfile(req, res) {
        if (process.env.NODE_ENV === 'development') {
            console.log('=== Cardcom createLowProfile called ===');
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
            if (!this.terminalNumber || !this.apiName || !this.apiPassword) {
                console.error('Cardcom credentials not found');
                return res.status(500).json({
                    success: false,
                    error: 'Cardcom configuration missing',
                    message: 'Payment service is not properly configured'
                });
            }

            // Generate unique return value (order ID)
            const returnValue = `ORDER_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

            // Prepare Cardcom LowProfile request according to official API spec
            const lowProfileRequest = {
                TerminalNumber: parseInt(this.terminalNumber),
                ApiName: this.apiName,
                ApiPassword: this.apiPassword,
                Operation: "ChargeOnly", // Default operation
                ReturnValue: returnValue,
                Amount: parseFloat(totalAmount),
                SuccessRedirectUrl: `${process.env.FRONTEND_URL}/payment/success`,
                FailedRedirectUrl: `${process.env.FRONTEND_URL}/payment/error`,
                CancelRedirectUrl: `${process.env.FRONTEND_URL}/cart`,
                WebHookUrl: `${process.env.BACKEND_URL}/api/cardcom/callback`,
                ProductName: items.map(item => {
                    const itemName = item.name_he || item.name_en || item.name || 'Product';
                    return itemName;
                }).join(', '),
                Language: 'he', // Hebrew
                ISOCoinId: currency === 'ILS' ? 1 : 2, // 1=ILS, 2=USD
                Document: {
                    Name: customerInfo.name,
                    Email: customerInfo.email,
                    AddressLine1: customerInfo.address || '',
                    Mobile: customerInfo.phone,
                    IsSendByEmail: false,
                    IsAllowEditDocument: false,
                    IsShowOnlyDocument: true,
                    Language: 'he',
                    DocumentTypeToCreate: "Receipt",
                    Products: items.map(item => ({
                        Description: item.name_he || item.name_en || item.name || 'Product',
                        Quantity: item.quantity || 1,
                        UnitCost: parseFloat(item.price),
                        TotalLineCost: parseFloat((item.price * (item.quantity || 1)).toFixed(2)),
                        IsVatFree: false
                    }))
                }
            };

            // Debug logging (only in development)
            if (process.env.NODE_ENV === 'development') {
                console.log('LowProfile request:', {
                    ...lowProfileRequest,
                    ApiPassword: '***' // Hide password in logs
                });
            }

            // Create LowProfile deal with Cardcom using official API
            const response = await axios.post(
                `${this.cardcomUrl}/api/v11/LowProfile/Create`,
                lowProfileRequest,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30 second timeout
                }
            );

            const result = response.data;

            if (result.ResponseCode === 0 && result.LowProfileId) {
                res.json({
                    success: true,
                    lowProfileId: result.LowProfileId,
                    url: result.Url,
                    returnValue: returnValue,
                    message: 'LowProfile deal created successfully'
                });
            } else {
                console.error('Cardcom LowProfile creation failed:', result);
                res.status(500).json({
                    success: false,
                    error: 'LowProfile creation failed',
                    message: result.Description || 'Unknown error',
                    responseCode: result.ResponseCode
                });
            }

        } catch (error) {
            console.error('Cardcom LowProfile creation failed:', error);
            res.status(500).json({
                success: false,
                error: 'LowProfile creation failed',
                message: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
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

    // Handle Cardcom callback according to official API spec
    async handleCallback(req, res) {
        try {
            const callbackData = req.body;

            // Log the callback data
            console.log('Cardcom callback received:', callbackData);

            // Process the callback according to official API spec
            const {
                ResponseCode,
                Description,
                LowProfileId,
                ApprovalNumber,
                CardType,
                CardSuffix,
                Amount,
                PaymentSum,
                PaymentCurrency,
                ReturnValue,
                DealNumber,
                IsSuccess,
                TransactionId
            } = callbackData;

            // Handle different response codes according to official API
            if (ResponseCode === 0 && IsSuccess) {
                // Payment successful
                console.log('Payment successful:', {
                    LowProfileId,
                    DealNumber,
                    ApprovalNumber,
                    Amount,
                    ReturnValue,
                    TransactionId
                });

                // Here you can update your database, send confirmation emails, etc.
                // You should save the transaction details to your database

            } else {
                // Payment failed
                console.log('Payment failed:', {
                    ResponseCode,
                    Description,
                    LowProfileId,
                    ReturnValue
                });
            }

            // Respond to Cardcom with OK (required by API)
            res.send('OK');

        } catch (error) {
            console.error('Cardcom callback processing failed:', error);
            res.status(500).send('Callback processing failed');
        }
    }

    // Get payment status according to official API spec
    async getPaymentStatus(req, res) {
        try {
            const { lowProfileId } = req.params;

            if (!lowProfileId) {
                return res.status(400).json({
                    success: false,
                    error: 'LowProfile ID is required'
                });
            }

            // Query Cardcom for transaction status using official API
            const statusRequest = {
                TerminalNumber: parseInt(this.terminalNumber),
                ApiName: this.apiName,
                ApiPassword: this.apiPassword,
                LowProfileId: lowProfileId
            };

            const response = await axios.post(
                `${this.cardcomUrl}/api/v11/LowProfile/GetLpResult`,
                statusRequest,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            const result = response.data;

            if (result.ResponseCode === 0) {
                res.json({
                    success: true,
                    status: result
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Status check failed',
                    message: result.Description,
                    responseCode: result.ResponseCode
                });
            }

        } catch (error) {
            console.error('Payment status check failed:', error);
            res.status(500).json({
                success: false,
                error: 'Status check failed',
                message: error.message
            });
        }
    }

    // Process transaction directly (alternative to LowProfile)
    async processTransaction(req, res) {
        try {
            const { cardNumber, cvv, expirationMonth, expirationYear, amount, customerInfo } = req.body;

            // Validate input
            if (!cardNumber || !cvv || !expirationMonth || !expirationYear || !amount || !customerInfo) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters'
                });
            }

            // Prepare transaction request according to official API spec
            const transactionRequest = {
                TerminalNumber: parseInt(this.terminalNumber),
                ApiName: this.apiName,
                ApiPassword: this.apiPassword,
                CardNumber: cardNumber,
                Cvv: cvv,
                ExpirationMonth: expirationMonth,
                ExpirationYear: expirationYear,
                Amount: parseFloat(amount),
                Currency: 1, // ILS
                ExternalUniqTranId: `TXN_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
                CardOwnerName: customerInfo.name,
                CardOwnerEmail: customerInfo.email,
                CardOwnerPhone: customerInfo.phone,
                CardOwnerId: customerInfo.id || '000000000'
            };

            const response = await axios.post(
                `${this.cardcomUrl}/api/v11/Transactions/Transaction`,
                transactionRequest,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            const result = response.data;

            if (result.ResponseCode === 0) {
                res.json({
                    success: true,
                    transactionId: result.TransactionId,
                    approvalNumber: result.ApprovalNumber,
                    message: 'Transaction processed successfully'
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Transaction failed',
                    message: result.Description,
                    responseCode: result.ResponseCode
                });
            }

        } catch (error) {
            console.error('Transaction processing failed:', error);
            res.status(500).json({
                success: false,
                error: 'Transaction processing failed',
                message: error.message
            });
        }
    }
}

module.exports = CardcomController; 