const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const GreenInvoiceController = require('../src/controllers/greenInvoiceController');

const CATALOG = [
    { id: 1, name_he: 'מקדש', name_en: 'Temple', price: '200.00', discount_enabled: true, discount_type: 'percentage', discount_value: '15.00' },
    { id: 2, name_he: 'קופה', name_en: 'Box', price: '200.00', discount_enabled: true, discount_type: 'fixed', discount_value: '50.00' },
    { id: 3, name_he: 'פמוט', name_en: 'Candle', price: '80.00', discount_enabled: false, discount_type: 'percentage', discount_value: '10.00' }
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

describe('getPaymentForm server-side pricing', () => {
    let controller;
    let sentInvoice;

    beforeEach(() => {
        controller = new GreenInvoiceController();
        sentInvoice = null;
        controller.databaseController = {
            getAllProducts: async () => CATALOG,
            getActiveGiftPromotionsSummary: async () => [],
            getCouponByCode: async () => null
        };
        controller.greenInvoiceService = {
            pluginId: 'test',
            getPaymentForm: async (req) => {
                sentInvoice = req;
                return { url: 'https://pay.example/form/abc', formId: 'abc' };
            }
        };
    });

    it('charges discounted catalog prices and records regular price', async () => {
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
        assert.deepEqual(custom.items.map((i) => [i.price, i.regular_price]), [[170, 200], [150, 200], [80, undefined]]);
        assert.equal(custom.amount, 570);
    });

    it('rejects a client that sends the regular (undiscounted) or tampered price', async () => {
        for (const price of [200, 1]) {
            const res = mockRes();
            await controller.getPaymentForm({
                body: {
                    items: [{ id: 1, quantity: 1, price }],
                    totalAmount: price,
                    couponDiscount: 0,
                    deliveryFee: 0,
                    customerInfo: CUSTOMER
                }
            }, res);
            assert.equal(res.statusCode, 409);
            assert.equal(res.body.error, 'prices_changed');
            assert.equal(sentInvoice, null);
        }
    });

    it('includes delivery fee in the server-computed total', async () => {
        const res = mockRes();
        await controller.getPaymentForm({
            body: {
                items: [{ id: 3, quantity: 1, price: 80 }],
                totalAmount: 115,
                couponDiscount: 0,
                deliveryFee: 35,
                customerInfo: CUSTOMER
            }
        }, res);
        assert.equal(res.statusCode, 200, JSON.stringify(res.body));
        assert.equal(sentInvoice.amount, 115);
    });
});
