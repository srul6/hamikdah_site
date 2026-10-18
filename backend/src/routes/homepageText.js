const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { databaseController } = require('../config/database');
const clientMessages = require('../utils/clientFacingMessages');

function requireAdmin(req, res, next) {
    if (!req.admin) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (req.admin.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden: admin access required' });
    }
    next();
}

/** GET /api/homepage-text — public; null when inactive or empty */
router.get('/', async (req, res) => {
    try {
        const section = await databaseController.getHomepageText({ publicOnly: true });
        return res.json({ success: true, section });
    } catch (error) {
        console.error('❌ GET /homepage-text:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

/** GET /api/homepage-text/admin — admin; always returns the stored row (or null) */
router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
    try {
        const section = await databaseController.getHomepageText({ publicOnly: false });
        return res.json({ success: true, section });
    } catch (error) {
        console.error('❌ GET /homepage-text/admin:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

/** PUT /api/homepage-text/admin — create or update the single homepage text block */
router.put('/admin', requireAuth, requireAdmin, async (req, res) => {
    try {
        const section = await databaseController.upsertHomepageText(req.body || {});
        return res.json({ success: true, section });
    } catch (error) {
        console.error('❌ PUT /homepage-text/admin:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

module.exports = router;
