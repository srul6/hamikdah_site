const express = require('express');
const rateLimit = require('express-rate-limit');
const { NewsletterService, siteOrigin, apiOrigin } = require('../services/newsletterService');
const clientMessages = require('../utils/clientFacingMessages');
const { verifyResultHtml } = require('../utils/newsletterVerifyHtml');
const {
    unsubscribeConfirmHtml,
    unsubscribeResultHtml
} = require('../utils/newsletterUnsubscribeHtml');

const router = express.Router();
const newsletterService = new NewsletterService();

const UNSUBSCRIBE_IMAGE =
    'https://cdn.bmikdash.com/moshe-bateva.png';

function homeUrl() {
    return siteOrigin();
}

const subscribeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: clientMessages.BAD_REQUEST }
});

const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: clientMessages.BAD_REQUEST }
});

const unsubscribeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: clientMessages.BAD_REQUEST }
});

function wantsHtml(req) {
    if (req.query.format === 'json' || req.body?.format === 'json') return false;
    if (req.query.format === 'html' || req.body?.format === 'html') return true;
    const accept = String(req.headers.accept || '');
    if (accept.includes('application/json') && !accept.includes('text/html')) return false;
    // Email clients / address-bar navigations typically prefer HTML
    return accept.includes('text/html') || accept.includes('*/*') || !accept;
}

function requestLanguage(req) {
    const raw = req.query.lang || req.body?.lang || req.query.language || req.body?.language;
    if (raw) return String(raw);
    const al = String(req.headers['accept-language'] || '');
    return al.toLowerCase().startsWith('en') ? 'en' : 'he';
}

/** POST /api/newsletter/subscribe — { email, name, phone, company_url? (honeypot), language? } */
router.post('/subscribe', subscribeLimiter, async (req, res) => {
    try {
        const { email, name, phone, company_url, website, language } = req.body || {};
        const result = await newsletterService.subscribe({
            email,
            name,
            phone,
            honeypot: company_url || website,
            language
        });

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
                message: result.message || clientMessages.BAD_REQUEST
            });
        }

        return res.json({
            success: true,
            status: result.status || 'subscribed',
            message: result.message
        });
    } catch (error) {
        console.error('❌ Newsletter subscribe error:', error);
        return res.status(500).json({
            success: false,
            message: clientMessages.BAD_REQUEST
        });
    }
});

/** GET /api/newsletter/verify?token=... — HTML for email clicks, JSON for APIs */
router.get('/verify', verifyLimiter, async (req, res) => {
    try {
        const token = req.query.token;
        const result = await newsletterService.verify(token);
        const asHtml = wantsHtml(req);
        const successMessageHe = 'ההרשמה אושרה! הקוד שלכם פעיל עכשיו.';
        const successMessageEn = "You're confirmed! Your code is now active.";

        if (!result.success) {
            if (asHtml) {
                res.status(400);
                return res.type('html').send(
                    verifyResultHtml({
                        success: false,
                        message: result.message || 'Invalid or expired verification link.',
                        homeUrl: homeUrl()
                    })
                );
            }
            return res.status(400).json({
                success: false,
                error: result.error,
                message: result.message
            });
        }

        if (asHtml) {
            return res.type('html').send(
                verifyResultHtml({
                    success: true,
                    alreadyVerified: !!result.alreadyVerified,
                    message: successMessageHe,
                    homeUrl: homeUrl()
                })
            );
        }

        return res.json({
            success: true,
            alreadyVerified: !!result.alreadyVerified,
            couponCode: result.couponCode,
            discountPercent: result.discountPercent || 5,
            message: successMessageEn
        });
    } catch (error) {
        console.error('❌ Newsletter verify error:', error);
        if (wantsHtml(req)) {
            res.status(500);
            return res.type('html').send(
                verifyResultHtml({
                    success: false,
                    message: 'Something went wrong. Please try again or contact us.',
                    homeUrl: homeUrl()
                })
            );
        }
        return res.status(500).json({
            success: false,
            message: clientMessages.BAD_REQUEST
        });
    }
});

/**
 * GET /api/newsletter/unsubscribe?token=...
 * Email clicks get a confirm page (does NOT unsubscribe yet).
 * ?format=json returns token validity JSON without deleting.
 */
router.get('/unsubscribe', unsubscribeLimiter, async (req, res) => {
    try {
        const token = req.query.token;
        const language = requestLanguage(req);
        const asHtml = wantsHtml(req);

        if (asHtml) {
            if (!token) {
                res.status(400);
                return res.type('html').send(
                    unsubscribeResultHtml({
                        success: false,
                        message: 'Invalid unsubscribe link.',
                        homeUrl: homeUrl(),
                        language
                    })
                );
            }
            const actionUrl = `${apiOrigin()}/api/newsletter/unsubscribe`;
            return res.type('html').send(
                unsubscribeConfirmHtml({
                    token,
                    actionUrl,
                    homeUrl: homeUrl(),
                    language,
                    imageUrl: UNSUBSCRIBE_IMAGE
                })
            );
        }

        return res.json({
            success: true,
            requiresConfirm: true,
            message: 'POST this token to complete unsubscribe.'
        });
    } catch (error) {
        console.error('❌ Newsletter unsubscribe (GET) error:', error);
        if (wantsHtml(req)) {
            res.status(500);
            return res.type('html').send(
                unsubscribeResultHtml({
                    success: false,
                    message: 'Something went wrong. Please try again.',
                    homeUrl: homeUrl(),
                    language: requestLanguage(req)
                })
            );
        }
        return res.status(500).json({
            success: false,
            message: clientMessages.BAD_REQUEST
        });
    }
});

/** POST /api/newsletter/unsubscribe — { email } or { token }; HTML form also supported */
router.post('/unsubscribe', unsubscribeLimiter, async (req, res) => {
    try {
        const { email, token } = req.body || {};
        const language = requestLanguage(req);
        const asHtml = wantsHtml(req);

        if (token && !email) {
            const byToken = await newsletterService.unsubscribeByToken(token);
            if (!byToken.success) {
                if (asHtml) {
                    res.status(400);
                    return res.type('html').send(
                        unsubscribeResultHtml({
                            success: false,
                            message: byToken.message,
                            homeUrl: homeUrl(),
                            language
                        })
                    );
                }
                return res.status(400).json({
                    success: false,
                    message: byToken.message
                });
            }
            if (asHtml) {
                return res.type('html').send(
                    unsubscribeResultHtml({
                        success: true,
                        message: byToken.message,
                        homeUrl: homeUrl(),
                        language
                    })
                );
            }
            return res.json({ success: true, message: byToken.message });
        }

        if (!email) {
            if (asHtml) {
                res.status(400);
                return res.type('html').send(
                    unsubscribeResultHtml({
                        success: false,
                        message: clientMessages.BAD_REQUEST,
                        homeUrl: homeUrl(),
                        language
                    })
                );
            }
            return res.status(400).json({
                success: false,
                message: clientMessages.BAD_REQUEST
            });
        }

        const result = await newsletterService.unsubscribeByEmail(email);
        if (!result.success) {
            if (asHtml) {
                res.status(400);
                return res.type('html').send(
                    unsubscribeResultHtml({
                        success: false,
                        message: result.message,
                        homeUrl: homeUrl(),
                        language
                    })
                );
            }
            return res.status(400).json({
                success: false,
                error: result.error,
                message: result.message
            });
        }
        if (asHtml) {
            return res.type('html').send(
                unsubscribeResultHtml({
                    success: true,
                    message: result.message,
                    homeUrl: homeUrl(),
                    language
                })
            );
        }
        return res.json({ success: true, message: result.message });
    } catch (error) {
        console.error('❌ Newsletter unsubscribe error:', error);
        if (wantsHtml(req)) {
            res.status(500);
            return res.type('html').send(
                unsubscribeResultHtml({
                    success: false,
                    message: clientMessages.BAD_REQUEST,
                    homeUrl: homeUrl(),
                    language: requestLanguage(req)
                })
            );
        }
        return res.status(500).json({
            success: false,
            message: clientMessages.BAD_REQUEST
        });
    }
});

module.exports = router;
