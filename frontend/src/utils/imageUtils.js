import { API_BASE_URL } from '../config';

export const getImageUrl = (imagePath) => {
    if (!imagePath) return '';

    // If it's already a full URL (Supabase Storage), return as is
    if (imagePath.startsWith('http')) {
        return imagePath;
    }

    // Fallback to backend images (for any remaining local images)
    return `${API_BASE_URL}/images/${imagePath}`;
};
