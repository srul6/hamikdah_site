const databaseController = require('../controllers/databaseController');
const EmailService = require('./emailService');
const { normalizeAndValidateEmail } = require('../utils/emailValidation');
const {
    normalizeAndValidatePhone,
    normalizeAndValidateName
} = require('../utils/phoneValidation');
const { randomToken, generateCouponCode } = require('../utils/newsletterTokens');
const { normalizeNewsletterLanguage } = require('../translations/frontendTranslations');

const NEWSLETTER_DISCOUNT_PERCENT = 5;
const VERIFICATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week
const COUPON_VALIDITY_DAYS = 7; // newsletter coupon usable for one week
const GENERIC_SUBSCRIBE_MESSAGE =
    'If this email can be subscribed, you will receive a confirmation link shortly.';

/**
 * Public customer-facing origin for links in emails (products, home).
 * Always defaults to bmikdash.com — never use FRONTEND_URL (often the Render preview).
 * Override only with PUBLIC_SITE_URL or SITE_URL.
 */
function siteOrigin() {
    const publicUrl = process.env.PUBLIC_SITE_URL || process.env.SITE_URL;
    return String(publicUrl || 'https://bmikdash.com').replace(/\/$/, '');
}

/** Public backend origin for email links that must hit the API (not the SPA). */
function apiOrigin() {
    // In development, link to the local API so verify works without deploying.
    // Override with PUBLIC_API_URL when you need emails to hit a remote API.
    if (process.env.NODE_ENV !== 'production') {
        const localOverride = process.env.PUBLIC_API_URL || '';
        if (localOverride) {
            return String(localOverride).replace(/\/$/, '').replace(/\/api$/i, '');
        }
        return `http://localhost:${process.env.PORT || 5001}`;
    }

    const raw =
        process.env.PUBLIC_API_URL ||
        process.env.BACKEND_URL ||
        process.env.API_PUBLIC_URL ||
        '';
    if (raw) {
        return String(raw).replace(/\/$/, '').replace(/\/api$/i, '');
    }
    return 'https://hamikdah-site.onrender.com';
}

function couponDateRange() {
    const validFrom = new Date();
    const validUntil = new Date(Date.now() + COUPON_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
    return {
        validFrom: validFrom.toISOString().slice(0, 10),
        validUntil: validUntil.toISOString().slice(0, 10)
    };
}

class NewsletterService {
    constructor() {
        this.emailService = new EmailService();
    }

    /**
     * Public subscribe entry. Always returns a generic success shape when
     * validation passes (anti-enumeration), except clear validation errors.
     *
     * Creates pending subscriber + inactive coupon in one DB transaction,
     * then sends a single email with the code + confirm link.
     */
    async subscribe({ email: rawEmail, name: rawName, phone: rawPhone, honeypot, language }) {
        // Bots fill honeypot — pretend success
        if (honeypot && String(honeypot).trim()) {
            return { success: true, status: 'subscribed', message: GENERIC_SUBSCRIBE_MESSAGE };
        }

        const validated = normalizeAndValidateEmail(rawEmail);
        if (!validated.ok) {
            return { success: false, error: 'invalid_email', message: 'Invalid email address' };
        }

        const nameValidated = normalizeAndValidateName(rawName);
        if (!nameValidated.ok) {
            return {
                success: false,
                error: 'invalid_name',
                message: 'Invalid name'
            };
        }

        const phoneValidated = normalizeAndValidatePhone(rawPhone);
        if (!phoneValidated.ok) {
            return {
                success: false,
                error: 'invalid_phone',
                message: 'Invalid phone number'
            };
        }

        const email = validated.email;
        const name = nameValidated.name;
        const phone = phoneValidated.phone;
        const verificationToken = randomToken();
        let unsubscribeToken = randomToken();
        const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
        const lang = normalizeNewsletterLanguage(language);

        await databaseController.ensureNewsletterSchema();

        const existing = await databaseController.findNewsletterSubscriberByEmail(email);

        // Always persist contact details when we have a row (or will create one).
        // Early success paths below must not drop name/phone.
        if (existing?.id) {
            try {
                await databaseController.updateNewsletterSubscriberContact(existing.id, {
                    name,
                    phone
                });
            } catch (err) {
                console.error(
                    'Newsletter contact update failed (name/phone columns missing?):',
                    err?.message || err
                );
                return {
                    success: false,
                    error: 'subscribe_failed',
                    message: 'Unable to save name and phone. Please try again.'
                };
            }
        }

        if (existing && existing.status === 'verified') {
            return {
                success: true,
                status: 'already_subscribed',
                message: 'Already subscribed'
            };
        }

        // Per-email cooldown + 24h cap (keyed by address, survives row delete).
        // If blocked: fake success and skip token refresh / send (anti email-bombing).
        // Contact fields were already saved above when a row existed.
        const sendSlot = await databaseController.claimNewsletterEmailSendSlot(email);
        if (!sendSlot.allowed) {
            // New address with no row yet: still create the pending subscriber so
            // name/phone are stored even if we skip the confirmation email.
            if (!existing) {
                try {
                    await this._createPendingWithInactiveCoupon({
                        email,
                        name,
                        phone,
                        verificationToken,
                        unsubscribeToken,
                        verificationExpiresAt: expiresAt
                    });
                } catch (err) {
                    console.error(
                        'Newsletter create-on-rate-limit failed:',
                        err?.message || err
                    );
                }
            }
            return {
                success: true,
                status: 'subscribed',
                message: GENERIC_SUBSCRIBE_MESSAGE
            };
        }

        let couponCode = null;

        try {
            if (existing && existing.status === 'pending') {
                unsubscribeToken = existing.unsubscribe_token;
                const result = await this._refreshPendingWithInactiveCoupon({
                    subscriberId: existing.id,
                    verificationToken,
                    verificationExpiresAt: expiresAt,
                    name,
                    phone
                });
                couponCode = result.couponCode;
            } else if (existing && existing.status === 'unsubscribed') {
                const result = await this._reactivateWithInactiveCoupon({
                    subscriberId: existing.id,
                    verificationToken,
                    unsubscribeToken,
                    verificationExpiresAt: expiresAt,
                    name,
                    phone
                });
                couponCode = result.couponCode;
            } else {
                const result = await this._createPendingWithInactiveCoupon({
                    email,
                    name,
                    phone,
                    verificationToken,
                    unsubscribeToken,
                    verificationExpiresAt: expiresAt
                });
                couponCode = result.couponCode;
            }
        } catch (err) {
            console.error('Newsletter subscribe transaction failed:', err?.message || err);
            return { success: false, error: 'subscribe_failed', message: 'Unable to complete signup.' };
        }

        const verifyUrl = `${apiOrigin()}/api/newsletter/verify?token=${encodeURIComponent(verificationToken)}`;
        // Unsubscribe confirm UI is served by the API (SPA route may not be deployed yet).
        const unsubscribeUrl = `${apiOrigin()}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

        let products = [];
        try {
            products = await this._productsForVerificationEmail();
        } catch (err) {
            console.error('Newsletter email products fetch failed:', err?.message || err);
        }

        try {
            await this.emailService.sendNewsletterVerification({
                to: email,
                verifyUrl,
                unsubscribeUrl,
                couponCode,
                discountPercent: NEWSLETTER_DISCOUNT_PERCENT,
                language: lang,
                products,
                siteOrigin: siteOrigin()
            });
        } catch (err) {
            console.error('Newsletter verification email failed:', err?.message || err);
            // Still return generic success — email issues are logged server-side
        }

        return { success: true, status: 'subscribed', message: GENERIC_SUBSCRIBE_MESSAGE };
    }

    async _productsForVerificationEmail() {
        const { getStorageUrl } = require('../utils/storageUtils');
        const { getProductSlug } = require('../utils/productSlug');
        const origin = siteOrigin();
        const all = await databaseController.getAllProducts();
        if (!Array.isArray(all) || all.length === 0) return [];

        const picked = all
            .filter((p) => p && (p.homepageimage || p.homepageImage))
            .slice(0, 4);

        const list = picked.length >= 4 ? picked : all.slice(0, 4);

        return list.map((product) => {
            const slug = getProductSlug(product, all);
            const rawImage = product.homepageimage || product.homepageImage || '';
            const imageUrl = getStorageUrl(rawImage) || '';
            // Avoid cache-busting query in emails (some clients break on ?t=)
            const cleanImage = String(imageUrl).replace(/\?t=\d+$/, '');
            const priceNum = parseFloat(product.price);
            return {
                nameHe: product.name_he || product.name_en || '',
                nameEn: product.name_en || product.name_he || '',
                price: Number.isFinite(priceNum) ? priceNum : null,
                imageUrl: cleanImage,
                url: `${origin}/product/${encodeURIComponent(slug)}`
            };
        });
    }

    async _insertInactiveCouponWithRetry(client, subscriberId) {
        const { validFrom, validUntil } = couponDateRange();
        let lastError = null;
        for (let attempt = 0; attempt < 8; attempt += 1) {
            const code = generateCouponCode();
            try {
                await client.query('SAVEPOINT coupon_insert');
                const coupon = await databaseController.createInactiveNewsletterCoupon(client, {
                    code,
                    discount: NEWSLETTER_DISCOUNT_PERCENT,
                    type: 'percentage',
                    minAmount: 0,
                    maxDiscount: 99999,
                    validFrom,
                    validUntil,
                    isActive: false,
                    usageCount: 0,
                    maxUsage: 1,
                    subscriberId
                });
                await client.query('RELEASE SAVEPOINT coupon_insert');
                return coupon;
            } catch (err) {
                lastError = err;
                try {
                    await client.query('ROLLBACK TO SAVEPOINT coupon_insert');
                } catch (_) {
                    // ignore
                }
                if (err && (err.code === '23505' || /unique/i.test(String(err.message)))) {
                    continue;
                }
                throw err;
            }
        }
        throw lastError || new Error('Failed to generate unique coupon code');
    }

    async _ensureInactiveCoupon(client, subscriberId) {
        const existing = await client.query(
            'SELECT * FROM coupons WHERE subscriber_id = $1 ORDER BY id DESC LIMIT 1',
            [subscriberId]
        );
        if (existing.rows[0]) {
            // Keep code; ensure it stays inactive until verify
            const updated = await client.query(
                `UPDATE coupons SET is_active = FALSE, updated_at = NOW()
                 WHERE id = $1
                 RETURNING *`,
                [existing.rows[0].id]
            );
            return databaseController.mapCouponRow(updated.rows[0]);
        }
        return this._insertInactiveCouponWithRetry(client, subscriberId);
    }

    async _createPendingWithInactiveCoupon({
        email,
        name,
        phone,
        verificationToken,
        unsubscribeToken,
        verificationExpiresAt
    }) {
        return databaseController.withTransaction(async (client) => {
            const subRes = await client.query(
                `INSERT INTO newsletter_subscribers
                    (email, name, phone, status, verification_token, verification_token_expires_at, unsubscribe_token)
                 VALUES ($1, $2, $3, 'pending', $4, $5, $6)
                 RETURNING *`,
                [email, name || null, phone || null, verificationToken, verificationExpiresAt, unsubscribeToken]
            );
            const subscriber = subRes.rows[0];
            const coupon = await this._insertInactiveCouponWithRetry(client, subscriber.id);
            return { subscriber, couponCode: coupon.code };
        });
    }

    async _refreshPendingWithInactiveCoupon({
        subscriberId,
        verificationToken,
        verificationExpiresAt,
        name,
        phone
    }) {
        return databaseController.withTransaction(async (client) => {
            await client.query(
                `UPDATE newsletter_subscribers SET
                    status = 'pending',
                    verification_token = $2,
                    verification_token_expires_at = $3,
                    name = COALESCE($4, name),
                    phone = COALESCE($5, phone),
                    unsubscribed_at = NULL
                 WHERE id = $1`,
                [subscriberId, verificationToken, verificationExpiresAt, name || null, phone || null]
            );
            const coupon = await this._ensureInactiveCoupon(client, subscriberId);
            return { couponCode: coupon.code };
        });
    }

    async _reactivateWithInactiveCoupon({
        subscriberId,
        verificationToken,
        unsubscribeToken,
        verificationExpiresAt,
        name,
        phone
    }) {
        return databaseController.withTransaction(async (client) => {
            await client.query(
                `UPDATE newsletter_subscribers SET
                    status = 'pending',
                    verification_token = $2,
                    verification_token_expires_at = $3,
                    unsubscribe_token = $4,
                    name = COALESCE($5, name),
                    phone = COALESCE($6, phone),
                    unsubscribed_at = NULL,
                    verified_at = NULL
                 WHERE id = $1`,
                [
                    subscriberId,
                    verificationToken,
                    verificationExpiresAt,
                    unsubscribeToken,
                    name || null,
                    phone || null
                ]
            );
            // Previous coupons were detached on unsubscribe — create a fresh inactive one
            const coupon = await this._insertInactiveCouponWithRetry(client, subscriberId);
            return { couponCode: coupon.code };
        });
    }

    async verify(token) {
        if (!token || typeof token !== 'string' || token.length < 16 || token.length > 128) {
            return { success: false, error: 'invalid_token', message: 'Invalid or expired verification link.' };
        }

        await databaseController.ensureNewsletterSchema();
        const subscriber = await databaseController.findNewsletterSubscriberByVerificationToken(token.trim());

        if (!subscriber) {
            // Token cleared after verify — check if already verified via coupon path is harder;
            // fall through to invalid. Already-verified users who re-click get invalid once token cleared.
            // Support already-verified by looking up nothing — we clear token on verify.
            // For alreadyVerified UX when token still present on verified row (shouldn't happen):
            return { success: false, error: 'invalid_token', message: 'Invalid or expired verification link.' };
        }

        if (subscriber.status === 'verified') {
            const existingCoupon = await databaseController.getCouponBySubscriberId(subscriber.id);
            return {
                success: true,
                alreadyVerified: true,
                couponCode: existingCoupon?.code || null,
                message: "You're confirmed! Your code is now active."
            };
        }

        if (subscriber.status === 'unsubscribed') {
            return { success: false, error: 'unsubscribed', message: 'This email has been unsubscribed.' };
        }

        const expiresAt = subscriber.verification_token_expires_at
            ? new Date(subscriber.verification_token_expires_at)
            : null;
        if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
            return { success: false, error: 'expired_token', message: 'Invalid or expired verification link.' };
        }

        try {
            const { coupon } = await databaseController.verifyNewsletterAndActivateCoupon(subscriber.id);
            return {
                success: true,
                couponCode: coupon?.code || null,
                discountPercent: NEWSLETTER_DISCOUNT_PERCENT,
                message: "You're confirmed! Your code is now active."
            };
        } catch (err) {
            if (err && err.code === 'subscriber_not_pending' && err.subscriber?.status === 'verified') {
                const existingCoupon = await databaseController.getCouponBySubscriberId(subscriber.id);
                return {
                    success: true,
                    alreadyVerified: true,
                    couponCode: existingCoupon?.code || null,
                    message: "You're confirmed! Your code is now active."
                };
            }
            console.error('Newsletter verify transaction failed:', err?.message || err);
            return { success: false, error: 'verify_failed', message: 'Invalid or expired verification link.' };
        }
    }

    async unsubscribeByToken(token) {
        if (!token || typeof token !== 'string' || token.length < 16 || token.length > 128) {
            return { success: false, error: 'invalid_token', message: 'Invalid unsubscribe link.' };
        }

        await databaseController.ensureNewsletterSchema();
        const subscriber = await databaseController.findNewsletterSubscriberByUnsubscribeToken(token.trim());
        if (!subscriber) {
            return { success: false, error: 'invalid_token', message: 'Invalid unsubscribe link.' };
        }

        await databaseController.deleteNewsletterSubscriberByEmail(subscriber.email);

        return { success: true, message: 'You have been unsubscribed.' };
    }

    /**
     * Unsubscribe by email: check existence and hard-delete the record.
     * No email link is sent.
     */
    async unsubscribeByEmail(rawEmail) {
        const validated = normalizeAndValidateEmail(rawEmail);
        if (!validated.ok) {
            return { success: false, error: 'invalid_email', message: 'Invalid email address' };
        }

        await databaseController.ensureNewsletterSchema();
        const subscriber = await databaseController.findNewsletterSubscriberByEmail(validated.email);

        if (!subscriber) {
            return {
                success: false,
                error: 'not_found',
                message: 'This email is not subscribed to the newsletter.'
            };
        }

        await databaseController.deleteNewsletterSubscriberByEmail(validated.email);

        return {
            success: true,
            message: 'You have been unsubscribed.'
        };
    }
}

module.exports = {
    NewsletterService,
    NEWSLETTER_DISCOUNT_PERCENT,
    GENERIC_SUBSCRIBE_MESSAGE,
    generateCouponCode,
    randomToken,
    siteOrigin,
    apiOrigin
};
