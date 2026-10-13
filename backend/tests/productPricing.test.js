const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    computeProductPricing,
    validateDiscountSettings,
    priceCheckoutItems
} = require('../src/utils/productPricing');

describe('computeProductPricing', () => {
    it('returns the regular price when there is no discount', () => {
        const p = computeProductPricing({ price: '200.00', discount_enabled: false });
        assert.equal(p.regularPrice, 200);
        assert.equal(p.finalPrice, 200);
        assert.equal(p.hasDiscount, false);
    });

    it('applies a percentage discount', () => {
        const p = computeProductPricing({ price: 200, discount_enabled: true, discount_type: 'percentage', discount_value: 15 });
        assert.equal(p.finalPrice, 170);
        assert.equal(p.discountAmount, 30);
        assert.equal(p.hasDiscount, true);
    });

    it('applies a fixed discount', () => {
        const p = computeProductPricing({ price: 200, discount_enabled: true, discount_type: 'fixed', discount_value: '50.00' });
        assert.equal(p.finalPrice, 150);
        assert.equal(p.hasDiscount, true);
    });

    it('rounds percentage discounts to agorot', () => {
        const p = computeProductPricing({ price: 99.9, discount_enabled: true, discount_type: 'percentage', discount_value: 15 });
        assert.equal(p.finalPrice, 84.91);
        assert.equal(p.discountAmount, 14.99);
    });

    it('never goes below zero', () => {
        assert.equal(
            computeProductPricing({ price: 40, discount_enabled: true, discount_type: 'fixed', discount_value: 500 }).finalPrice,
            0
        );
        assert.equal(
            computeProductPricing({ price: 40, discount_enabled: true, discount_type: 'percentage', discount_value: 250 }).finalPrice,
            0
        );
    });

    it('keeps the stored discount but ignores it while disabled', () => {
        const p = computeProductPricing({ price: 200, discount_enabled: false, discount_type: 'percentage', discount_value: 15 });
        assert.equal(p.finalPrice, 200);
        assert.equal(p.discountType, 'percentage');
        assert.equal(p.discountValue, 15);
    });

    it('handles zero price and invalid configurations safely', () => {
        assert.equal(computeProductPricing({ price: 0, discount_enabled: true, discount_type: 'fixed', discount_value: 10 }).finalPrice, 0);
        assert.equal(computeProductPricing({ price: null }).finalPrice, 0);
        assert.equal(computeProductPricing({ price: 100, discount_enabled: true, discount_type: 'bogus', discount_value: 10 }).finalPrice, 100);
        assert.equal(computeProductPricing({ price: 100, discount_enabled: true, discount_type: 'fixed', discount_value: -5 }).finalPrice, 100);
        assert.equal(computeProductPricing({ price: 100, discount_enabled: true, discount_type: 'fixed', discount_value: 'abc' }).finalPrice, 100);
        assert.equal(computeProductPricing(null).finalPrice, 0);
    });
});

describe('validateDiscountSettings', () => {
    it('accepts valid settings', () => {
        const r = validateDiscountSettings({ price: 200, discount_enabled: true, discount_type: 'percentage', discount_value: '15' });
        assert.equal(r.ok, true);
        assert.deepEqual(r.values, { discount_enabled: true, discount_type: 'percentage', discount_value: 15 });
    });

    it('rejects a fixed discount that reaches the regular price', () => {
        assert.equal(validateDiscountSettings({ price: 50, discount_enabled: true, discount_type: 'fixed', discount_value: 50 }).ok, false);
    });

    it('rejects percentage >= 100 and non-positive values', () => {
        assert.equal(validateDiscountSettings({ price: 50, discount_enabled: true, discount_type: 'percentage', discount_value: 100 }).ok, false);
        assert.equal(validateDiscountSettings({ price: 50, discount_enabled: true, discount_type: 'percentage', discount_value: 0 }).ok, false);
    });

    it('rejects a discount on a zero-price product', () => {
        assert.equal(validateDiscountSettings({ price: 0, discount_enabled: true, discount_type: 'fixed', discount_value: 5 }).ok, false);
    });

    it('allows saving disabled settings without a value', () => {
        assert.equal(validateDiscountSettings({ price: 0, discount_enabled: false, discount_type: null, discount_value: '' }).ok, true);
    });
});

describe('priceCheckoutItems', () => {
    const catalog = [
        { id: 1, price: '200.00', discount_enabled: true, discount_type: 'percentage', discount_value: '15.00' },
        { id: 2, price: '80.00', discount_enabled: false }
    ];

    it('re-prices from the catalog and computes the subtotal', () => {
        const r = priceCheckoutItems(
            [{ id: '1', quantity: 2, price: 170 }, { id: 2, quantity: 1, price: 80 }],
            catalog
        );
        assert.equal(r.ok, true);
        assert.equal(r.subtotal, 420);
        assert.equal(r.items[0].price, 170);
        assert.equal(r.items[0].regular_price, 200);
        assert.equal('regular_price' in r.items[1], false);
    });

    it('rejects stale or tampered client prices', () => {
        const r = priceCheckoutItems([{ id: 1, quantity: 1, price: 200 }], catalog);
        assert.equal(r.ok, false);
        assert.equal(r.error, 'price_changed');
        assert.equal(priceCheckoutItems([{ id: 1, quantity: 1, price: 1 }], catalog).ok, false);
    });

    it('does not apply the discount twice', () => {
        const r = priceCheckoutItems([{ id: 1, quantity: 1, price: 170 }], catalog);
        assert.equal(r.items[0].price, 170);
        assert.equal(priceCheckoutItems([{ id: 1, quantity: 1, price: 144.5 }], catalog).ok, false);
    });

    it('rejects unknown products', () => {
        assert.equal(priceCheckoutItems([{ id: 99, quantity: 1, price: 10 }], catalog).error, 'unknown_product');
    });
});
