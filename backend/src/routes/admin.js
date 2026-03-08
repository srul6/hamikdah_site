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
        passwordHash: process.env.ADMIN_PASSWORD_HASH ?? null
    }
];

// Login attempt tracking - stores failed login attempts per username
// Format: { username: { count: number, lockedUntil: Date } }
const loginAttempts = new Map();

// Configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Check if an account is currently locked
 * @param {string} username 
 * @returns {Object} { isLocked: boolean, lockedUntil: Date|null, remainingTime: string|null }
 */
function checkAccountLock(username) {
    const attempt = loginAttempts.get(username);

    if (!attempt || !attempt.lockedUntil) {
        return { isLocked: false, lockedUntil: null, remainingTime: null };
    }

    const now = new Date();

    if (now < attempt.lockedUntil) {
        // Account is still locked
        const remainingMs = attempt.lockedUntil - now;
        const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
        const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

        let remainingTime;
        if (remainingHours > 1) {
            remainingTime = `${remainingHours} hours`;
        } else {
            remainingTime = `${remainingMinutes} minutes`;
        }

        return {
            isLocked: true,
            lockedUntil: attempt.lockedUntil,
            remainingTime
        };
    } else {
        // Lock has expired - reset attempts
        loginAttempts.delete(username);
        return { isLocked: false, lockedUntil: null, remainingTime: null };
    }
}

/**
 * Record a failed login attempt
 * @param {string} username 
 * @returns {Object} { shouldLock: boolean, attemptsRemaining: number }
 */
function recordFailedAttempt(username) {
    const attempt = loginAttempts.get(username) || { count: 0, lockedUntil: null };

    attempt.count += 1;

    if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
        // Lock the account
        attempt.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        loginAttempts.set(username, attempt);

        console.warn(`🔒 Account locked: ${username} - Too many failed login attempts (${attempt.count})`);

        return { shouldLock: true, attemptsRemaining: 0 };
    } else {
        loginAttempts.set(username, attempt);
        const attemptsRemaining = MAX_LOGIN_ATTEMPTS - attempt.count;

        console.warn(`⚠️  Failed login attempt for ${username} - ${attemptsRemaining} attempts remaining`);

        return { shouldLock: false, attemptsRemaining };
    }
}

/**
 * Clear login attempts for a user (called on successful login)
 * @param {string} username 
 */
function clearLoginAttempts(username) {
    loginAttempts.delete(username);
}

/**
 * Admin login endpoint
 * Sets HttpOnly + Secure + SameSite=Strict cookie
 * Password is hashed and compared securely
 * Includes account lockout after 5 failed attempts for 24 hours
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

        // Check if account is locked
        const lockStatus = checkAccountLock(username);
        if (lockStatus.isLocked) {
            return res.status(423).json({ // 423 = Locked
                success: false,
                message: `Account is locked due to too many failed login attempts. Try again in ${lockStatus.remainingTime}.`,
                locked: true,
                lockedUntil: lockStatus.lockedUntil,
                remainingTime: lockStatus.remainingTime
            });
        }

        // Find admin user
        const admin = ADMIN_USERS.find(u => u.username === username);

        if (!admin) {
            // Record failed attempt (even for non-existent users to prevent enumeration)
            const result = recordFailedAttempt(username);

            return res.status(401).json({
                success: false,
                message: result.shouldLock
                    ? 'Account locked due to too many failed attempts. Try again in 24 hours.'
                    : `Invalid credentials. ${result.attemptsRemaining} attempts remaining.`,
                locked: result.shouldLock,
                attemptsRemaining: result.attemptsRemaining
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
            // Record failed attempt
            const result = recordFailedAttempt(username);

            return res.status(401).json({
                success: false,
                message: result.shouldLock
                    ? 'Account locked due to too many failed attempts. Try again in 24 hours.'
                    : `Invalid credentials. ${result.attemptsRemaining} attempts remaining.`,
                locked: result.shouldLock,
                attemptsRemaining: result.attemptsRemaining
            });
        }

        // Successful login - clear any failed attempts
        clearLoginAttempts(username);

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
