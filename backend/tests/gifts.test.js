const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    requiredSlotCount,
    buildSlots,
    autoAssignIfSingleBook,
    resizeSelections,
    validateGiftSelectionsForCheckout
} = require('../src/utils/giftSlots');

describe('gift slot math', () => {
    it('computes required slots as quantity * gifts_per_unit', () => {
        assert.equal(requiredSlotCount(2, 1), 2);
        assert.equal(requiredSlotCount(2, 2), 4);
        assert.equal(requiredSlotCount(3, 2), 6);
        assert.equal(requiredSlotCount(0, 2), 0);
    });

    it('builds unit-ordered slots', () => {
        const slots = buildSlots({ quantity: 2, giftsPerUnit: 2 });
        assert.equal(slots.length, 4);
        assert.deepEqual(
            slots.map((s) => [s.slotIndex, s.unitIndex, s.localIndex]),
            [
                [0, 0, 0],
                [1, 0, 1],
                [2, 1, 0],
                [3, 1, 1]
            ]
        );
    });

    it('auto-assigns when only one book is offered', () => {
        const slots = buildSlots({ quantity: 2, giftsPerUnit: 1 });
        const map = autoAssignIfSingleBook(slots, [42]);
        assert.deepEqual(map, { 0: 42, 1: 42 });
        assert.equal(autoAssignIfSingleBook(slots, [1, 2]), null);
    });

    it('resizes selections when quantity drops', () => {
        const resized = resizeSelections({ 0: 1, 1: 2, 2: 3, 3: 4 }, 2);
        assert.deepEqual(resized, { '0': 1, '1': 2 });
    });
});

describe('checkout gift guard', () => {
    const promotions = [
        { productId: 10, giftsPerUnit: 1, bookIds: [101, 102] }
    ];

    it('allows missing selections (gifts are optional)', () => {
        const result = validateGiftSelectionsForCheckout({
            items: [{ id: 10, uniqueId: '10', quantity: 2 }],
            selections: [{ cartUniqueId: '10', slotIndex: 0, bookId: 101 }],
            promotionsByProduct: promotions
        });
        assert.equal(result.ok, true);
    });

    it('allows declining all gifts', () => {
        const result = validateGiftSelectionsForCheckout({
            items: [{ id: 10, uniqueId: '10', quantity: 2 }],
            selections: [],
            promotionsByProduct: promotions
        });
        assert.equal(result.ok, true);
    });

    it('accepts a complete valid selection set', () => {
        const result = validateGiftSelectionsForCheckout({
            items: [{ id: 10, uniqueId: '10', quantity: 2 }],
            selections: [
                { cartUniqueId: '10', slotIndex: 0, bookId: 101 },
                { cartUniqueId: '10', slotIndex: 1, bookId: 102 }
            ],
            promotionsByProduct: promotions
        });
        assert.equal(result.ok, true);
    });

    it('auto-passes single-book promotions without client selections', () => {
        const result = validateGiftSelectionsForCheckout({
            items: [{ id: 10, uniqueId: '10', quantity: 3 }],
            selections: [],
            promotionsByProduct: [{ productId: 10, giftsPerUnit: 1, bookIds: [99] }]
        });
        assert.equal(result.ok, true);
    });

    it('rejects a book not in the promotion', () => {
        const result = validateGiftSelectionsForCheckout({
            items: [{ id: 10, uniqueId: '10', quantity: 1 }],
            selections: [{ cartUniqueId: '10', slotIndex: 0, bookId: 999 }],
            promotionsByProduct: promotions
        });
        assert.equal(result.ok, false);
        assert.equal(result.error, 'invalid_gift_book');
    });
});

describe('admin email gift lines', () => {
    it('formats gift titles under order items in email HTML', () => {
        const EmailService = require('../src/services/emailService');
        // Instantiate without needing Resend — just call HTML generator
        const svc = Object.create(EmailService.prototype);
        const html = svc.generateOrderEmailHTML({
            formId: 'F1',
            status: 'paid',
            documentId: 'D1',
            paymentId: 'P1',
            amount: 100,
            currency: 'ILS',
            customerInfo: {
                name: 'Test',
                email: 't@example.com',
                phone: '050',
                street: 's',
                houseNumber: '1',
                city: 'c'
            },
            items: [
                {
                    name_he: 'המקדש',
                    quantity: 1,
                    price: 100,
                    gifts: [{ title: 'ספר א׳' }, { title: 'ספר ב׳' }]
                }
            ],
            purchaseTimestamp: '01.01.2026, 12:00:00'
        });
        assert.match(html, /מתנות/);
        assert.match(html, /ספר א׳/);
        assert.match(html, /ספר ב׳/);
    });
});
