const express = require('express');
const rateLimit = require('express-rate-limit');
const databaseController = require('../controllers/databaseController');

const router = express.Router();

// Basic abuse protection (public endpoint)
const feedbackLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false
});

router.post('/', feedbackLimiter, async (req, res) => {
    try {
        const { clientId, message, language, email } = req.body || {};
        const MAX_CHARS = 500;

        if (!clientId || typeof clientId !== 'string' || clientId.trim().length < 8) {
            return res.status(400).json({ success: false, message: 'Invalid clientId' });
        }
        if (!message || typeof message !== 'string' || message.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const trimmed = message.trim();
        if (trimmed.length > MAX_CHARS) {
            return res.status(400).json({ success: false, message: `Message too long (max ${MAX_CHARS} characters)` });
        }

        const result = await databaseController.createSiteFeedback({
            clientId: clientId.trim(),
            message: trimmed,
            language: typeof language === 'string' ? language.trim() : null,
            email: typeof email === 'string' ? email.trim() : null,
            ip: req.ip,
            userAgent: req.headers['user-agent'] || null
        });

        if (!result) {
            return res.status(409).json({ success: false, message: 'Already submitted' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('❌ Error saving site feedback:', error);
        return res.status(500).json({ success: false, message: 'Failed to save feedback' });
    }
});

module.exports = router;

