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

/** GET /api/faq — public active FAQ items */
router.get('/', async (req, res) => {
    try {
        const items = await databaseController.getAllFaqItems({ activeOnly: true });
        return res.json({ success: true, items });
    } catch (error) {
        console.error('❌ GET /faq:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
    try {
        const items = await databaseController.getAllFaqItems({ activeOnly: false });
        return res.json({ success: true, items });
    } catch (error) {
        console.error('❌ GET /faq/admin/all:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

router.post('/admin', requireAuth, requireAdmin, async (req, res) => {
    try {
        const item = await databaseController.createFaqItem(req.body || {});
        return res.status(201).json({ success: true, item });
    } catch (error) {
        console.error('❌ POST /faq/admin:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

router.put('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const item = await databaseController.updateFaqItem(req.params.id, req.body || {});
        if (!item) return res.status(404).json({ success: false, message: 'Not found' });
        return res.json({ success: true, item });
    } catch (error) {
        console.error('❌ PUT /faq/admin:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        await databaseController.deleteFaqItem(req.params.id);
        return res.json({ success: true });
    } catch (error) {
        console.error('❌ DELETE /faq/admin:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

module.exports = router;
