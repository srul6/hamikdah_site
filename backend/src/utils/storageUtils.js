// backend/src/utils/storageUtils.js

const USE_NEON = process.env.USE_NEON === 'true';

function getStorageUrl(filename) {
    if (!filename) return null;

    // If filename is already a full URL, return it as-is
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
        return filename;
    }

    const timestamp = Date.now(); // Add cache-busting timestamp

    if (USE_NEON) {
        // Using Cloudflare R2
        const publicUrl = process.env.R2_PUBLIC_URL;
        if (publicUrl) {
            return `${publicUrl}/${filename}?t=${timestamp}`;
        }
        // Fallback to R2 default URL format
        const accountId = process.env.R2_ACCOUNT_ID;
        const bucketName = process.env.R2_BUCKET_NAME || 'product-images';
        if (accountId) {
            return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${filename}?t=${timestamp}`;
        }
    } else {
        // Using Supabase Storage
        const supabaseUrl = process.env.SUPABASE_URL;
        if (supabaseUrl) {
            const projectId = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
            return `https://${projectId}.supabase.co/storage/v1/object/public/product-images/${filename}?t=${timestamp}`;
        }
    }

    // Fallback: return filename as-is if no storage configured
    return filename;
}

function getStorageUrls(filenames) {
    if (!Array.isArray(filenames)) return [];
    return filenames.map(filename => getStorageUrl(filename)).filter(url => url !== null);
}

module.exports = {
    getStorageUrl,
    getStorageUrls
}; 