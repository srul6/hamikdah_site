import { API_ENDPOINTS } from '../config';

export const createCardcomLowProfile = async (items, totalAmount, customerInfo) => {
    try {
        const response = await fetch(`${API_ENDPOINTS.cardcom}/create-lowprofile`, {
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
            throw new Error('LowProfile creation failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Cardcom LowProfile creation error:', error);
        throw error;
    }
};

export const processCardcomTransaction = async (cardData, amount, customerInfo) => {
    try {
        const response = await fetch(`${API_ENDPOINTS.cardcom}/process-transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cardNumber: cardData.cardNumber,
                cvv: cardData.cvv,
                expirationMonth: cardData.expirationMonth,
                expirationYear: cardData.expirationYear,
                amount: amount,
                customerInfo: customerInfo
            }),
        });

        if (!response.ok) {
            throw new Error('Transaction processing failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Cardcom transaction processing error:', error);
        throw error;
    }
};

export const getPaymentStatus = async (lowProfileId) => {
    try {
        const response = await fetch(`${API_ENDPOINTS.cardcom}/status/${lowProfileId}`, {
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