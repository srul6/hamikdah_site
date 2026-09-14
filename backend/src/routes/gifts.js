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

/** GET /api/gifts/promotions — active promotions + books for cart UI */
router.get('/promotions', async (req, res) => {
    try {
        const promotions = await databaseController.getActiveGiftPromotionsSummary();
        return res.json({ success: true, promotions });
    } catch (error) {
        console.error('❌ GET /gifts/promotions:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

/** GET /api/gifts/books — active books (public) */
router.get('/books', async (req, res) => {
    try {
        const admin = !!req.query.all && req.headers.cookie;
        // Public: active only. Admin list uses /admin/books with auth.
        const books = await databaseController.getAllGiftBooks({ activeOnly: true });
        return res.json({ success: true, books });
    } catch (error) {
        console.error('❌ GET /gifts/books:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

router.get('/admin/books', requireAuth, requireAdmin, async (req, res) => {
    try {
        const books = await databaseController.getAllGiftBooks({ activeOnly: false });
        return res.json({ success: true, books });
    } catch (error) {
        console.error('❌ GET /gifts/admin/books:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

router.post('/admin/books', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { title, imageUrls, image_urls, active } = req.body || {};
        if (!title || !String(title).trim()) {
            return res.status(400).json({ success: false, message: clientMessages.BAD_REQUEST });
        }
        const book = await databaseController.createGiftBook({
            title,
            imageUrls: imageUrls || image_urls || [],
            active
        });
        return res.status(201).json({ success: true, book });
    } catch (error) {
        console.error('❌ POST /gifts/admin/books:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

router.put('/admin/books/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const book = await databaseController.updateGiftBook(req.params.id, {
            title: req.body.title,
            imageUrls: req.body.imageUrls || req.body.image_urls,
            active: req.body.active
        });
        if (!book) return res.status(404).json({ success: false, message: 'Not found' });
        return res.json({ success: true, book });
    } catch (error) {
        console.error('❌ PUT /gifts/admin/books:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

router.delete('/admin/books/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        await databaseController.deleteGiftBook(req.params.id);
        return res.json({ success: true });
    } catch (error) {
        console.error('❌ DELETE /gifts/admin/books:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

router.get('/admin/promotions', requireAuth, requireAdmin, async (req, res) => {
    try {
        const promotions = await databaseController.getAllGiftPromotions({ activeOnly: false });
        return res.json({ success: true, promotions });
    } catch (error) {
        console.error('❌ GET /gifts/admin/promotions:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

router.post('/admin/promotions', requireAuth, requireAdmin, async (req, res) => {
    try {
        const body = req.body || {};
        const productId = body.productId != null ? body.productId : body.product_id;
        if (productId == null) {
            return res.status(400).json({ success: false, message: clientMessages.BAD_REQUEST });
        }
        const promotion = await databaseController.createGiftPromotion({
            productId,
            giftsPerUnit: body.giftsPerUnit != null ? body.giftsPerUnit : body.gifts_per_unit,
            active: body.active,
            startDate: body.startDate || body.start_date,
            endDate: body.endDate || body.end_date,
            bookIds: body.bookIds || body.book_ids || []
        });
        return res.status(201).json({ success: true, promotion });
    } catch (error) {
        console.error('❌ POST /gifts/admin/promotions:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

router.put('/admin/promotions/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const body = req.body || {};
        const promotion = await databaseController.updateGiftPromotion(req.params.id, {
            productId: body.productId != null ? body.productId : body.product_id,
            giftsPerUnit: body.giftsPerUnit != null ? body.giftsPerUnit : body.gifts_per_unit,
            active: body.active,
            startDate: body.startDate !== undefined ? body.startDate : body.start_date,
            endDate: body.endDate !== undefined ? body.endDate : body.end_date,
            bookIds: body.bookIds || body.book_ids
        });
        if (!promotion) return res.status(404).json({ success: false, message: 'Not found' });
        return res.json({ success: true, promotion });
    } catch (error) {
        console.error('❌ PUT /gifts/admin/promotions:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

router.delete('/admin/promotions/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        await databaseController.deleteGiftPromotion(req.params.id);
        return res.json({ success: true });
    } catch (error) {
        console.error('❌ DELETE /gifts/admin/promotions:', error);
        return res.status(500).json({ success: false, message: clientMessages.BAD_REQUEST });
    }
});

module.exports = router;
