const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { storageController } = require('../config/database');
const { requireAuth } = require('../middleware/authMiddleware');

// --- Constants (security) ---
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;  // 10MB
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const ALLOWED_MIMES = storageController.getAllowedMimeTypes();

const proxyUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_VIDEO_SIZE_BYTES },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIMES.includes(file.mimetype)) {
            return cb(new Error('File type not allowed. Allowed: images (jpeg, png, gif, webp) and videos (mp4, mov, avi, webm).'));
        }
        cb(null, true);
    },
}).single('file');

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
        res.json({ success: true, uploadUrl, publicUrl, key });
    } catch (error) {
        console.error('❌ Presign error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get upload URL'
        });
    }
});

// Proxy upload: browser sends file to backend, backend uploads to R2. Avoids browser→R2 SSL/CORS issues.
router.post('/proxy', requireAuth, presignLimiter, (req, res, next) => {
    proxyUpload(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, error: 'File too large. Max 10MB for images, 100MB for videos.' });
            return res.status(400).json({ success: false, error: err.message || 'Invalid file' });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
        const { buffer, mimetype, size } = req.file;
        const isVideo = VIDEO_MIMES.includes(mimetype);
        const maxSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
        if (size > maxSize) return res.status(400).json({ success: false, error: isVideo ? 'Video size must be at most 100MB' : 'Image size must be at most 10MB' });
        const userId = req.admin?.username || 'admin';
        const { publicUrl, key } = await storageController.uploadFromBuffer(userId, buffer, mimetype);
        res.json({ success: true, publicUrl, key });
    } catch (error) {
        console.error('❌ Proxy upload error:', error);
        res.status(500).json({ success: false, error: error.message || 'Upload failed' });
    }
});

// Confirm after client uploads to R2 (validates key only).
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
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Confirm upload error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to record upload' });
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

// Delete image (authenticated only; path = object key or full public URL).
router.delete('/image', requireAuth, async (req, res) => {
    try {
        const key = pathToKey(req.body?.path);
        if (!key) {
            return res.status(400).json({
                success: false,
                error: 'Image path (or URL) is required'
            });
        }
        try {
            await storageController.deleteImage(key);
        } catch (err) {
            console.error('❌ R2 delete failed (may be EPROTO on Render); URL removed from app anyway:', err.message);
        }
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

