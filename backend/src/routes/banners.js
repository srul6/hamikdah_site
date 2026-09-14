const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { databaseController } = require('../config/database');
const clientMessages = require('../utils/clientFacingMessages');

const PLACEMENTS = new Set(['site_entry', 'homepage_section', 'cart']);

function requireAdmin(req, res, next) {
    if (!req.admin) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (req.admin.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden: admin access required' });
    }
    next();
}

/** GET /api/banners?placement=site_entry — public active banners */
router.get('/', async (req, res) => {
    try {
        const placement = req.query.placement || undefined;
        if (placement && !PLACEMENTS.has(placement)) {
            return res.status(400).json({ success: false, message: clientMessages.BAD_REQUEST });
        }
        const banners = await databaseController.getAllBanners({
            placement,
            activeOnly: true
        });
        return res.json({ success: true, banners });
    } catch (error) {
        console.error('❌ GET /banners:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
    try {
        const banners = await databaseController.getAllBanners({
            placement: req.query.placement || undefined,
            activeOnly: false
        });
        return res.json({ success: true, banners });
    } catch (error) {
        console.error('❌ GET /banners/admin/all:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

router.post('/admin', requireAuth, requireAdmin, async (req, res) => {
    try {
        const body = req.body || {};
        if (!body.placement || !PLACEMENTS.has(body.placement)) {
            return res.status(400).json({ success: false, message: clientMessages.BAD_REQUEST });
        }
        const banner = await databaseController.createBanner(body);
        return res.status(201).json({ success: true, banner });
    } catch (error) {
        console.error('❌ POST /banners/admin:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

router.put('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const body = req.body || {};
        if (body.placement && !PLACEMENTS.has(body.placement)) {
            return res.status(400).json({ success: false, message: clientMessages.BAD_REQUEST });
        }
        const banner = await databaseController.updateBanner(req.params.id, body);
        if (!banner) return res.status(404).json({ success: false, message: 'Not found' });
        return res.json({ success: true, banner });
    } catch (error) {
        console.error('❌ PUT /banners/admin:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        await databaseController.deleteBanner(req.params.id);
        return res.json({ success: true });
    } catch (error) {
        console.error('❌ DELETE /banners/admin:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

module.exports = router;
