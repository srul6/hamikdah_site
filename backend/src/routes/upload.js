const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { storageController, databaseController } = require('../config/database');
const { requireAuth } = require('../middleware/authMiddleware');

// --- Constants (security) ---
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;  // 10MB
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const ALLOWED_MIMES = storageController.getAllowedMimeTypes();

// Rate limiting: prevent mass generation of signed URLs
const presignLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: { success: false, error: 'Too many upload requests. Try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Validate presign body: contentType (allow list), contentLength (images 10MB, videos 100MB).
 * Client must NOT send object key; backend generates it.
 */
function validatePresignBody(body) {
    const { contentType, contentLength } = body || {};
    if (!contentType || typeof contentLength !== 'number') {
        return { ok: false, error: 'contentType and contentLength are required' };
    }
    if (!ALLOWED_MIMES.includes(contentType)) {
        return { ok: false, error: 'File type not allowed. Allowed: images (jpeg, png, gif, webp) and videos (mp4, mov, avi, webm).' };
    }
    const isVideo = VIDEO_MIMES.includes(contentType);
    const maxSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
    if (contentLength < 0 || contentLength > maxSize) {
        return { ok: false, error: isVideo ? 'Video size must be at most 100MB' : 'Image size must be at most 10MB' };
    }
    return { ok: true };
}

// Presigned upload: authenticated only; short-lived PUT URL; backend generates key; type/size validated.
// R2 CORS must allow only your app origin and methods PUT, GET (no wildcard in production).
router.post('/presign', requireAuth, presignLimiter, async (req, res) => {
    try {
        const validation = validatePresignBody(req.body);
        if (!validation.ok) {
            return res.status(400).json({ success: false, error: validation.error });
        }
        const { contentType } = req.body;
        const userId = req.admin?.username || 'admin';
        const { uploadUrl, publicUrl, key } = await storageController.getPresignedPutUrlSecure(userId, contentType);
        // Return only presigned URL and public URL; never expose R2 credentials or key to untrusted client (key is returned for confirm only).
        res.json({ success: true, uploadUrl, publicUrl, key });
    } catch (error) {
        console.error('❌ Presign error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get upload URL'
        });
    }
});

// Post-upload: record metadata (userId, key, mimeType, size) after client uploads to R2
router.post('/confirm', requireAuth, async (req, res) => {
    try {
        const { key, size, mimeType } = req.body || {};
        if (!key || typeof size !== 'number' || !mimeType) {
            return res.status(400).json({ success: false, error: 'key, size, and mimeType are required' });
        }
        const userId = req.admin?.username || 'admin';
        const sanitizedUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
        const expectedPrefix = `uploads/${sanitizedUserId}/`;
        if (!key.startsWith(expectedPrefix)) {
            return res.status(403).json({ success: false, error: 'Key does not belong to your uploads' });
        }
        await databaseController.recordUpload({ userId, key, mimeType, size });
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Confirm upload error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to record upload' });
    }
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit (increased for videos)
    },
    fileFilter: (req, file, cb) => {
        // Accept images and videos
        const isImage = file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        const isVideo = file.originalname.match(/\.(mp4|mov|avi|webm|mkv)$/i) ||
            file.mimetype.startsWith('video/');

        if (!isImage && !isVideo) {
            return cb(new Error('Only image and video files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Upload single file (image or video)
router.post('/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file provided'
            });
        }

        const folder = req.body.folder || 'products';
        const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

        console.log(`📤 ${fileType} upload request:`, {
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            folder: folder
        });

        const result = await storageController.uploadImage(req.file, folder);

        res.json({
            success: true,
            message: `${fileType} uploaded successfully`,
            url: result.url,
            path: result.path
        });

    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to upload file'
        });
    }
});

// Upload multiple images
router.post('/images', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No image files provided'
            });
        }

        const folder = req.body.folder || 'products';

        console.log(`📤 Multiple images upload request: ${req.files.length} files`);

        const uploadPromises = req.files.map(file =>
            storageController.uploadImage(file, folder)
        );

        const results = await Promise.all(uploadPromises);

        res.json({
            success: true,
            message: `${results.length} images uploaded successfully`,
            images: results
        });

    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to upload images'
        });
    }
});

// Normalize path: if full URL, extract object key (e.g. uploads/userId/uuid.ext)
function pathToKey(path) {
    if (!path || typeof path !== 'string') return null;
    const s = path.trim();
    if (s.startsWith('http://') || s.startsWith('https://')) {
        try {
            const u = new URL(s);
            const p = u.pathname.replace(/^\/+/, '');
            return p || null;
        } catch (_) { return null; }
    }
    return s;
}

// Delete image (authenticated only; path = object key or full public URL)
router.delete('/image', requireAuth, async (req, res) => {
    try {
        const key = pathToKey(req.body?.path);
        if (!key) {
            return res.status(400).json({
                success: false,
                error: 'Image path (or URL) is required'
            });
        }
        await storageController.deleteImage(key);

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });

    } catch (error) {
        console.error('❌ Delete error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete image'
        });
    }
});

module.exports = router;

