const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storageController } = require('../config/database');

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

// Delete image
router.delete('/image', async (req, res) => {
    try {
        const { path } = req.body;

        if (!path) {
            return res.status(400).json({
                success: false,
                error: 'Image path is required'
            });
        }

        await storageController.deleteImage(path);

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

