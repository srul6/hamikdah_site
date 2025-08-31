const axios = require('axios');

class GreenInvoiceService {
    constructor() {
        this.apiKeyId = process.env.GREENINVOICE_API_KEY_ID;
        this.apiKeySecret = process.env.GREENINVOICE_API_KEY_SECRET;
        this.baseUrl = 'https://api.greeninvoice.co.il/api/v1';
        this.jwtToken = null;
        this.tokenExpiry = null;

        console.log('GreenInvoice Service initialized with:', {
            apiKeyId: this.apiKeyId ? '***' : 'missing',
            apiKeySecret: this.apiKeySecret ? '***' : 'missing',
            baseUrl: this.baseUrl
        });
    }

    // Authenticate and get JWT token
    async authenticate() {
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
            if (error.response) {
                console.error('GreenInvoice API error response:', {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers
                });
            }
            throw error;
        }
    }

    // Get token (alias for authenticate)
    async getToken() {
        return this.authenticate();
    }

    // Create invoice with proper format
    async createInvoice(invoiceData) {
        try {
            // Ensure we have a valid token
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

            console.log('GreenInvoice API response:', response.data);
            return response.data;

        } catch (error) {
            console.error('GreenInvoice invoice creation failed:', error);
            
            // Log detailed error information
            if (error.response) {
                console.error('GreenInvoice API error response:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                });
            } else if (error.request) {
                console.error('GreenInvoice API request error:', error.request);
            } else {
                console.error('GreenInvoice API error:', error.message);
            }

            throw error;
        }
    }

    // Get invoice status
    async getInvoiceStatus(invoiceId) {
        try {
            const token = await this.getToken();

            const response = await axios.get(
                `${this.baseUrl}/documents/${invoiceId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 10000
                }
            );

            return response.data;

        } catch (error) {
            console.error('Failed to get invoice status:', error);
            throw error;
        }
    }

    // Create customer
    async createCustomer(customerData) {
        try {
            const token = await this.getToken();

            const response = await axios.post(
                `${this.baseUrl}/clients`,
                customerData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            return response.data;

        } catch (error) {
            console.error('Failed to create customer:', error);
            throw error;
        }
    }
}

module.exports = GreenInvoiceService;
