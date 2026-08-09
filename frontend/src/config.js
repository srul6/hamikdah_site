// Configuration for API URLs
export const WHATSAPP_URL = 'https://wa.me/972539444166';

const isDevelopment = process.env.NODE_ENV === 'development';
// In production, set REACT_APP_API_URL in your build env (e.g. Render) or it falls back to the value below
export const API_BASE_URL = isDevelopment
    ? 'http://localhost:5001'
    : (process.env.REACT_APP_API_URL || 'https://hamikdah-site.onrender.com');

/** Public site origin for canonical URLs, Open Graph, and sitemap links */
export const SITE_URL = (process.env.REACT_APP_SITE_URL || 'https://bmikdash.com').replace(/\/$/, '');

export const API_ENDPOINTS = {
    products: `${API_BASE_URL}/api/products`,
    greenInvoice: `${API_BASE_URL}/api/greeninvoice`,
    cart: `${API_BASE_URL}/api/cart`,
    admin: `${API_BASE_URL}/api/admin`,
    coupons: `${API_BASE_URL}/api/coupons`,
    upload: `${API_BASE_URL}/api/upload`,
    orders: `${API_BASE_URL}/api/orders`,
    comments: `${API_BASE_URL}/api/comments`,
    feedback: `${API_BASE_URL}/api/feedback`
};
