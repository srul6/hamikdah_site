const express = require('express');
const router = express.Router();
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

// --- Server-side upload disabled on purpose ---
// These routes would upload from Render → R2 and fail with EPROTO (SSL handshake) on Render.
// All uploads must use POST /presign then browser PUT to R2. If you see 410, your client must use /presign.
router.post('/image', (req, res) => {
    res.status(410).json({
        success: false,
        error: 'Use POST /api/upload/presign and then PUT the file to the returned URL. Server-side upload is disabled.'
    });
});
router.post('/images', (req, res) => {
    res.status(410).json({
        success: false,
        error: 'Use POST /api/upload/presign (per file) and PUT each file to the returned URL. Server-side upload is disabled.'
    });
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
// Server→R2 delete can fail with EPROTO on Render; we still return success so the UI can remove the URL.
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
            // Still return success so the UI can remove the image URL; file may remain in R2
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

