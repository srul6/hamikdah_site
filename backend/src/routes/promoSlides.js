const express = require('express');
const router = express.Router();
const promoSlidesController = require('../controllers/promoSlidesController');
const { requireAuth } = require('../middleware/authMiddleware');

function requireAdmin(req, res, next) {
    if (!req.admin) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    if (req.admin.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: admin access required'
        });
    }
    next();
}

// Public
router.get('/', promoSlidesController.getPublicSlides);

// Admin (before /:id so "admin" is not treated as an id)
router.get('/admin/all', requireAuth, requireAdmin, promoSlidesController.getAdminSlides);
router.put('/admin/reorder', requireAuth, requireAdmin, promoSlidesController.reorderSlides);

router.post('/', requireAuth, requireAdmin, promoSlidesController.createSlide);
router.put('/:id', requireAuth, requireAdmin, promoSlidesController.updateSlide);
router.delete('/:id', requireAuth, requireAdmin, promoSlidesController.deleteSlide);

module.exports = router;
