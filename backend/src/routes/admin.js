const express = require('express');
const router = express.Router();

// Admin credentials (in production, use environment variables)
const ADMIN_CREDENTIALS = {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'hamikdash2024'
};

// Admin login endpoint
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Validate credentials
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        // Set session or return success token
        res.json({
            success: true,
            message: 'Login successful',
            user: { username: ADMIN_CREDENTIALS.username }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

// Verify admin session (simple token-based for now)
router.get('/verify', (req, res) => {
    // In a real app, you'd verify JWT tokens or sessions
    // For now, we'll use a simple approach
    res.json({
        success: true,
        message: 'Admin verification endpoint'
    });
});

// Get admin data (orders, etc.)
router.get('/orders', (req, res) => {
    try {
        // Import orders array from orders route
        const { orders } = require('./orders');

        res.json({
            success: true,
            orders: orders || [],
            total: orders ? orders.length : 0
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
});

module.exports = router;
