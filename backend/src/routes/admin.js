const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const bcrypt = require('bcrypt');
const { generateToken, setAuthCookie, clearAuthCookie, requireAuth } = require('../middleware/authMiddleware');
const databaseController = require('../controllers/databaseController');

// Admin credentials - MUST be hashed in production
// To generate a hash: bcrypt.hashSync('your-password', 10)
const ADMIN_USERS = [
    {
        username: process.env.ADMIN_USERNAME || 'admin',
        // This is a hashed version of 'hamikdash2024'
        // In production, set ADMIN_PASSWORD_HASH in .env with your own bcrypt hash
        passwordHash: process.env.ADMIN_PASSWORD_HASH ?? null
    }
];

// Generic message for all login failures/lockouts (do not reveal if email exists)
const LOGIN_ERROR_MESSAGE = 'Invalid credentials or account locked.';

// IP-only lockout (server-side, persists across refresh): 5 attempts → 1h, then 24h if locked again
const MAX_LOGIN_ATTEMPTS = 5;
const FIRST_LOCKOUT_MINUTES = 60;
const SUBSEQUENT_LOCKOUT_MINUTES = 24 * 60;

// IP-based rate limit for login: 10 requests per 15 min per IP (blocks brute force before DB)
const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: LOGIN_ERROR_MESSAGE },
    standardHeaders: true,
    legacyHeaders: false
});

/** Get client IP (respects proxy X-Forwarded-For). */
function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const first = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0];
        return (first || '').trim() || req.ip || req.socket?.remoteAddress || '';
    }
    return req.ip || req.socket?.remoteAddress || '';
}

/**
 * Admin login endpoint
 * IP rate limit → IP-only lockout (DB-backed, survives refresh). No per-username tracking.
 */
router.post('/login', loginRateLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        const clientIp = getClientIp(req);

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password required'
            });
        }

        const identifier = String(username).trim();
        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: 'Username and password required'
            });
        }

        const ipLockStatus = await databaseController.getLoginLockStatusByIp(clientIp);
        if (ipLockStatus.isLocked) {
            return res.status(423).json({
                success: false,
                message: LOGIN_ERROR_MESSAGE,
                locked: true,
                lockedUntil: ipLockStatus.lockedUntil ? ipLockStatus.lockedUntil.toISOString() : null,
                remainingTime: ipLockStatus.remainingTime || null
            });
        }

        const admin = ADMIN_USERS.find(u => u.username === identifier);

        if (!admin) {
            const ipResult = await databaseController.recordLoginFailureByIp(clientIp, MAX_LOGIN_ATTEMPTS, FIRST_LOCKOUT_MINUTES, SUBSEQUENT_LOCKOUT_MINUTES);
            if (ipResult.shouldLock) {
                const ipLock = await databaseController.getLoginLockStatusByIp(clientIp);
                return res.status(423).json({
                    success: false,
                    message: LOGIN_ERROR_MESSAGE,
                    locked: true,
                    lockedUntil: ipLock.lockedUntil ? ipLock.lockedUntil.toISOString() : null,
                    remainingTime: ipLock.remainingTime || null
                });
            }
            return res.status(401).json({
                success: false,
                message: LOGIN_ERROR_MESSAGE
            });
        }

        if (!admin.passwordHash) {
            console.warn('⚠️  ADMIN_PASSWORD_HASH not set. Set it in .env (use generate-password-hash.js).');
            return res.status(503).json({
                success: false,
                message: 'Server misconfiguration. Admin login is disabled.'
            });
        }

        let isValidPassword = false;
        if (admin.passwordHash.startsWith('$2b$')) {
            isValidPassword = await bcrypt.compare(password, admin.passwordHash);
        } else {
            // Plain password (development only - NOT secure!)
            isValidPassword = password === admin.passwordHash;
            if (process.env.NODE_ENV === 'production') {
                return res.status(503).json({
                    success: false,
                    message: 'Server misconfiguration. Use bcrypt hash in production.'
                });
            }
            console.warn('⚠️  WARNING: Using plain text password - NOT secure for production!');
        }

        if (!isValidPassword) {
            const ipResult = await databaseController.recordLoginFailureByIp(clientIp, MAX_LOGIN_ATTEMPTS, FIRST_LOCKOUT_MINUTES, SUBSEQUENT_LOCKOUT_MINUTES);
            if (ipResult.shouldLock) {
                const ipLock = await databaseController.getLoginLockStatusByIp(clientIp);
                return res.status(423).json({
                    success: false,
                    message: LOGIN_ERROR_MESSAGE,
                    locked: true,
                    lockedUntil: ipLock.lockedUntil ? ipLock.lockedUntil.toISOString() : null,
                    remainingTime: ipLock.remainingTime || null
                });
            }
            return res.status(401).json({
                success: false,
                message: LOGIN_ERROR_MESSAGE
            });
        }

        await databaseController.clearLoginAttemptsByIp(clientIp);

        const token = generateToken({
            username: admin.username,
            role: 'admin',
            loginTime: new Date().toISOString()
        });
        setAuthCookie(res, token);

        console.log(`✅ Admin logged in: ${identifier}`);

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
