import { API_ENDPOINTS } from '../config';

// Get payment form from GreenInvoice for CardCom integration
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
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create payment form');
        }

        return await response.json();
    } catch (error) {
        console.error('GreenInvoice payment form error:', error);
        throw error;
    }
};

// Test GreenInvoice connection
export const testGreenInvoiceConnection = async () => {
    try {
        const response = await fetch(`${API_ENDPOINTS.greenInvoice}/test`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error('GreenInvoice connection test failed');
        }

        return await response.json();
    } catch (error) {
        console.error('GreenInvoice connection test error:', error);
        throw error;
    }
};
