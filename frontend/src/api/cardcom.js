import { API_ENDPOINTS } from '../config';

export const createCardcomPayment = async (items, totalAmount, customerInfo) => {
    try {
        const response = await fetch(`${API_ENDPOINTS.cardcom}/create-payment`, {
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
            throw new Error('Payment creation failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Cardcom payment creation error:', error);
        throw error;
    }
};

export const getPaymentStatus = async (transactionId) => {
    try {
        const response = await fetch(`${API_ENDPOINTS.cardcom}/status/${transactionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Payment status check failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Payment status check error:', error);
        throw error;
    }
}; 