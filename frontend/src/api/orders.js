// frontend/src/api/orders.js
import { API_BASE_URL } from '../config';

const API_ENDPOINTS = {
    orders: `${API_BASE_URL}/api/orders`
};

export async function fetchOrders() {
    try {
        const response = await fetch(API_ENDPOINTS.orders, { credentials: 'include' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.orders || [];
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
}

export async function fetchOrderById(id) {
    try {
        const response = await fetch(`${API_ENDPOINTS.orders}/${id}`, { credentials: 'include' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.order;
    } catch (error) {
        console.error('Error fetching order:', error);
        throw error;
    }
}

export async function deleteOrder(id) {
    try {
        const response = await fetch(`${API_ENDPOINTS.orders}/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting order:', error);
        throw error;
    }
}

/**
 * Atomically claim Ads conversion for a paid order (server is source of truth).
 * Retries briefly on 404 — webhook may create the order slightly after redirect.
 *
 * @returns {Promise<{ alreadySent: true } | { alreadySent: false, value: number, currency: string, transactionId: string } | null>}
 */
export async function claimAdsConversion(orderId, { retries = 5, delayMs = 800 } = {}) {
    const id = encodeURIComponent(String(orderId));
    let lastStatus = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(`${API_ENDPOINTS.orders}/${id}/mark-conversion-sent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            lastStatus = response.status;

            if (response.status === 404 && attempt < retries) {
                await new Promise((r) => setTimeout(r, delayMs));
                continue;
            }

            if (response.status === 403) {
                if (process.env.NODE_ENV === 'development') {
                    // eslint-disable-next-line no-console
                    console.warn('[Ads] Conversion claim refused — order not paid');
                }
                return null;
            }

            if (!response.ok) {
                if (process.env.NODE_ENV === 'development') {
                    // eslint-disable-next-line no-console
                    console.warn('[Ads] Conversion claim failed', response.status);
                }
                return null;
            }

            const data = await response.json();
            if (data.alreadySent) {
                return { alreadySent: true };
            }
            return {
                alreadySent: false,
                value: data.value,
                currency: data.currency,
                transactionId: data.transactionId
            };
        } catch (error) {
            if (attempt < retries) {
                await new Promise((r) => setTimeout(r, delayMs));
                continue;
            }
            console.error('Error claiming ads conversion:', error);
            return null;
        }
    }

    if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[Ads] Conversion claim gave up', { orderId, lastStatus });
    }
    return null;
}
