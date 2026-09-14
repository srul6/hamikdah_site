/**
 * Load copy from frontend/src/translations/translations.js so email + UI share one source.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let cachedTranslations = null;

function getFrontendTranslations() {
    if (cachedTranslations) return cachedTranslations;

    const filePath = path.join(
        __dirname,
        '../../../frontend/src/translations/translations.js'
    );
    const src = fs.readFileSync(filePath, 'utf8');
    const wrapped =
        src.replace(/export\s+const\s+translations\s*=/, 'const translations =') +
        '\nmodule.exports = translations;\n';

    const sandbox = { module: { exports: {} }, exports: {}, console };
    vm.runInNewContext(wrapped, sandbox, { filename: 'translations.js' });
    cachedTranslations = sandbox.module.exports;
    return cachedTranslations;
}

/** Normalize HE/EN/he/en → 'he' | 'en' */
function normalizeNewsletterLanguage(language) {
    const raw = String(language || '').trim().toLowerCase();
    return raw === 'en' ? 'en' : 'he';
}

function getNewsletterEmailCopy(language) {
    const all = getFrontendTranslations();
    const lang = normalizeNewsletterLanguage(language);
    const t = all[lang === 'en' ? 'EN' : 'HE'] || all.HE || {};

    return {
        subject: t.newsletterEmailSubject,
        heading: t.newsletterEmailHeading,
        couponIntroTemplate: t.newsletterEmailCouponIntro,
        confirmHint: t.newsletterEmailConfirmHint,
        confirmButton: t.newsletterEmailConfirmButton,
        validityNote: t.newsletterEmailValidityNote,
        purchaseButton: t.newsletterEmailPurchaseButton,
        unsubscribe: t.newsletterFooterUnsubscribe
    };
}

function formatCouponIntro(template, percent) {
    return String(template || '').replace(/\{percent\}/g, String(percent));
}

module.exports = {
    getFrontendTranslations,
    getNewsletterEmailCopy,
    normalizeNewsletterLanguage,
    formatCouponIntro
};
