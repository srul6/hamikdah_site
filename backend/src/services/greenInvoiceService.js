const axios = require('axios');

class GreenInvoiceService {
    constructor() {
        this.apiKeyId = process.env.GREENINVOICE_API_KEY_ID;
        this.apiKeySecret = process.env.GREENINVOICE_API_KEY_SECRET;
        this.baseUrl = process.env.GREENINVOICE_BASE_URL || 'https://api.greeninvoice.co.il/api/v1';
        this.token = null;
        this.tokenExpiry = null;
    }

    async getToken() {
        // Check if we have a valid token
        if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.token;
        }

        try {
            const response = await axios.post(`${this.baseUrl}/account/token`, {
                id: this.apiKeyId,
                secret: this.apiKeySecret
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            // Extract token from response headers (GreenInvoice specific)
            const token = response.headers['x-authorization-bearer'] || response.data.token;

            if (!token) {
                throw new Error('No token received from GreenInvoice');
            }

            // Set token expiry (GreenInvoice tokens expire in 1 hour)
            this.token = token;
            this.tokenExpiry = Date.now() + (55 * 60 * 1000); // 55 minutes to be safe

            console.log('JWT token obtained successfully, expires:', new Date(this.tokenExpiry));
            return token;

        } catch (error) {
            console.error('Failed to get GreenInvoice token:', error);
            if (error.response) {
                console.error('GreenInvoice token error response:', {
                    status: error.response.status,
                    data: error.response.data
                });
            }
            throw new Error('Failed to authenticate with GreenInvoice');
        }
    }

    async createInvoice(invoiceData) {
        try {
            const token = await this.getToken();
            console.log('Creating invoice with data:', invoiceData);

            const response = await axios.post(
                `${this.baseUrl}/documents`,
                invoiceData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 30000
                }
            );

            console.log('GreenInvoice invoice creation response:', response.data);
            return response.data;
        } catch (error) {
            console.error('GreenInvoice invoice creation failed:', error);

            // Enhanced error handling to capture full GreenInvoice error details
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                const errorDetails = {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                };

                console.error('GreenInvoice API error response:', errorDetails);

                // Create a custom error with full details
                const customError = new Error('GreenInvoice API Error');
                customError.isAxiosError = true;
                customError.response = errorDetails;
                customError.greenInvoiceError = error.response.data;

                throw customError;
            } else if (error.request) {
                // The request was made but no response was received
                console.error('GreenInvoice API request error:', error.request);
                const customError = new Error('No response received from GreenInvoice API');
                customError.isAxiosError = true;
                customError.request = error.request;
                throw customError;
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('GreenInvoice API error:', error.message);
                const customError = new Error(`GreenInvoice API Error: ${error.message}`);
                customError.isAxiosError = true;
                customError.originalError = error;
                throw customError;
            }
        }
    }

    async getPaymentForm(paymentData) {
        try {
            const token = await this.getToken();
            console.log('Getting payment form with data:', paymentData);

            const response = await axios.post(
                `${this.baseUrl}/payments/form`,
                paymentData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 30000
                }
            );

            console.log('GreenInvoice payment form response:', response.data);
            return response.data;
        } catch (error) {
            console.error('GreenInvoice payment form creation failed:', error);

            // Enhanced error handling to capture full GreenInvoice error details
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                const errorDetails = {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                };

                console.error('GreenInvoice API error response:', errorDetails);

                // Create a custom error with full details
                const customError = new Error('GreenInvoice API Error');
                customError.isAxiosError = true;
                customError.response = errorDetails;
                customError.greenInvoiceError = error.response.data;

                throw customError;
            } else if (error.request) {
                // The request was made but no response was received
                console.error('GreenInvoice API request error:', error.request);
                const customError = new Error('No response received from GreenInvoice API');
                customError.isAxiosError = true;
                customError.request = error.request;
                throw customError;
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('GreenInvoice API error:', error.message);
                const customError = new Error(`GreenInvoice API Error: ${error.message}`);
                customError.isAxiosError = true;
                customError.originalError = error;
                throw customError;
            }
        }
    }

    async getDocument(documentId) {
        try {
            const token = await this.getToken();
            console.log('Getting document:', documentId);

            const response = await axios.get(
                `${this.baseUrl}/documents/${documentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 30000
                }
            );

            console.log('GreenInvoice document response:', response.data);
            return response.data;
        } catch (error) {
            console.error('GreenInvoice document retrieval failed:', error);

            // Enhanced error handling to capture full GreenInvoice error details
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                const errorDetails = {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                };

                console.error('GreenInvoice API error response:', errorDetails);

                // Create a custom error with full details
                const customError = new Error('GreenInvoice API Error');
                customError.isAxiosError = true;
                customError.response = errorDetails;
                customError.greenInvoiceError = error.response.data;

                throw customError;
            } else if (error.request) {
                // The request was made but no response was received
                console.error('GreenInvoice API request error:', error.request);
                const customError = new Error('No response received from GreenInvoice API');
                customError.isAxiosError = true;
                customError.request = error.request;
                throw customError;
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('GreenInvoice API error:', error.message);
                const customError = new Error(`GreenInvoice API Error: ${error.message}`);
                customError.isAxiosError = true;
                customError.originalError = error;
                throw customError;
            }
        }
    }
}

module.exports = GreenInvoiceService;
