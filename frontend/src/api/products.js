import { API_ENDPOINTS } from '../config';

export async function fetchProducts() {
    try {
        const res = await fetch(API_ENDPOINTS.products);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        // Ensure we always return an array
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return []; // Return empty array on error
    }
}

export async function fetchProductById(id) {
    try {
        const res = await fetch(`${API_ENDPOINTS.products}/${id}`);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
}