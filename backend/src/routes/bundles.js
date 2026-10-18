const express = require('express');
const router = express.Router();
const bundleController = require('../controllers/bundleController');
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
router.get('/', bundleController.getPublicBundles);

// Admin (before /:slug so "admin" is not treated as a slug)
router.get('/admin/all', requireAuth, requireAdmin, bundleController.getAdminBundles);
router.post('/', requireAuth, requireAdmin, bundleController.createBundle);
router.put('/:id', requireAuth, requireAdmin, bundleController.updateBundle);
router.delete('/:id', requireAuth, requireAdmin, bundleController.deleteBundle);

// Public by slug
router.get('/:slug', bundleController.getPublicBundleBySlug);

module.exports = router;
