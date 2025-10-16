import { API_BASE_URL } from '../config';

export const getImageUrl = (imagePath) => {
    if (!imagePath) return '';

    // Clean up any whitespace
    const cleanPath = imagePath.trim();

    // If it's already a full URL (starts with http:// or https://), return as is
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        return cleanPath;
    }

    // If it contains supabase.co anywhere in the string, it's a Supabase URL
    // This handles cases where the URL might be embedded in other text
    if (cleanPath.includes('supabase.co')) {
        // Extract just the Supabase URL part
        const match = cleanPath.match(/(https?:\/\/[^\s]+supabase\.co[^\s]*)/);
        if (match) {
            return match[1];
        }
        return cleanPath;
    }

    // Skip old/invalid filenames that don't look like valid image files
    // Valid images should have extensions like .jpg, .png, etc.
    if (!cleanPath.match(/\.(jpg|jpeg|png|gif|webp|mp4|mov|webm)$/i) && !cleanPath.includes('youtube.com/embed')) {
        console.warn('⚠️ Invalid image path detected:', cleanPath);
        return ''; // Return empty string for invalid paths
    }

    // Fallback to backend images (for any remaining local images)
    return `${API_BASE_URL}/images/${cleanPath}`;
};
