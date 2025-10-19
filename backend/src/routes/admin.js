const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { generateToken, setAuthCookie, clearAuthCookie, requireAuth } = require('../middleware/authMiddleware');

// Admin credentials - MUST be hashed in production
// To generate a hash: bcrypt.hashSync('your-password', 10)
const ADMIN_USERS = [
    {
        username: process.env.ADMIN_USERNAME || 'admin',
        // This is a hashed version of 'hamikdash2024'
        // In production, set ADMIN_PASSWORD_HASH in .env with your own bcrypt hash
        passwordHash: process.env.ADMIN_PASSWORD_HASH || '$2b$10$kPW3rWbN8zHnbNwaLrVaIu6LhA3TkzghS7cNWvyPKWEatO/VZ1x2a'
    }
];

/**
 * Admin login endpoint
 * Sets HttpOnly + Secure + SameSite=Strict cookie
 * Password is hashed and compared securely
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password required'
            });
        }

        // Find admin user
        const admin = ADMIN_USERS.find(u => u.username === username);

        if (!admin) {
            // Don't reveal if username exists (security)
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // For development/initial setup - allow plain password comparison
        let isValidPassword = false;

        if (admin.passwordHash.startsWith('$2b$')) {
            // Hashed password - use bcrypt
            isValidPassword = await bcrypt.compare(password, admin.passwordHash);
        } else {
            // Plain password (development only - NOT secure!)
            isValidPassword = password === admin.passwordHash;
            console.warn('⚠️  WARNING: Using plain text password - NOT secure for production!');
        }

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = generateToken({
            username: admin.username,
            role: 'admin',
            loginTime: new Date().toISOString()
        });

        // Set HttpOnly cookie with the token
        setAuthCookie(res, token);

        console.log(`✅ Admin logged in: ${username}`);

        res.json({
            success: true,
            message: 'Login successful',
            user: { username: admin.username }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

/**
 * Admin logout endpoint
 * Clears the HttpOnly cookie
 */
router.post('/logout', (req, res) => {
    clearAuthCookie(res);

    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * Verify admin session
 * Protected route - requires valid session cookie
 */
router.get('/verify', requireAuth, (req, res) => {
    res.json({
        success: true,
        message: 'Session valid',
        user: {
            username: req.admin.username,
            role: req.admin.role
        }
    });
});

/**
 * Check session status without requiring auth
 * Used by frontend to check if still logged in
 */
router.get('/check-session', (req, res) => {
    const token = req.cookies?.admin_session;

    if (!token) {
        return res.json({
            authenticated: false
        });
    }

    const { verifyToken } = require('../middleware/authMiddleware');
    const decoded = verifyToken(token);

    res.json({
        authenticated: !!decoded,
        user: decoded ? { username: decoded.username } : null
    });
});

module.exports = router;
