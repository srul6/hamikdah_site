const https = require('https');
const crypto = require('crypto');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { NodeHttpHandler } = require('@smithy/node-http-handler');

// Presigned URL expiration: 60–300 seconds. Never expose long-lived URLs.
const PRESIGN_EXPIRY_SECONDS = (() => {
    const n = parseInt(process.env.UPLOAD_PRESIGN_EXPIRY_SECONDS, 10);
    if (!Number.isFinite(n)) return 180;
    return Math.min(300, Math.max(60, n));
})();

// Initialize S3 client for Cloudflare R2
// R2 is S3-compatible, so we use AWS SDK
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.warn('⚠️  R2 credentials not fully configured. File uploads may fail.');
}

// Custom HTTPS agent only for direct server→R2 operations (avoids TLS/EPROTO on Render).
const httpsAgent = new https.Agent({
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3',
    ciphers: 'DEFAULT:@SECLEVEL=0',
});

const baseConfig = {
    region: 'auto',
    endpoint: R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || '',
        secretAccessKey: R2_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true, // R2 expects path-style (host = account); virtual-hosted style uses bucket as subdomain and R2 has no cert for that
};

// Presign only: no requestHandler so URL signing is not affected; browser PUTs to this URL.
const s3ClientPresign = new S3Client(baseConfig);

// Direct server→R2: custom handler for Delete, Get, Put (server-side uploads).
const s3ClientDirect = new S3Client({
    ...baseConfig,
    requestHandler: new NodeHttpHandler({
        httpsAgent,
    }),
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'product-images';
const PUBLIC_URL = process.env.R2_PUBLIC_URL; // Your custom domain or R2 public URL

function buildPublicUrl(fileName) {
    if (PUBLIC_URL) return `${PUBLIC_URL}/${fileName}`;
    if (R2_ACCOUNT_ID) return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET_NAME}/${fileName}`;
    throw new Error('R2_ACCOUNT_ID or R2_PUBLIC_URL must be configured');
}

// Allowed MIME → file extension (backend controls key; client must not choose key).
const ALLOWED_MIME_TO_EXT = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/webm': 'webm',
};

class StorageController {
    /** Allowed MIME types for presigned upload (for validation in routes). */
    getAllowedMimeTypes() {
        return Object.keys(ALLOWED_MIME_TO_EXT);
    }

    /**
     * Generate a presigned PUT-only URL. Key is always server-generated: uploads/{userId}/{uuid}.{ext}.
     * Content-Type is enforced in the signature so the client cannot change MIME type.
     */
    async getPresignedPutUrlSecure(userId, contentType) {
        const ext = ALLOWED_MIME_TO_EXT[contentType] || 'bin';
        const sanitizedUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'anonymous';
        const uuid = crypto.randomUUID();
        const key = `uploads/${sanitizedUserId}/${uuid}.${ext}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: contentType,
            CacheControl: 'public, max-age=3600',
            ChecksumAlgorithm: undefined, // R2 does not support AWS SDK v3 checksum headers
        });
        const uploadUrl = await getSignedUrl(s3ClientPresign, command, {
            expiresIn: PRESIGN_EXPIRY_SECONDS,
            unhoistableHeaders: new Set(['x-amz-checksum-crc32']),
        });
        const publicUrl = buildPublicUrl(key);
        return { uploadUrl, publicUrl, key };
    }

    /**
     * Upload from buffer (server→R2). Same key pattern as presign. Use when browser→R2 fails (e.g. SSL/CORS).
     * @param {string} userId
     * @param {Buffer} buffer
     * @param {string} contentType
     * @returns {Promise<{ publicUrl: string, key: string }>}
     */
    async uploadFromBuffer(userId, buffer, contentType) {
        const ext = ALLOWED_MIME_TO_EXT[contentType] || 'bin';
        const sanitizedUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'anonymous';
        const uuid = crypto.randomUUID();
        const key = `uploads/${sanitizedUserId}/${uuid}.${ext}`;
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=3600',
            ChecksumAlgorithm: undefined,
        });
        await s3ClientDirect.send(command);
        const publicUrl = buildPublicUrl(key);
        return { publicUrl, key };
    }

    /**
     * Upload a file to Cloudflare R2 (server sends to R2). Use getPresignedPutUrl + client PUT when server→R2 TLS fails.
     * @param {Object} file - Multer file object
     * @param {String} folder - Folder path (e.g., 'products', 'comments')
     * @returns {Object} { success: boolean, url: string, path: string }
     */
    async uploadImage(file, folder = 'products') {
        try {
            // Generate unique filename
            const timestamp = Date.now();
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            // Upload to R2
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
                CacheControl: 'public, max-age=3600',
            });

            await s3ClientDirect.send(command);

            const publicUrl = buildPublicUrl(fileName);

            return {
                success: true,
                url: publicUrl,
                path: fileName
            };
        } catch (error) {
            console.error('❌ Error uploading file:', error);
            throw error;
        }
    }

    /**
     * Delete a file from Cloudflare R2
     * @param {String} filePath - Full path to file (e.g., 'products/123-abc.jpg')
     * @returns {Boolean} success
     */
    async deleteImage(filePath) {
        try {

            const command = new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: filePath,
            });

            await s3ClientDirect.send(command);
            return true;
        } catch (error) {
            console.error('❌ Error deleting file:', error);
            throw error;
        }
    }

    /**
     * Get a signed URL for private files (if needed)
     * @param {String} filePath - Path to file
     * @param {Number} expiresIn - Expiration time in seconds (default: 3600)
     * @returns {String} Signed URL
     */
    async getSignedUrl(filePath, expiresIn = 3600) {
        try {
            const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
            const command = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: filePath,
            });

            const signedUrl = await getSignedUrl(s3ClientPresign, command, { expiresIn });
            return signedUrl;
        } catch (error) {
            console.error('❌ Error generating signed URL:', error);
            throw error;
        }
    }
}

module.exports = new StorageController();

