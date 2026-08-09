// frontend/src/api/orders.js
import { API_BASE_URL } from '../config';

const API_ENDPOINTS = {
    orders: `${API_BASE_URL}/api/orders`
};

const ADS_LOG = '[Ads Conversion]';
let claimRequestSeq = 0;

function resolveRequestTag(requestId) {
    if (requestId && requestId.tag) {
        return requestId;
    }
    claimRequestSeq += 1;
    const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `claim-${Date.now()}-${claimRequestSeq}`;
    return {
        seq: claimRequestSeq,
        uuid,
        tag: `${ADS_LOG}[Request #${claimRequestSeq}][UUID=${uuid}]`
    };
}

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
 * Fetch paid-order ecommerce summary for GA4 purchase (read-only; no PII).
 * Retries on 404 while the webhook may still be creating the order.
 *
 * @returns {Promise<{ value: number, currency: string, transactionId: string, items: Array } | null>}
 */
export async function fetchPurchaseSummary(orderId, { retries = 12, delayMs = 1000 } = {}) {
    const id = encodeURIComponent(String(orderId));
    const url = `${API_ENDPOINTS.orders}/${id}/purchase-summary`;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { Accept: 'application/json' }
            });

            if (response.status === 404 && attempt < retries) {
                await new Promise((r) => setTimeout(r, delayMs));
                continue;
            }

            if (response.status === 403) {
                // Order exists but not paid yet — retry briefly
                if (attempt < retries) {
                    await new Promise((r) => setTimeout(r, delayMs));
                    continue;
                }
                return null;
            }

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            if (!data?.success || !data.paid) {
                return null;
            }

            return {
                value: data.value,
                currency: data.currency || 'ILS',
                transactionId: data.transactionId || String(orderId),
                items: Array.isArray(data.items) ? data.items : []
            };
        } catch (error) {
            if (attempt < retries) {
                await new Promise((r) => setTimeout(r, delayMs));
                continue;
            }
            console.warn('Error fetching purchase summary:', error);
            return null;
        }
    }

    return null;
}

/**
 * Atomically claim Ads conversion for a paid order (server is source of truth).
 * Retries briefly on 404 — webhook may create the order slightly after redirect.
 *
 * @returns {Promise<{ alreadySent: true } | { alreadySent: false, value: number, currency: string, transactionId: string } | null>}
 */
export async function claimAdsConversion(orderId, { retries = 12, delayMs = 1000, requestId } = {}) {
    const req = resolveRequestTag(requestId);
    const id = encodeURIComponent(String(orderId));
    let lastStatus = null;
    const url = `${API_ENDPOINTS.orders}/${id}/mark-conversion-sent`;

    console.info(`${req.tag} claimAdsConversion entered`, {
        orderId,
        url,
        retries,
        delayMs,
        timestamp: new Date().toISOString()
    });

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            console.info(`${req.tag} claimAdsConversion fetch attempt`, {
                attempt,
                maxAttempts: retries + 1,
                orderId,
                url,
                timestamp: new Date().toISOString()
            });

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Ads-Conversion-Request-Id': req.uuid
                }
            });
            lastStatus = response.status;

            console.info(`${req.tag} claimAdsConversion HTTP response`, {
                attempt,
                status: response.status,
                ok: response.ok,
                timestamp: new Date().toISOString()
            });

            if (response.status === 404 && attempt < retries) {
                console.info(`${req.tag} claimAdsConversion 404 — retrying (webhook lag?)`, {
                    attempt,
                    delayMs
                });
                await new Promise((r) => setTimeout(r, delayMs));
                continue;
            }

            if (response.status === 403) {
                console.warn(`${req.tag} claimAdsConversion refused — order not paid`, {
                    status: 403
                });
                return null;
            }

            if (!response.ok) {
                let bodyText = null;
                try {
                    bodyText = await response.text();
                } catch (_) {
                    // ignore
                }
                console.warn(`${req.tag} claimAdsConversion failed`, {
                    status: response.status,
                    bodyText
                });
                return null;
            }

            const data = await response.json();
            console.info(`${req.tag} claimAdsConversion response JSON`, {
                data,
                alreadySent: data.alreadySent,
                transactionId: data.transactionId,
                value: data.value,
                currency: data.currency
            });

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
            console.warn(`${req.tag} claimAdsConversion network/error`, {
                attempt,
                error: error?.message || error
            });
            if (attempt < retries) {
                await new Promise((r) => setTimeout(r, delayMs));
                continue;
            }
            console.error('Error claiming ads conversion:', error);
            return null;
        }
    }

    console.warn(`${req.tag} claimAdsConversion gave up`, { orderId, lastStatus });
    return null;
}
