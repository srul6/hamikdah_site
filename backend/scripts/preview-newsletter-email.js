/**
 * Writes a local HTML preview of the newsletter verification email.
 * Usage: node scripts/preview-newsletter-email.js
 * Opens: backend/tmp/newsletter-email-preview-he.html
 */
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const {
    buildNewsletterVerificationEmail,
    wrapEmailDocument
} = require('../src/utils/newsletterVerificationEmail');

const SAMPLE_PRODUCTS = [
    {
        nameHe: 'ערכת המקדש',
        nameEn: 'The Temple',
        price: 249,
        imageUrl: 'https://cdn.bmikdash.com/mikdash.jpg',
        url: 'https://bmikdash.com/product/ערכת-המקדש'
    },
    {
        nameHe: 'מיני מקדש',
        nameEn: 'Mini Temple',
        price: 129,
        imageUrl: 'https://cdn.bmikdash.com/uploads/gilmanor/8b073295-a115-46bd-82fa-0a2383b8ee6d.png',
        url: 'https://bmikdash.com/product/מיני-מקדש'
    },
    {
        nameHe: 'בית המקדש השלישי',
        nameEn: 'The Third Temple',
        price: 199,
        imageUrl: 'https://cdn.bmikdash.com/3mikdash_4.jpeg',
        url: 'https://bmikdash.com/product/בית-המקדש-השלישי'
    },
    {
        nameHe: 'משה בתיבה',
        nameEn: 'Moshe in the basket',
        price: 89,
        imageUrl: 'https://cdn.bmikdash.com/moshe-bateva.png',
        url: 'https://bmikdash.com/product/משה-בתיבה'
    }
];

async function loadLiveProducts() {
    try {
        const databaseController = require('../src/controllers/databaseController');
        const { getStorageUrl } = require('../src/utils/storageUtils');
        const { getProductSlug } = require('../src/utils/productSlug');
        const siteOrigin = (
            process.env.PUBLIC_SITE_URL ||
            process.env.SITE_URL ||
            'https://bmikdash.com'
        ).replace(/\/$/, '');

        await databaseController.ensureNewsletterSchema();
        const all = await databaseController.getAllProducts();
        if (!Array.isArray(all) || all.length === 0) return null;

        const picked = all.filter((p) => p && (p.homepageimage || p.homepageImage)).slice(0, 4);
        const list = picked.length >= 4 ? picked : all.slice(0, 4);

        return list.map((product) => {
            const raw = product.homepageimage || product.homepageImage || '';
            const imageUrl = String(getStorageUrl(raw) || '').replace(/\?t=\d+$/, '');
            return {
                nameHe: product.name_he || product.name_en || '',
                nameEn: product.name_en || product.name_he || '',
                price: parseFloat(product.price),
                imageUrl,
                url: `${siteOrigin}/product/${encodeURIComponent(getProductSlug(product, all))}`
            };
        });
    } catch (err) {
        console.warn('Using sample products (live fetch failed):', err.message);
        return null;
    }
}

async function main() {
    const products = (await loadLiveProducts()) || SAMPLE_PRODUCTS;
    const outDir = path.join(__dirname, '..', 'tmp');
    fs.mkdirSync(outDir, { recursive: true });

    for (const language of ['he', 'en', 'HE', 'EN']) {
        if (language !== 'he' && language !== 'en') continue; // only write he/en files
        const built = buildNewsletterVerificationEmail({
            verifyUrl: 'https://example.com/api/newsletter/verify?token=preview',
            unsubscribeUrl: 'http://localhost:5001/api/newsletter/unsubscribe?token=preview',
            couponCode: 'NEWSABCD1234',
            discountPercent: 5,
            language,
            products,
            siteOrigin: 'https://bmikdash.com'
        });

        const doc = wrapEmailDocument(built.html, built.subject, language);
        const file = path.join(outDir, `newsletter-email-preview-${language}.html`);
        fs.writeFileSync(file, doc, 'utf8');
        console.log('Wrote', file);
        console.log('  subject:', built.subject);
    }

    // Sanity: EN from site language code
    const fromSiteEn = buildNewsletterVerificationEmail({
        verifyUrl: 'https://example.com/verify',
        unsubscribeUrl: 'https://bmikdash.com/unsubscribe',
        couponCode: 'NEWSABCD1234',
        language: 'EN',
        products: [],
        siteOrigin: 'https://bmikdash.com'
    });
    console.log('Site language EN → subject:', fromSiteEn.subject);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
