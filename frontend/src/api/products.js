import { API_ENDPOINTS } from '../config';

export async function fetchProducts() {
    const res = await fetch(API_ENDPOINTS.products);
    return res.json();
}

export async function fetchProductById(id) {
    const res = await fetch(`${API_ENDPOINTS.products}/${id}`);
    return res.json();
}