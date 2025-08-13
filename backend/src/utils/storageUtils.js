// backend/src/utils/storageUtils.js

function getStorageUrl(filename) {
    if (!filename) return null;

    const supabaseUrl = process.env.SUPABASE_URL;
    const projectId = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
    const timestamp = Date.now(); // Add cache-busting timestamp

    return `https://${projectId}.supabase.co/storage/v1/object/public/product-images/${filename}?t=${timestamp}`;
}

function getStorageUrls(filenames) {
    if (!Array.isArray(filenames)) return [];
    return filenames.map(filename => getStorageUrl(filename)).filter(url => url !== null);
}

module.exports = {
    getStorageUrl,
    getStorageUrls
}; 