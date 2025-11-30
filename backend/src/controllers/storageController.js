const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

// Initialize S3 client for Cloudflare R2
// R2 is S3-compatible, so we use AWS SDK
const s3Client = new S3Client({
    region: 'auto', // R2 uses 'auto' region
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'product-images';
const PUBLIC_URL = process.env.R2_PUBLIC_URL; // Your custom domain or R2 public URL

class StorageController {
    /**
     * Upload a file to Cloudflare R2
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

            console.log('📤 Uploading to Cloudflare R2:', fileName);

            // Upload to R2
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
                CacheControl: 'public, max-age=3600',
            });

            await s3Client.send(command);

            // Construct public URL
            const publicUrl = PUBLIC_URL
                ? `${PUBLIC_URL}/${fileName}`
                : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET_NAME}/${fileName}`;

            console.log('✅ File uploaded successfully');
            console.log('   File path:', fileName);
            console.log('   Public URL:', publicUrl);

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
            console.log('🗑️  Deleting from Cloudflare R2:', filePath);

            const command = new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: filePath,
            });

            await s3Client.send(command);

            console.log('✅ File deleted successfully:', filePath);
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

            const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
            return signedUrl;
        } catch (error) {
            console.error('❌ Error generating signed URL:', error);
            throw error;
        }
    }
}

module.exports = new StorageController();

