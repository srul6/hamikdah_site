const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    computeBundlePricing,
    validateBundleInput,
    buildBundleNames,
    PRICE_ABOVE_CURRENT_COMPONENTS_WARNING
} = require('../src/utils/bundlePricing');

describe('computeBundlePricing', () => {
    it('sums component regular (list) prices as regularPrice', () => {
        const r = computeBundlePricing(
            { price: 250 },
            [
                { price: 200, discount_enabled: false, quantity: 5 },
                { price: 100, discount_enabled: false, quantity: 3 }
            ]
        );
        assert.equal(r.regularPrice, 300);
        assert.equal(r.currentComponentsPrice, 300);
        assert.equal(r.finalPrice, 250);
        assert.equal(r.hasDiscount, true);
        assert.equal(r.discountAmount, 50);
        assert.equal(r.savingsPercent, 17);
        assert.equal(r.available, true);
        assert.equal(r.maxQuantity, 3);
    });

    it('ignores product discounts when summing regularPrice', () => {
        const r = computeBundlePricing(
            { price: 200 },
            [
                {
                    price: 200,
                    discount_enabled: true,
                    discount_type: 'percentage',
                    discount_value: 15,
                    quantity: 2
                },
                { price: 80, discount_enabled: false, quantity: 4 }
            ]
        );
        // List prices: 200 + 80 = 280 (NOT 170 + 80)
        assert.equal(r.regularPrice, 280);
        // Effective buy-separately: 170 + 80 = 250
        assert.equal(r.currentComponentsPrice, 250);
        assert.equal(r.finalPrice, 200);
        assert.equal(r.hasDiscount, true);
        assert.equal(r.discountAmount, 80);
        assert.equal(r.savingsPercent, 29);
    });

    it('acceptance: A regular 200 (−20% → 160) + B regular 100, bundle 250 → original 300', () => {
        const r = computeBundlePricing(
            { price: 250 },
            [
                {
                    price: 200,
                    discount_enabled: true,
                    discount_type: 'percentage',
                    discount_value: 20,
                    quantity: 5
                },
                { price: 100, discount_enabled: false, quantity: 5 }
            ]
        );
        assert.equal(r.regularPrice, 300); // NOT 260
        assert.equal(r.currentComponentsPrice, 260); // 160 + 100 (admin only)
        assert.equal(r.finalPrice, 250);
        assert.equal(r.hasDiscount, true);
        assert.equal(r.discountAmount, 50);
        assert.equal(r.savingsPercent, 17);
    });

    it('hasDiscount is false when bundle price equals or exceeds the regular sum', () => {
        const equal = computeBundlePricing(
            { price: 300 },
            [
                { price: 200, quantity: 1 },
                { price: 100, quantity: 1 }
            ]
        );
        assert.equal(equal.hasDiscount, false);
        assert.equal(equal.discountAmount, 0);
        assert.equal(equal.savingsPercent, 0);

        const higher = computeBundlePricing(
            { price: 350 },
            [
                { price: 200, quantity: 1 },
                { price: 100, quantity: 1 }
            ]
        );
        assert.equal(higher.hasDiscount, false);
    });

    it('available is false and maxQuantity is 0 when any component is out of stock', () => {
        const r = computeBundlePricing(
            { price: 100 },
            [
                { price: 80, quantity: 5 },
                { price: 50, quantity: 0 }
            ]
        );
        assert.equal(r.available, false);
        assert.equal(r.maxQuantity, 0);
    });

    it('available is false when the component list is empty', () => {
        const r = computeBundlePricing({ price: 100 }, []);
        assert.equal(r.available, false);
        assert.equal(r.maxQuantity, 0);
        assert.equal(r.regularPrice, 0);
        assert.equal(r.currentComponentsPrice, 0);
    });

    it('maxQuantity is the minimum component quantity when available', () => {
        const r = computeBundlePricing(
            { price: 90 },
            [
                { price: 50, quantity: 7 },
                { price: 50, quantity: 2 },
                { price: 40, quantity: 9 }
            ]
        );
        assert.equal(r.available, true);
        assert.equal(r.maxQuantity, 2);
    });
});

describe('validateBundleInput', () => {
    const products = [
        { id: 1, price: 200, name_he: 'א', name_en: 'A', quantity: 5 },
        { id: 2, price: 100, name_he: 'ב', name_en: 'B', quantity: 3 },
        { id: 3, price: 80, name_he: 'ג', name_en: 'C', quantity: 1 }
    ];

    const discountedProducts = [
        {
            id: 1,
            price: 200,
            discount_enabled: true,
            discount_type: 'percentage',
            discount_value: 15,
            quantity: 5
        },
        { id: 2, price: 100, discount_enabled: false, quantity: 3 }
    ];

    it('accepts a valid 2-product bundle cheaper than the regular sum', () => {
        const r = validateBundleInput({
            productIds: [1, 2],
            price: 250,
            image: 'https://cdn.example.com/x.png',
            componentProducts: products.filter((p) => p.id === 1 || p.id === 2)
        });
        assert.equal(r.ok, true);
        assert.equal(r.values.price, 250);
        assert.deepEqual(r.values.productIds, [1, 2]);
        assert.deepEqual(r.warnings, []);
    });

    it('validates strictly against the regular sum, not the discounted sum', () => {
        // regular sum = 300, discounted sum = 270
        // 280 is below regular → allowed, but >= discounted → warning
        const allowed = validateBundleInput({
            productIds: [1, 2],
            price: 280,
            componentProducts: discountedProducts
        });
        assert.equal(allowed.ok, true);
        assert.equal(allowed.values.regularPrice, 300);
        assert.equal(allowed.values.currentComponentsPrice, 270);
        assert.ok(allowed.warnings.includes(PRICE_ABOVE_CURRENT_COMPONENTS_WARNING));

        // 300 equals regular → rejected
        const rejected = validateBundleInput({
            productIds: [1, 2],
            price: 300,
            componentProducts: discountedProducts
        });
        assert.equal(rejected.ok, false);
        assert.match(rejected.error, /באנדל/);
    });

    it('acceptance validation: bundle 250 vs regular 300 (A −20%) is ok; no block vs current 260', () => {
        const products20 = [
            {
                id: 1,
                price: 200,
                discount_enabled: true,
                discount_type: 'percentage',
                discount_value: 20,
                quantity: 5
            },
            { id: 2, price: 100, discount_enabled: false, quantity: 5 }
        ];
        const r = validateBundleInput({
            productIds: [1, 2],
            price: 250,
            componentProducts: products20
        });
        assert.equal(r.ok, true);
        assert.equal(r.values.regularPrice, 300);
        assert.equal(r.values.currentComponentsPrice, 260);
        // 250 < 260 → no warning
        assert.deepEqual(r.warnings, []);

        const warn = validateBundleInput({
            productIds: [1, 2],
            price: 270,
            componentProducts: products20
        });
        assert.equal(warn.ok, true);
        assert.ok(warn.warnings.includes(PRICE_ABOVE_CURRENT_COMPONENTS_WARNING));
    });

    it('rejects fewer than 2 or more than 4 products', () => {
        assert.equal(
            validateBundleInput({
                productIds: [1],
                price: 50,
                componentProducts: [products[0]]
            }).ok,
            false
        );
        assert.equal(
            validateBundleInput({
                productIds: [1, 2, 3, 1],
                price: 100,
                componentProducts: products
            }).ok,
            false
        );
    });

    it('rejects duplicate product ids', () => {
        const r = validateBundleInput({
            productIds: [1, 1],
            price: 50,
            componentProducts: [products[0]]
        });
        assert.equal(r.ok, false);
    });

    it('rejects price that is not strictly below regularPrice', () => {
        const r = validateBundleInput({
            productIds: [1, 2],
            price: 300,
            componentProducts: products.filter((p) => p.id === 1 || p.id === 2)
        });
        assert.equal(r.ok, false);
    });

    it('rejects non-positive price', () => {
        assert.equal(
            validateBundleInput({
                productIds: [1, 2],
                price: 0,
                componentProducts: products.filter((p) => p.id === 1 || p.id === 2)
            }).ok,
            false
        );
    });
});

describe('buildBundleNames', () => {
    it('joins Hebrew and English names with " + "', () => {
        const names = buildBundleNames([
            { name_he: 'המקדש', name_en: 'The Temple' },
            { name_he: 'מיני מקדש', name_en: 'Mini Temple' }
        ]);
        assert.equal(names.name_he, 'המקדש + מיני מקדש');
        assert.equal(names.name_en, 'The Temple + Mini Temple');
    });
});
