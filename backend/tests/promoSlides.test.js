const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    validatePromoSlideInput,
    validateReorderIds,
    buildSortOrderMap
} = require('../src/utils/promoSlideValidation');

describe('validatePromoSlideInput — image', () => {
    it('requires a desktop image URL', () => {
        const r = validatePromoSlideInput({ linkType: 'none' });
        assert.equal(r.ok, false);
        assert.match(r.message, /תמונת דסקטופ/);
    });

    it('accepts a relative image path and https URL', () => {
        assert.equal(
            validatePromoSlideInput({ image: '/uploads/promo.jpg', linkType: 'none' }).ok,
            true
        );
        assert.equal(
            validatePromoSlideInput({
                image: 'https://cdn.example.com/a.jpg',
                linkType: 'none'
            }).ok,
            true
        );
    });

    it('rejects javascript: and data: image URLs', () => {
        assert.equal(
            validatePromoSlideInput({ image: 'javascript:alert(1)', linkType: 'none' }).ok,
            false
        );
        assert.equal(
            validatePromoSlideInput({
                image: 'data:image/png;base64,abc',
                linkType: 'none'
            }).ok,
            false
        );
    });

    it('allows optional mobile image or rejects unsafe ones', () => {
        const ok = validatePromoSlideInput({
            image: 'https://cdn.example.com/d.jpg',
            imageMobile: 'https://cdn.example.com/m.jpg',
            linkType: 'none'
        });
        assert.equal(ok.ok, true);
        assert.equal(ok.value.imageMobile, 'https://cdn.example.com/m.jpg');

        const bad = validatePromoSlideInput({
            image: 'https://cdn.example.com/d.jpg',
            image_mobile: 'javascript:void(0)',
            linkType: 'none'
        });
        assert.equal(bad.ok, false);
    });
});

describe('validatePromoSlideInput — alt texts', () => {
    it('rejects alt text over 200 chars', () => {
        const long = 'א'.repeat(201);
        const r = validatePromoSlideInput({
            image: 'https://x.com/a.jpg',
            alt_he: long,
            linkType: 'none'
        });
        assert.equal(r.ok, false);
        assert.match(r.message, /200/);
    });
});

describe('validatePromoSlideInput — link types', () => {
    const base = { image: 'https://cdn.example.com/a.jpg' };

    it('none: clears link_target', () => {
        const r = validatePromoSlideInput({
            ...base,
            linkType: 'none',
            linkTarget: '/should-ignore'
        });
        assert.equal(r.ok, true);
        assert.equal(r.value.linkType, 'none');
        assert.equal(r.value.linkTarget, null);
    });

    it('page: requires a safe internal path', () => {
        assert.equal(
            validatePromoSlideInput({ ...base, linkType: 'page', linkTarget: '/product/abc' }).ok,
            true
        );
        assert.equal(
            validatePromoSlideInput({ ...base, link_type: 'page', link_target: '//' }).ok,
            false
        );
        assert.equal(
            validatePromoSlideInput({
                ...base,
                linkType: 'page',
                linkTarget: 'https://evil.com'
            }).ok,
            false
        );
        assert.equal(
            validatePromoSlideInput({
                ...base,
                linkType: 'page',
                linkTarget: '/path with space'
            }).ok,
            false
        );
        assert.equal(
            validatePromoSlideInput({ ...base, linkType: 'page', linkTarget: 'no-slash' }).ok,
            false
        );
    });

    it('section: requires a home-section key', () => {
        assert.equal(
            validatePromoSlideInput({ ...base, linkType: 'section', linkTarget: 'faq' }).ok,
            true
        );
        assert.equal(
            validatePromoSlideInput({
                ...base,
                linkType: 'section',
                linkTarget: 'Bad Key!'
            }).ok,
            false
        );
        assert.equal(
            validatePromoSlideInput({
                ...base,
                linkType: 'section',
                linkTarget: 'a'.repeat(41)
            }).ok,
            false
        );
    });

    it('external: http(s) only; rejects javascript/data/mailto', () => {
        assert.equal(
            validatePromoSlideInput({
                ...base,
                linkType: 'external',
                linkTarget: 'https://example.com/x'
            }).ok,
            true
        );
        assert.equal(
            validatePromoSlideInput({
                ...base,
                linkType: 'external',
                linkTarget: 'http://example.com'
            }).ok,
            true
        );

        for (const bad of [
            'javascript:alert(1)',
            'data:text/html,hi',
            'mailto:a@b.com',
            'ftp://files.example.com',
            'not-a-url'
        ]) {
            const r = validatePromoSlideInput({
                ...base,
                linkType: 'external',
                linkTarget: bad
            });
            assert.equal(r.ok, false, `expected reject for ${bad}`);
        }
    });
});

describe('validateReorderIds / buildSortOrderMap', () => {
    it('accepts a full permutation and builds sort map', () => {
        const r = validateReorderIds([3, 1, 2], [1, 2, 3]);
        assert.equal(r.ok, true);
        assert.deepEqual(r.ids, [3, 1, 2]);
        const map = buildSortOrderMap(r.ids);
        assert.equal(map.get(3), 0);
        assert.equal(map.get(1), 1);
        assert.equal(map.get(2), 2);
    });

    it('rejects missing, duplicate, or unknown ids', () => {
        assert.equal(validateReorderIds([1, 2], [1, 2, 3]).ok, false);
        assert.equal(validateReorderIds([1, 1, 2], [1, 2]).ok, false);
        assert.equal(validateReorderIds([1, 9], [1, 2]).ok, false);
        assert.equal(validateReorderIds('nope', [1]).ok, false);
    });

    it('accepts empty reorder when there are no slides', () => {
        const r = validateReorderIds([], []);
        assert.equal(r.ok, true);
        assert.deepEqual(r.ids, []);
    });
});
