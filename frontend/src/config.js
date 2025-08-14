// Configuration for API URLs
const isDevelopment = process.env.NODE_ENV === 'development';

export const API_BASE_URL = isDevelopment
    ? 'http://localhost:5001'
    : 'https://hamikdash-backend.onrender.com'; // Update this with your actual backend URL

export const API_ENDPOINTS = {
    products: `${API_BASE_URL}/api/products`,
    cardcom: `${API_BASE_URL}/api/cardcom`,
    cart: `${API_BASE_URL}/api/cart`
};
