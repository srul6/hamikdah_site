const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const {
    allocateBundleUnitPrice,
    validateBundleSelection,
    priceAndExpandBundleLine,
    priceMixedCheckoutItems,
    checkAggregatedStock,
    buildGreenInvoiceIncome,
    incomeMerchandiseSubtotal,
    groupOrderItemsForDisplay,
    summarizeItemsForPurchase,
    toAgorot
} = require('../src/utils/bundleCheckout');
const { priceCheckoutItems } = require('../src/utils/productPricing');
const { isNewsletterCoupon, BUNDLE_COUPON_REJECT_HE } = require('../src/utils/couponApply');
const { validateCheckoutRequest } = require('../src/utils/checkoutValidation');
const { validateGiftSelectionsForCheckout } = require('../src/utils/giftSlots');
const GreenInvoiceController = require('../src/controllers/greenInvoiceController');

function makeProduct(id, { price, discount = null, colors = [], quantity = 10, name_he, name_en } = {}) {
    return {
        id,
        name_he: name_he || `מוצר${id}`,
        name_en: name_en || `Product${id}`,
        price: String(price),
        quantity,
        colors,
        discount_enabled: !!discount,
        discount_type: discount?.type || null,
        discount_value: discount?.value != null ? String(discount.value) : null
    };
}

function makeBundle(id, products, bundlePrice) {
    return {
        id,
        name_he: products.map((p) => p.name_he).join(' + '),
        name_en: products.map((p) => p.name_en).join(' + '),
        price: bundlePrice,
        is_active: true,
        isActive: true,
        items: products.map((p, i) => ({ position: i, product: p }))
    };
}

describe('allocateBundleUnitPrice', () => {
    it('sums exactly for 2 components with awkward prices', () => {
        const alloc = allocateBundleUnitPrice(199.9, [100, 120]);
        assert.equal(alloc.length, 2);
        assert.equal(toAgorot(alloc[0]) + toAgorot(alloc[1]), toAgorot(199.9));
    });

    it('sums exactly for 3 components including 333', () => {
        const alloc = allocateBundleUnitPrice(333, [100, 150, 200]);
        assert.equal(toAgorot(alloc[0]) + toAgorot(alloc[1]) + toAgorot(alloc[2]), toAgorot(333));
    });

    it('sums exactly for 4 components with remainder on last', () => {
        const alloc = allocateBundleUnitPrice(100, [10, 20, 30, 40]);
        const sum = alloc.reduce((s, p) => s + toAgorot(p), 0);
        assert.equal(sum, toAgorot(100));
        // Proportional: 10/100 * 100 = 10, etc.
        assert.equal(alloc[0], 10);
        assert.equal(alloc[3], 40);
    });

    it('handles a discounted component by using REGULAR prices only', () => {
        // regulars 200+100=300, bundle 199.90 — allocation ignores that A is on sale
        const alloc = allocateBundleUnitPrice(199.9, [200, 100]);
        assert.equal(toAgorot(alloc[0]) + toAgorot(alloc[1]), toAgorot(199.9));
        assert.ok(alloc[0] > alloc[1]);
    });

    it('acceptance allocation: shares follow regulars 200+100 even when A is −20%', () => {
        // Same proportions as list prices; must NOT use effective 160+100
        const alloc = allocateBundleUnitPrice(250, [200, 100]);
        assert.equal(toAgorot(alloc[0]) + toAgorot(alloc[1]), toAgorot(250));
        // 200/300 * 250 = 166.67; 100/300 * 250 = 83.33
        assert.equal(alloc[0], 166.67);
        assert.equal(alloc[1], 83.33);
    });
});

describe('validateBundleSelection', () => {
    const red = { name: 'Red', name_he: 'אדום', name_en: 'Red' };
    const blue = { name: 'Blue', name_he: 'כחול', name_en: 'Blue' };
    const p1 = makeProduct(1, { price: 100, colors: [red, blue] });
    const p2 = makeProduct(2, { price: 80, colors: [] });
    const bundle = makeBundle(7, [p1, p2], 150);

    it('accepts valid selection', () => {
        const r = validateBundleSelection(bundle, [
            { productId: 1, colorId: 'Red' },
            { productId: 2, colorId: null }
        ]);
        assert.equal(r.ok, true);
    });

    it('rejects missing product', () => {
        const r = validateBundleSelection(bundle, [{ productId: 1, colorId: 'Red' }]);
        assert.equal(r.ok, false);
        assert.equal(r.error, 'bundle_selection_invalid');
    });

    it('rejects extra product', () => {
        const r = validateBundleSelection(bundle, [
            { productId: 1, colorId: 'Red' },
            { productId: 2, colorId: null },
            { productId: 3, colorId: null }
        ]);
        assert.equal(r.ok, false);
    });

    it('rejects duplicate product', () => {
        const r = validateBundleSelection(bundle, [
            { productId: 1, colorId: 'Red' },
            { productId: 1, colorId: 'Blue' }
        ]);
        assert.equal(r.ok, false);
    });

    it('rejects invalid colorId', () => {
        const r = validateBundleSelection(bundle, [
            { productId: 1, colorId: 'Green' },
            { productId: 2, colorId: null }
        ]);
        assert.equal(r.ok, false);
    });

    it('rejects null color when product has colors', () => {
        const r = validateBundleSelection(bundle, [
            { productId: 1, colorId: null },
            { productId: 2, colorId: null }
        ]);
        assert.equal(r.ok, false);
    });

    it('rejects color when product has no colors', () => {
        const r = validateBundleSelection(bundle, [
            { productId: 1, colorId: 'Red' },
            { productId: 2, colorId: 'Nope' }
        ]);
        assert.equal(r.ok, false);
    });
});

describe('priceAndExpandBundleLine', () => {
    const p1 = makeProduct(1, { price: 200, discount: { type: 'percentage', value: 10 } });
    const p2 = makeProduct(2, { price: 100 });
    const bundle = makeBundle(5, [p1, p2], 250);

    it('rejects client price mismatch', () => {
        const r = priceAndExpandBundleLine(
            {
                type: 'bundle',
                bundleId: 5,
                quantity: 1,
                price: 200,
                uniqueId: 'bundle-5-1:none_2:none',
                selection: [
                    { productId: 1, colorId: null },
                    { productId: 2, colorId: null }
                ]
            },
            bundle
        );
        assert.equal(r.ok, false);
        assert.equal(r.error, 'price_changed');
    });

    it('rejects inactive bundle', () => {
        const inactive = { ...bundle, is_active: false, isActive: false };
        const r = priceAndExpandBundleLine(
            {
                type: 'bundle',
                bundleId: 5,
                quantity: 1,
                price: 250,
                uniqueId: 'x',
                selection: [
                    { productId: 1, colorId: null },
                    { productId: 2, colorId: null }
                ]
            },
            inactive
        );
        assert.equal(r.ok, false);
        assert.equal(r.error, 'bundle_unavailable');
        assert.match(r.message, /אינו זמין/);
    });

    it('expands quantity > 1 with allocated prices summing to bundle unit', () => {
        const r = priceAndExpandBundleLine(
            {
                type: 'bundle',
                bundleId: 5,
                quantity: 2,
                price: 250,
                uniqueId: 'bundle-5-row',
                selection: [
                    { productId: 1, colorId: null },
                    { productId: 2, colorId: null }
                ]
            },
            bundle
        );
        assert.equal(r.ok, true);
        assert.equal(r.lines.length, 2);
        assert.equal(r.lines[0].quantity, 2);
        assert.equal(r.lines[0].bundleUnitPrice, 250);
        assert.equal(
            toAgorot(r.lines[0].price) + toAgorot(r.lines[1].price),
            toAgorot(250)
        );
        const lineTotal =
            toAgorot(r.lines[0].price) * 2 + toAgorot(r.lines[1].price) * 2;
        assert.equal(lineTotal, toAgorot(250) * 2);
    });

    it('stores regular_price from list price and allocates by regulars when a component is discounted', () => {
        const a = makeProduct(1, {
            price: 200,
            discount: { type: 'percentage', value: 20 },
            name_he: 'א',
            name_en: 'A'
        });
        const b = makeProduct(2, { price: 100, name_he: 'ב', name_en: 'B' });
        const discountedBundle = makeBundle(11, [a, b], 250);
        const r = priceAndExpandBundleLine(
            {
                type: 'bundle',
                bundleId: 11,
                quantity: 1,
                price: 250,
                uniqueId: 'bundle-11-row',
                selection: [
                    { productId: 1, colorId: null },
                    { productId: 2, colorId: null }
                ]
            },
            discountedBundle
        );
        assert.equal(r.ok, true);
        assert.equal(r.regularPrice, 300);
        assert.equal(r.unitPrice, 250);
        assert.equal(r.lines[0].regular_price, 200); // NOT 160
        assert.equal(r.lines[1].regular_price, 100);
        assert.equal(r.lines[0].bundleUnitRegularPrice, 300);
        assert.equal(toAgorot(r.lines[0].price) + toAgorot(r.lines[1].price), toAgorot(250));
        assert.equal(r.lines[0].price, 166.67);
        assert.equal(r.lines[1].price, 83.33);
    });
});

describe('aggregated stock check', () => {
    it('rejects when bundle + standalone exceed stock', () => {
        const catalog = [
            makeProduct(1, { price: 100, quantity: 2 }),
            makeProduct(2, { price: 80, quantity: 10 })
        ];
        const storageItems = [
            { id: 1, quantity: 1, price: 50 }, // standalone
            { id: 1, quantity: 2, price: 40, bundleRowKey: 'b1' }, // bundle needs 2 more of product 1
            { id: 2, quantity: 2, price: 30, bundleRowKey: 'b1' }
        ];
        const stock = checkAggregatedStock(storageItems, catalog);
        assert.equal(stock.ok, false);
        assert.equal(stock.error, 'insufficient_stock');
        assert.match(stock.message, /מלאי/);
    });

    it('passes when stock is sufficient', () => {
        const catalog = [
            makeProduct(1, { price: 100, quantity: 5 }),
            makeProduct(2, { price: 80, quantity: 10 })
        ];
        const storageItems = [
            { id: 1, quantity: 1, price: 50 },
            { id: 1, quantity: 2, price: 40, bundleRowKey: 'b1' },
            { id: 2, quantity: 2, price: 30, bundleRowKey: 'b1' }
        ];
        assert.equal(checkAggregatedStock(storageItems, catalog).ok, true);
    });
});

describe('coupon rule for bundles', () => {
    it('isNewsletterCoupon uses subscriberId or WELCOME prefix', () => {
        assert.equal(isNewsletterCoupon({ code: 'SAVE10', subscriberId: 42 }), true);
        assert.equal(isNewsletterCoupon({ code: 'WELCOMEABCD1234', subscriberId: null }), true);
        assert.equal(isNewsletterCoupon({ code: 'SUMMER20', subscriberId: null }), false);
        assert.equal(isNewsletterCoupon({ code: 'SAVE5', discount: 5 }), false);
    });

    it('exposes Hebrew reject message', () => {
        assert.equal(BUNDLE_COUPON_REJECT_HE, 'קופון זה אינו תקף על באנדלים');
    });
});

describe('gift exclusion for bundles', () => {
    it('bundle-only cart does not require/accept gifts for component products', () => {
        const promos = [{ productId: 1, giftsPerUnit: 1, bookIds: [99], books: [{ id: 99, title: 'Book' }] }];
        // Expanded storage would have id:1 but gift validation gets productItems only (empty)
        const check = validateGiftSelectionsForCheckout({
            items: [], // no standalone products
            selections: [{ cartUniqueId: 'bundle-1', productId: 1, slotIndex: 0, bookId: 99 }],
            promotionsByProduct: promos
        });
        assert.equal(check.ok, true);
    });

    it('standalone gift-eligible product still validates', () => {
        const promos = [{ productId: 1, giftsPerUnit: 1, bookIds: [99], books: [{ id: 99, title: 'Book' }] }];
        const check = validateGiftSelectionsForCheckout({
            items: [{ id: 1, uniqueId: 1, quantity: 1 }],
            selections: [{ cartUniqueId: '1', productId: 1, slotIndex: 0, bookId: 99 }],
            promotionsByProduct: promos
        });
        assert.equal(check.ok, true);
    });
});

describe('income builder', () => {
    it('merchandise income equals server subtotal for mixed cart', () => {
        const items = [
            { id: 3, quantity: 1, price: 80, name_he: 'פמוט' },
            {
                id: 1,
                quantity: 2,
                price: 100,
                bundleRowKey: 'b-row',
                bundleId: 7,
                bundleName_he: 'א + ב',
                bundleUnitPrice: 199.9,
                bundleUnitRegularPrice: 300
            },
            {
                id: 2,
                quantity: 2,
                price: 99.9,
                bundleRowKey: 'b-row',
                bundleId: 7,
                bundleName_he: 'א + ב',
                bundleUnitPrice: 199.9,
                bundleUnitRegularPrice: 300
            }
        ];
        const income = buildGreenInvoiceIncome(items, { deliveryFee: 0, discount: 0 });
        const merch = incomeMerchandiseSubtotal(income);
        // standalone 80 + bundle 199.9 * 2
        assert.equal(toAgorot(merch), toAgorot(80 + 199.9 * 2));
        assert.equal(income.length, 2); // one product + one bundle line
    });
});

describe('group / summarize display', () => {
    it('groups two color variants of same bundle as two rows', () => {
        const items = [
            {
                id: 1,
                quantity: 1,
                price: 50,
                bundleRowKey: 'bundle-7-1:Red_2:none',
                bundleId: 7,
                bundleName_he: 'א + ב',
                bundleUnitPrice: 150,
                name_he: 'א (אדום)'
            },
            {
                id: 2,
                quantity: 1,
                price: 100,
                bundleRowKey: 'bundle-7-1:Red_2:none',
                bundleId: 7,
                bundleName_he: 'א + ב',
                bundleUnitPrice: 150,
                name_he: 'ב'
            },
            {
                id: 1,
                quantity: 1,
                price: 50,
                bundleRowKey: 'bundle-7-1:Blue_2:none',
                bundleId: 7,
                bundleName_he: 'א + ב',
                bundleUnitPrice: 150,
                name_he: 'א (כחול)'
            },
            {
                id: 2,
                quantity: 1,
                price: 100,
                bundleRowKey: 'bundle-7-1:Blue_2:none',
                bundleId: 7,
                bundleName_he: 'א + ב',
                bundleUnitPrice: 150,
                name_he: 'ב'
            }
        ];
        const grouped = groupOrderItemsForDisplay(items);
        assert.equal(grouped.length, 2);
        assert.equal(grouped[0].kind, 'bundle');
        assert.equal(grouped[1].kind, 'bundle');
        const summary = summarizeItemsForPurchase(items);
        assert.equal(summary.length, 2);
        assert.equal(summary[0].id, 'bundle-7');
    });
});

describe('checkoutValidation bundle lines', () => {
    it('accepts bundle type and rejects unknown type', () => {
        const ok = validateCheckoutRequest({
            items: [
                {
                    type: 'bundle',
                    bundleId: 1,
                    quantity: 1,
                    price: 100,
                    uniqueId: 'bundle-1-x',
                    selection: [{ productId: 1, colorId: null }]
                }
            ],
            totalAmount: 100,
            customerInfo: { name: 'Test', email: 'a@b.com', phone: '0501234567' },
            couponDiscount: 0,
            deliveryFee: 0
        });
        assert.equal(ok.ok, true);
        assert.equal(ok.items[0].type, 'bundle');

        const bad = validateCheckoutRequest({
            items: [{ type: 'mystery', id: 1, quantity: 1, price: 10 }],
            totalAmount: 10,
            customerInfo: { name: 'Test', email: 'a@b.com', phone: '0501234567' },
            couponDiscount: 0,
            deliveryFee: 0
        });
        assert.equal(bad.ok, false);
    });
});

describe('getPaymentForm product-only regression + bundles', () => {
    const CATALOG = [
        makeProduct(1, { price: 200, discount: { type: 'percentage', value: 15 }, name_he: 'מקדש', name_en: 'Temple' }),
        makeProduct(2, { price: 200, discount: { type: 'fixed', value: 50 }, name_he: 'קופה', name_en: 'Box' }),
        makeProduct(3, { price: 80, name_he: 'פמוט', name_en: 'Candle', quantity: 5 })
    ];
    const CUSTOMER = { name: 'Test User', email: 'test@example.com', phone: '0501234567', city: 'Jerusalem' };

    function mockRes() {
        return {
            statusCode: 200,
            body: null,
            status(code) { this.statusCode = code; return this; },
            json(payload) { this.body = payload; return this; }
        };
    }

    let controller;
    let sentInvoice;

    beforeEach(() => {
        controller = new GreenInvoiceController();
        sentInvoice = null;
        controller.databaseController = {
            getAllProducts: async () => CATALOG.map((p) => ({ ...p })),
            getActiveGiftPromotionsSummary: async () => [],
            getCouponByCode: async (code) => {
                if (String(code).toUpperCase().startsWith('WELCOME')) {
                    return {
                        code: code.toUpperCase(),
                        discount: 5,
                        type: 'percentage',
                        minAmount: 0,
                        maxDiscount: 999,
                        validFrom: '2020-01-01',
                        validUntil: '2099-01-01',
                        isActive: true,
                        usageCount: 0,
                        maxUsage: 1,
                        subscriberId: 1
                    };
                }
                if (String(code).toUpperCase() === 'SUMMER10') {
                    return {
                        code: 'SUMMER10',
                        discount: 10,
                        type: 'percentage',
                        minAmount: 0,
                        maxDiscount: 999,
                        validFrom: '2020-01-01',
                        validUntil: '2099-01-01',
                        isActive: true,
                        usageCount: 0,
                        maxUsage: 100,
                        subscriberId: null
                    };
                }
                return null;
            }
        };
        controller.greenInvoiceService = {
            pluginId: 'test',
            getPaymentForm: async (req) => {
                sentInvoice = req;
                return { url: 'https://pay.example/form/abc', formId: 'abc' };
            }
        };
    });

    it('product-only order matches prior income/custom shape', async () => {
        const res = mockRes();
        await controller.getPaymentForm({
            body: {
                items: [
                    { id: 1, quantity: 2, price: 170 },
                    { id: 2, quantity: 1, price: 150 },
                    { id: 3, quantity: 1, price: 80 }
                ],
                totalAmount: 570,
                couponDiscount: 0,
                deliveryFee: 0,
                customerInfo: CUSTOMER
            }
        }, res);

        assert.equal(res.statusCode, 200, JSON.stringify(res.body));
        assert.equal(sentInvoice.amount, 570);
        const incomeSum = sentInvoice.income.reduce((s, l) => s + l.price * l.quantity, 0);
        assert.equal(incomeSum, 570);
        const custom = JSON.parse(sentInvoice.custom);
        assert.deepEqual(
            custom.items.map((i) => [i.price, i.regular_price]),
            [[170, 200], [150, 200], [80, undefined]]
        );
    });

    it('rejects non-newsletter coupon when cart has a bundle', async () => {
        const p1 = CATALOG[0];
        const p2 = CATALOG[2];
        const bundle = makeBundle(9, [p1, p2], 200);
        // Stub loadBundleById via requiring and monkeypatch is hard; inject via priceMixed path
        // by putting bundle into a fake: override getPaymentForm's load by patching module.
        const bundleController = require('../src/controllers/bundleController');
        const original = bundleController.loadBundleById;
        bundleController.loadBundleById = async (id) => (Number(id) === 9 ? bundle : null);

        try {
            const res = mockRes();
            await controller.getPaymentForm({
                body: {
                    items: [
                        {
                            type: 'bundle',
                            bundleId: 9,
                            quantity: 1,
                            price: 200,
                            uniqueId: 'bundle-9-1:none_3:none',
                            selection: [
                                { productId: 1, colorId: null },
                                { productId: 3, colorId: null }
                            ]
                        }
                    ],
                    totalAmount: 180,
                    couponDiscount: 20,
                    deliveryFee: 0,
                    couponCode: 'SUMMER10',
                    customerInfo: CUSTOMER
                }
            }, res);
            assert.equal(res.statusCode, 400);
            assert.equal(res.body.error, 'coupon_not_valid_for_bundles');
            assert.equal(res.body.message, BUNDLE_COUPON_REJECT_HE);
        } finally {
            bundleController.loadBundleById = original;
        }
    });

    it('allows newsletter coupon with a bundle', async () => {
        const p1 = CATALOG[0];
        const p2 = CATALOG[2];
        const bundle = makeBundle(9, [p1, p2], 200);
        const bundleController = require('../src/controllers/bundleController');
        const original = bundleController.loadBundleById;
        bundleController.loadBundleById = async (id) => (Number(id) === 9 ? bundle : null);

        try {
            const res = mockRes();
            // 5% of 200 = 10
            await controller.getPaymentForm({
                body: {
                    items: [
                        {
                            type: 'bundle',
                            bundleId: 9,
                            quantity: 1,
                            price: 200,
                            uniqueId: 'bundle-9-1:none_3:none',
                            selection: [
                                { productId: 1, colorId: null },
                                { productId: 3, colorId: null }
                            ]
                        }
                    ],
                    totalAmount: 190,
                    couponDiscount: 10,
                    deliveryFee: 0,
                    couponCode: 'WELCOMETEST1234',
                    customerInfo: CUSTOMER
                }
            }, res);
            assert.equal(res.statusCode, 200, JSON.stringify(res.body));
            assert.equal(sentInvoice.amount, 190);
            const custom = JSON.parse(sentInvoice.custom);
            assert.equal(custom.items.length, 2); // expanded components
            assert.ok(custom.items.every((i) => i.bundleId === 9));
            const merch = incomeMerchandiseSubtotal(sentInvoice.income);
            assert.equal(toAgorot(merch), toAgorot(200));
        } finally {
            bundleController.loadBundleById = original;
        }
    });

    it('rejects insufficient stock for bundle + standalone of same product', async () => {
        const lowStock = CATALOG.map((p) =>
            p.id === 3 ? { ...p, quantity: 1 } : { ...p }
        );
        controller.databaseController.getAllProducts = async () => lowStock.map((p) => ({ ...p }));

        const p1 = lowStock[0];
        const p3 = lowStock[2];
        const bundle = makeBundle(9, [p1, p3], 200);
        const bundleController = require('../src/controllers/bundleController');
        const original = bundleController.loadBundleById;
        bundleController.loadBundleById = async (id) => (Number(id) === 9 ? bundle : null);

        try {
            const res = mockRes();
            await controller.getPaymentForm({
                body: {
                    items: [
                        { id: 3, quantity: 1, price: 80 },
                        {
                            type: 'bundle',
                            bundleId: 9,
                            quantity: 1,
                            price: 200,
                            uniqueId: 'bundle-9-x',
                            selection: [
                                { productId: 1, colorId: null },
                                { productId: 3, colorId: null }
                            ]
                        }
                    ],
                    totalAmount: 280,
                    couponDiscount: 0,
                    deliveryFee: 0,
                    customerInfo: CUSTOMER
                }
            }, res);
            assert.equal(res.statusCode, 400);
            assert.equal(res.body.error, 'insufficient_stock');
            assert.match(res.body.message, /מלאי/);
        } finally {
            bundleController.loadBundleById = original;
        }
    });
});

describe('priceMixedCheckoutItems integrity', () => {
    it('subtotal equals sum of standalone + bundle unit * qty', () => {
        const catalog = [
            makeProduct(1, { price: 100 }),
            makeProduct(2, { price: 100 }),
            makeProduct(3, { price: 80 })
        ];
        const bundle = makeBundle(1, [catalog[0], catalog[1]], 150);
        const bundlesById = new Map([[1, bundle]]);
        const result = priceMixedCheckoutItems(
            [
                { id: 3, quantity: 2, price: 80 },
                {
                    type: 'bundle',
                    bundleId: 1,
                    quantity: 2,
                    price: 150,
                    uniqueId: 'b1',
                    selection: [
                        { productId: 1, colorId: null },
                        { productId: 2, colorId: null }
                    ]
                }
            ],
            catalog,
            bundlesById,
            priceCheckoutItems
        );
        assert.equal(result.ok, true);
        assert.equal(toAgorot(result.subtotal), toAgorot(80 * 2 + 150 * 2));
        const stored = result.items.reduce(
            (s, i) => s + toAgorot(i.price) * i.quantity,
            0
        );
        assert.equal(stored, toAgorot(result.subtotal));
    });
});
