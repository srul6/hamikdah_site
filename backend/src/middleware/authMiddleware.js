/**
 * Authentication Middleware
 * Validates admin session from HttpOnly cookies
 */

const jwt = require('jsonwebtoken');

// Secret key for JWT - should be in .env
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Generate JWT token for admin session
 * @param {object} payload - Data to encode in token
 * @returns {string} JWT token
 */
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '24h',
        issuer: 'hamikdash-admin',
        audience: 'hamikdash-panel'
    });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object|null} Decoded payload or null if invalid
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET, {
            issuer: 'hamikdash-admin',
            audience: 'hamikdash-panel'
        });
    } catch (error) {
        console.error('❌ Token verification failed:', error.message);
        return null;
    }
}

/**
 * Middleware to check if request has valid admin session
 */
function requireAuth(req, res, next) {
    try {
        // Get token from HttpOnly cookie
        const token = req.cookies?.admin_session;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Verify token
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired session'
            });
        }

        // Attach user data to request
        req.admin = decoded;
        next();
    } catch (error) {
        console.error('❌ Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
}

/**
 * Set authentication cookie with HttpOnly flag
 * @param {object} res - Express response object
 * @param {string} token - JWT token
 */
function setAuthCookie(res, token) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('admin_session', token, {
        httpOnly: true,           // ✅ Not accessible from JavaScript
        secure: isProduction,     // ✅ HTTPS only in production
        sameSite: 'strict',       // ✅ Maximum CSRF protection
        maxAge: SESSION_DURATION, // ✅ 24 hours
        path: '/',
        domain: isProduction ? process.env.COOKIE_DOMAIN : undefined
    });
}

/**
 * Clear authentication cookie
 * @param {object} res - Express response object
 */
function clearAuthCookie(res) {
    res.clearCookie('admin_session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
    });
}

module.exports = {
    generateToken,
    verifyToken,
    requireAuth,
    setAuthCookie,
    clearAuthCookie,
    SESSION_DURATION
};

