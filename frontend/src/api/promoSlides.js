import { API_ENDPOINTS } from '../config';

/**
 * Public active promo slides. Returns [] on any failure (never throws).
 */
export async function fetchPromoSlides() {
  try {
    const res = await fetch(API_ENDPOINTS.promoSlides);
    if (!res.ok) return [];
    const data = await res.json().catch(() => null);
    if (!data || !data.success || !Array.isArray(data.slides)) return [];
    return data.slides;
  } catch (error) {
    console.error('Error fetching promo slides:', error);
    return [];
  }
}
