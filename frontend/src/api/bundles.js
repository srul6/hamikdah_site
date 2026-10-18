import { API_ENDPOINTS } from '../config';

export async function fetchBundles() {
    try {
        const res = await fetch(API_ENDPOINTS.bundles);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching bundles:', error);
        return [];
    }
}

export async function fetchBundleBySlug(slug) {
    try {
        if (slug == null || String(slug).trim() === '') {
            return null;
        }
        const encoded = encodeURIComponent(String(slug).trim());
        const res = await fetch(`${API_ENDPOINTS.bundles}/${encoded}`);
        if (res.status === 404) {
            return null;
        }
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.error('Error fetching bundle by slug:', error);
        return null;
    }
}
