const API_URL = 'http://localhost:5001/api/products';

export async function fetchProducts() {
    const res = await fetch(API_URL);
    return res.json();
}

export async function fetchProductById(id) {
    const res = await fetch(`${API_URL}/${id}`);
    return res.json();
}