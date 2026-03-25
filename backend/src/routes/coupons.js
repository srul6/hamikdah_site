const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { databaseController } = require('../config/database');

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

// Apply coupon (public — must be registered before GET /:code if code could be "apply"; POST is distinct)
router.post('/apply', async (req, res) => {
    try {
        const { code, totalAmount } = req.body;

        if (!code || totalAmount === undefined || totalAmount === null) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const coupon = await databaseController.getCouponByCode(code);

        if (!coupon || !coupon.isActive) {
            return res.status(404).json({
                success: false,
                message_en: 'Coupon not found or inactive',
                message_he: 'אממ, נראה שאין קוד קופון כזה:('
            });
        }

        const now = new Date();
        const validFrom = new Date(coupon.validFrom);
        const validUntil = new Date(coupon.validUntil);

        if (now < validFrom || now > validUntil) {
            return res.status(400).json({
                success: false,
                message: 'Coupon has expired or is not yet valid'
            });
        }

        if (coupon.usageCount >= coupon.maxUsage) {
            return res.status(400).json({
                success: false,
                message: 'Coupon usage limit reached'
            });
        }

        const total = parseFloat(totalAmount);
        if (total < coupon.minAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount is ₪${coupon.minAmount}`
            });
        }

        let discountAmount = 0;
        if (coupon.type === 'percentage') {
            discountAmount = (total * coupon.discount) / 100;
            discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        } else {
            discountAmount = Math.min(coupon.discount, coupon.maxDiscount);
        }

        const finalAmount = Math.max(0, total - discountAmount);

        res.json({
            success: true,
            coupon,
            originalAmount: total,
            discountAmount,
            finalAmount
        });
    } catch (error) {
        console.error('❌ Coupon apply error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to apply coupon'
        });
    }
});

// Get all coupons (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const coupons = await databaseController.getAllCoupons();
        res.json({
            success: true,
            coupons
        });
    } catch (error) {
        console.error('❌ Error listing coupons:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve coupons'
        });
    }
});

// Get coupon by code (public — for checkout validation)
router.get('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const coupon = await databaseController.getCouponByCode(code);

        if (!coupon || !coupon.isActive) {
            return res.status(404).json({
                success: false,
                message_en: 'Coupon not found or inactive',
                message_he: 'אממ, נראה שאין קוד קופון כזה:('
            });
        }

        const now = new Date();
        const validFrom = new Date(coupon.validFrom);
        const validUntil = new Date(coupon.validUntil);

        if (now < validFrom || now > validUntil) {
            return res.status(400).json({
                success: false,
                message: 'Coupon has expired or is not yet valid'
            });
        }

        if (coupon.usageCount >= coupon.maxUsage) {
            return res.status(400).json({
                success: false,
                message: 'Coupon usage limit reached'
            });
        }

        res.json({
            success: true,
            coupon
        });
    } catch (error) {
        console.error('❌ Error fetching coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve coupon'
        });
    }
});

// Create new coupon (admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { code, discount, type, minAmount, maxDiscount, validFrom, validUntil, maxUsage } = req.body;

        if (!code || discount === undefined || !type) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const existing = await databaseController.getCouponByCode(code);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists'
            });
        }

        const newCoupon = await databaseController.createCoupon({
            code: code.toUpperCase(),
            discount: parseFloat(discount),
            type,
            minAmount: parseFloat(minAmount) || 0,
            maxDiscount: parseFloat(maxDiscount) || parseFloat(discount),
            validFrom: validFrom || new Date().toISOString().split('T')[0],
            validUntil: validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isActive: true,
            usageCount: 0,
            maxUsage: parseInt(maxUsage, 10) || 100
        });

        res.json({
            success: true,
            message: 'Coupon created successfully',
            coupon: newCoupon
        });
    } catch (error) {
        console.error('❌ Error creating coupon:', error);
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to create coupon'
        });
    }
});

// Update coupon (admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await databaseController.updateCoupon(parseInt(id, 10), req.body);

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        res.json({
            success: true,
            message: 'Coupon updated successfully',
            coupon: updated
        });
    } catch (error) {
        console.error('❌ Error updating coupon:', error);
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update coupon'
        });
    }
});

// Delete coupon (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const ok = await databaseController.deleteCoupon(parseInt(id, 10));

        if (!ok) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        res.json({
            success: true,
            message: 'Coupon deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete coupon'
        });
    }
});

module.exports = router;
