const express = require('express');
const router = express.Router();

// In-memory storage for coupons (in production, use a database)
let coupons = [
    {
        id: 1,
        code: 'WELCOME10',
        discount: 10, // 10% discount
        type: 'percentage', // 'percentage' or 'fixed'
        minAmount: 0, // minimum order amount
        maxDiscount: 50, // maximum discount amount
        validFrom: '2025-01-01',
        validUntil: '2025-12-31',
        isActive: true,
        usageCount: 0,
        maxUsage: 100
    },
    {
        id: 2,
        code: 'SAVE20',
        discount: 20, // 20 ILS discount
        type: 'fixed',
        minAmount: 100,
        maxDiscount: 20,
        validFrom: '2025-01-01',
        validUntil: '2025-12-31',
        isActive: true,
        usageCount: 0,
        maxUsage: 50
    }
];

// Get all coupons (admin only)
router.get('/', (req, res) => {
    res.json({
        success: true,
        coupons: coupons
    });
});

// Get coupon by code
router.get('/:code', (req, res) => {
    const { code } = req.params;
    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive);

    if (!coupon) {
        return res.status(404).json({
            success: false,
            message: 'Coupon not found or inactive'
        });
    }

    // Check if coupon is still valid
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (now < validFrom || now > validUntil) {
        return res.status(400).json({
            success: false,
            message: 'Coupon has expired or is not yet valid'
        });
    }

    // Check usage limit
    if (coupon.usageCount >= coupon.maxUsage) {
        return res.status(400).json({
            success: false,
            message: 'Coupon usage limit reached'
        });
    }

    res.json({
        success: true,
        coupon: coupon
    });
});

// Create new coupon (admin only)
router.post('/', (req, res) => {
    const { code, discount, type, minAmount, maxDiscount, validFrom, validUntil, maxUsage } = req.body;

    if (!code || !discount || !type) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    // Check if code already exists
    if (coupons.find(c => c.code.toUpperCase() === code.toUpperCase())) {
        return res.status(400).json({
            success: false,
            message: 'Coupon code already exists'
        });
    }

    const newCoupon = {
        id: Date.now(),
        code: code.toUpperCase(),
        discount: parseFloat(discount),
        type: type,
        minAmount: parseFloat(minAmount) || 0,
        maxDiscount: parseFloat(maxDiscount) || discount,
        validFrom: validFrom || new Date().toISOString().split('T')[0],
        validUntil: validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
        usageCount: 0,
        maxUsage: parseInt(maxUsage) || 100
    };

    coupons.push(newCoupon);

    res.json({
        success: true,
        message: 'Coupon created successfully',
        coupon: newCoupon
    });
});

// Update coupon (admin only)
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const couponIndex = coupons.findIndex(c => c.id === parseInt(id));

    if (couponIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Coupon not found'
        });
    }

    const updatedCoupon = { ...coupons[couponIndex], ...req.body };
    coupons[couponIndex] = updatedCoupon;

    res.json({
        success: true,
        message: 'Coupon updated successfully',
        coupon: updatedCoupon
    });
});

// Delete coupon (admin only)
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const couponIndex = coupons.findIndex(c => c.id === parseInt(id));

    if (couponIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Coupon not found'
        });
    }

    coupons.splice(couponIndex, 1);

    res.json({
        success: true,
        message: 'Coupon deleted successfully'
    });
});

// Apply coupon to order
router.post('/apply', (req, res) => {
    const { code, totalAmount } = req.body;

    if (!code || !totalAmount) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive);

    if (!coupon) {
        return res.status(404).json({
            success: false,
            message: 'Coupon not found or inactive'
        });
    }

    // Check minimum amount
    if (totalAmount < coupon.minAmount) {
        return res.status(400).json({
            success: false,
            message: `Minimum order amount is ₪${coupon.minAmount}`
        });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
        discountAmount = (totalAmount * coupon.discount) / 100;
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    } else {
        discountAmount = Math.min(coupon.discount, coupon.maxDiscount);
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    res.json({
        success: true,
        coupon: coupon,
        originalAmount: totalAmount,
        discountAmount: discountAmount,
        finalAmount: finalAmount
    });
});

module.exports = router;
