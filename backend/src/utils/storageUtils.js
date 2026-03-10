// backend/src/utils/storageUtils.js

function getStorageUrl(filename) {
    if (filename == null || typeof filename !== 'string') return null;
    const s = filename.trim();
    if (!s) return null;

    // If filename is already a full URL, return it as-is
    if (s.startsWith('http://') || s.startsWith('https://')) {
        return s;
    }

    const timestamp = Date.now(); // Add cache-busting timestamp

    // Using Cloudflare R2
    const publicUrl = process.env.R2_PUBLIC_URL;
    if (publicUrl) {
        return `${publicUrl}/${s}?t=${timestamp}`;
    }
    // Fallback to R2 default URL format
    const accountId = process.env.R2_ACCOUNT_ID;
    const bucketName = process.env.R2_BUCKET_NAME || 'product-images';
    if (accountId && bucketName) {
        return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${s}?t=${timestamp}`;
    }
    // If R2 not configured, return filename as-is (will likely be a broken link, but won't crash)
    console.warn('⚠️  R2 not fully configured. Image URL may be incorrect.');
    return s;
}

function getStorageUrls(filenames) {
    if (!Array.isArray(filenames)) return [];
    return filenames.map(filename => getStorageUrl(filename)).filter(url => url !== null);
}

module.exports = {
    getStorageUrl,
    getStorageUrls
}; 