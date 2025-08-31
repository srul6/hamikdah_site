// Configuration for API URLs
const isDevelopment = process.env.NODE_ENV === 'development';

export const API_BASE_URL = isDevelopment
    ? 'http://localhost:5001'
    : 'https://hamikdah-site.onrender.com'; // Use the backend service URL

export const API_ENDPOINTS = {
    products: `${API_BASE_URL}/api/products`,
    greenInvoice: `${API_BASE_URL}/api/greeninvoice`,
    cart: `${API_BASE_URL}/api/cart`
};
