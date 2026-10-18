const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    matchLegacySpecialPageByName,
    validateProductSlugInput,
    validateSpecialPageInput,
    getProductSlug,
    findProductBySlug,
    buildProductSlugMap,
    isMikdashProduct,
    isThirdTempleProduct,
    assertSlugAvailable,
    allocateInitialSlug,
    slugifyProductName
} = require('../src/utils/productSlug');

describe('matchLegacySpecialPageByName (backfill only)', () => {
    it('matches mikdash by Hebrew or English', () => {
        assert.equal(matchLegacySpecialPageByName({ name_he: 'המקדש' }), 'mikdash');
        assert.equal(
            matchLegacySpecialPageByName({ name_he: 'X', name_en: 'The Temple' }),
            'mikdash'
        );
    });

    it('matches third temple by Hebrew or English', () => {
        assert.equal(
            matchLegacySpecialPageByName({ name_he: 'בית המקדש השלישי' }),
            'third_temple'
        );
        assert.equal(
            matchLegacySpecialPageByName({ name_en: 'the third temple' }),
            'third_temple'
        );
    });

    it('matches ערכת המקדש as mikdash for backfill seeding', () => {
        assert.equal(matchLegacySpecialPageByName({ name_he: 'ערכת המקדש' }), 'mikdash');
    });

    it('returns null for unrelated names', () => {
        assert.equal(matchLegacySpecialPageByName({ name_he: 'קופת צדקה' }), null);
        assert.equal(matchLegacySpecialPageByName(null), null);
    });
});

describe('rename independence (stored slug + specialPage)', () => {
    it('keeps canonical slug and special page when the display name changes', () => {
        const before = {
            id: 7,
            name_he: 'ערכת המקדש',
            name_en: 'The Temple',
            slug: 'ערכת-המקדש',
            specialPage: 'mikdash'
        };
        const after = {
            ...before,
            name_he: 'אריאל - ערכת המקדש',
            name_en: 'Ariel - The Temple Kit'
        };
        const catalog = [after, { id: 8, name_he: 'אחר', slug: 'other' }];

        assert.equal(getProductSlug(before, [before]), 'ערכת-המקדש');
        assert.equal(getProductSlug(after, catalog), 'ערכת-המקדש');
        assert.equal(isMikdashProduct(after), true);
        assert.equal(isMikdashProduct({ ...after, specialPage: undefined }), false);
        assert.equal(findProductBySlug(catalog, 'ערכת-המקדש').id, 7);
        // Name-derived path still resolves so the client can redirect to the canonical slug
        assert.equal(findProductBySlug(catalog, 'אריאל-ערכת-המקדש').id, 7);
    });
});

describe('validateProductSlugInput / validateSpecialPageInput', () => {
    it('accepts null/empty and valid slugs', () => {
        assert.deepEqual(validateProductSlugInput(''), { ok: true, value: null });
        assert.deepEqual(validateProductSlugInput('ערכת-המקדש'), {
            ok: true,
            value: 'ערכת-המקדש'
        });
        assert.deepEqual(validateProductSlugInput(' Ariel-Kit '), {
            ok: true,
            value: 'Ariel-Kit'
        });
    });

    it('rejects spaces, leading hyphen, unsafe chars', () => {
        assert.equal(validateProductSlugInput('a b').ok, false);
        assert.equal(validateProductSlugInput('-abc').ok, false);
        assert.equal(validateProductSlugInput('abc-').ok, false);
        assert.equal(validateProductSlugInput('a/b').ok, false);
        assert.equal(validateProductSlugInput('a?b').ok, false);
        assert.equal(validateProductSlugInput('javascript:x').ok, false);
    });

    it('validates special_page values', () => {
        assert.deepEqual(validateSpecialPageInput(''), { ok: true, value: null });
        assert.deepEqual(validateSpecialPageInput('mikdash'), {
            ok: true,
            value: 'mikdash'
        });
        assert.equal(validateSpecialPageInput('other').ok, false);
    });
});

describe('getProductSlug / overrides / collisions', () => {
    const products = [
        { id: 1, name_he: 'אלפא', slug: null },
        { id: 2, name_he: 'בטא', slug: 'fixed-beta' },
        { id: 3, name_he: 'fixed-beta', slug: null }
    ];

    it('returns override slug exactly without collision suffix', () => {
        assert.equal(getProductSlug(products[1], products), 'fixed-beta');
    });

    it('computes name slug and avoids colliding with an override', () => {
        const slug = getProductSlug(products[2], products);
        assert.equal(slug, 'fixed-beta-3');
        const map = buildProductSlugMap(products);
        assert.equal(map.get(2), 'fixed-beta');
        assert.equal(map.get(3), 'fixed-beta-3');
    });

    it('findProductBySlug prefers override then computed', () => {
        assert.equal(findProductBySlug(products, 'fixed-beta').id, 2);
        assert.equal(findProductBySlug(products, 'fixed-beta-3').id, 3);
        assert.equal(findProductBySlug(products, 'אלפא').id, 1);
    });

    it('assertSlugAvailable detects conflicts', () => {
        const bad = assertSlugAvailable('fixed-beta', products, 99);
        assert.equal(bad.ok, false);
        assert.match(bad.message, /תפוסה/);
        assert.equal(assertSlugAvailable('fixed-beta', products, 2).ok, true);
    });

    it('allocateInitialSlug avoids taken names', () => {
        const s = allocateInitialSlug({ name_he: 'אלפא' }, products);
        assert.notEqual(s, 'אלפא');
        assert.ok(s.startsWith('אלפא'));
    });
});

describe('isMikdashProduct / isThirdTempleProduct', () => {
    it('uses specialPage only, not the product name', () => {
        assert.equal(isMikdashProduct({ name_he: 'המקדש' }), false);
        assert.equal(isMikdashProduct({ specialPage: 'mikdash' }), true);
        assert.equal(isMikdashProduct({ special_page: 'mikdash' }), true);
        assert.equal(isThirdTempleProduct({ specialPage: 'third_temple' }), true);
        assert.equal(isThirdTempleProduct({}), false);
        assert.equal(isMikdashProduct(undefined), false);
    });
});

describe('slugifyProductName', () => {
    it('slugifies Hebrew with spaces and punctuation', () => {
        assert.equal(slugifyProductName('אריאל - ערכת המקדש'), 'אריאל-ערכת-המקדש');
    });
});
