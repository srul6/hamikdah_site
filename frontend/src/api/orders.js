// frontend/src/api/orders.js
import { API_BASE_URL } from '../config';

const API_ENDPOINTS = {
    orders: `${API_BASE_URL}/api/orders`
};

export async function fetchOrders() {
    try {
        const response = await fetch(API_ENDPOINTS.orders);
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
        const response = await fetch(`${API_ENDPOINTS.orders}/${id}`);
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

