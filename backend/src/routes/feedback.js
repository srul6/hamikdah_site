const express = require('express');
const rateLimit = require('express-rate-limit');
const databaseController = require('../controllers/databaseController');
const clientMessages = require('../utils/clientFacingMessages');

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
        const MIN_CHARS = 2;

        if (!clientId || typeof clientId !== 'string' || clientId.trim().length < 8) {
            console.warn('Feedback rejected: invalid clientId');
            return res.status(400).json({ success: false, message: clientMessages.FEEDBACK_REJECTED });
        }

        if (message === undefined || message === null) {
            console.warn('Feedback rejected: missing message');
            return res.status(400).json({ success: false, message: clientMessages.FEEDBACK_REJECTED });
        }
        if (typeof message !== 'string') {
            console.warn('Feedback rejected: message not a string');
            return res.status(400).json({ success: false, message: clientMessages.FEEDBACK_REJECTED });
        }

        const trimmed = message.trim();
        if (trimmed.length < MIN_CHARS) {
            console.warn('Feedback rejected: message too short');
            return res.status(400).json({ success: false, message: clientMessages.FEEDBACK_REJECTED });
        }
        if (trimmed.length > MAX_CHARS) {
            console.warn('Feedback rejected: message too long');
            return res.status(400).json({ success: false, message: clientMessages.FEEDBACK_REJECTED });
        }

        let safeEmail = null;
        if (email !== undefined && email !== null && email !== '') {
            if (typeof email !== 'string') {
                console.warn('Feedback rejected: invalid email type');
                return res.status(400).json({ success: false, message: clientMessages.FEEDBACK_REJECTED });
            }
            const e = email.trim();
            if (e.length > 254) {
                console.warn('Feedback rejected: email too long');
                return res.status(400).json({ success: false, message: clientMessages.FEEDBACK_REJECTED });
            }
            safeEmail = e || null;
        }

        let safeLang = null;
        if (language !== undefined && language !== null && language !== '') {
            if (typeof language !== 'string') {
                console.warn('Feedback rejected: invalid language type');
                return res.status(400).json({ success: false, message: clientMessages.FEEDBACK_REJECTED });
            }
            safeLang = language.trim().slice(0, 16) || null;
        }

        const result = await databaseController.createSiteFeedback({
            clientId: clientId.trim(),
            message: trimmed,
            language: safeLang,
            email: safeEmail,
            ip: req.ip,
            userAgent: req.headers['user-agent'] || null
        });

        if (!result) {
            console.warn('Feedback rejected: duplicate submit');
            return res.status(409).json({ success: false, message: clientMessages.FEEDBACK_REJECTED });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('❌ Error saving site feedback:', error);
        return res.status(500).json({ success: false, message: clientMessages.FEEDBACK_REJECTED });
    }
});

module.exports = router;

