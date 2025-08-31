import { API_ENDPOINTS } from '../config';

export const createGreenInvoiceWithPayment = async (items, totalAmount, customerInfo, cardInfo = null) => {
    try {
        const requestBody = {
            items,
            totalAmount,
            currency: 'ILS',
            customerInfo
        };

        // Add credit card info if provided
        if (cardInfo) {
            requestBody.cardInfo = cardInfo;
        }

        const response = await fetch(`${API_ENDPOINTS.greenInvoice}/create-invoice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error('Invoice creation failed');
        }

        return await response.json();
    } catch (error) {
        console.error('GreenInvoice invoice creation error:', error);
        throw error;
    }
};

export const getInvoiceStatus = async (invoiceId) => {
    try {
        const response = await fetch(`${API_ENDPOINTS.greenInvoice}/status/${invoiceId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Invoice status check failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Invoice status check error:', error);
        throw error;
    }
};

export const createCustomer = async (customerData) => {
    try {
        const response = await fetch(`${API_ENDPOINTS.greenInvoice}/customer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(customerData),
        });

        if (!response.ok) {
            throw new Error('Customer creation failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Customer creation error:', error);
        throw error;
    }
};

export const getPaymentForm = async (items, totalAmount, customerInfo) => {
    try {
        const response = await fetch(`${API_ENDPOINTS.greenInvoice}/payment-form`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items,
                totalAmount,
                currency: 'ILS',
                customerInfo
            }),
        });

        if (!response.ok) {
            throw new Error('Payment form creation failed');
        }

        return await response.json();
    } catch (error) {
        console.error('GreenInvoice payment form error:', error);
        throw error;
    }
};
