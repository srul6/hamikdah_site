const express = require('express');
const router = express.Router();
const { databaseController } = require('../config/database');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateOrderCreatePayload } = require('../utils/checkoutValidation');
const clientMessages = require('../utils/clientFacingMessages');

function requireAdmin(req, res, next) {
    if (!req.admin) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    if (req.admin.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: admin access required'
        });
    }
    next();
}

/** Server-to-server order creation (e.g. Green Invoice webhook → same backend). */
function requireInternalOrderSecret(req, res, next) {
    const expected = process.env.INTERNAL_API_SECRET;
    if (!expected || String(expected).trim() === '') {
        console.error('❌ INTERNAL_API_SECRET is not set; refusing POST /api/orders');
        return res.status(503).json({
            success: false,
            message: 'Service misconfigured'
        });
    }
    if (req.headers['x-internal-secret'] !== expected) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }
    next();
}

// POST — claim Google Ads conversion (public; auth is paid-status + atomic DB flag)
// Must be registered before generic /:id routes that expect admin auth for other methods.
router.post('/:orderId/mark-conversion-sent', async (req, res) => {
    try {
        const { orderId } = req.params;
        const result = await databaseController.markAdsConversionSent(orderId);

        if (result.notFound) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (result.unpaid) {
            return res.status(403).json({
                success: false,
                message: 'Order is not paid'
            });
        }

        if (result.alreadySent) {
            return res.json({
                success: true,
                alreadySent: true
            });
        }

        return res.json({
            success: true,
            alreadySent: false,
            value: result.value,
            currency: result.currency,
            transactionId: result.transactionId
        });
    } catch (error) {
        console.error('❌ Error marking ads conversion sent:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to mark conversion'
        });
    }
});

// GET endpoint to retrieve all orders (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        console.log('📋 Retrieving all orders from database...');
        const orders = await databaseController.getAllOrders();

        res.json({
            success: true,
            orders: orders,
            totalOrders: orders.length
        });

    } catch (error) {
        console.error('❌ Error retrieving orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve orders',
            message: 'Failed to retrieve orders'
        });
    }
});

// GET endpoint to retrieve a specific order by ID (admin only)
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 Retrieving order with ID: ${id}`);

        const order = await databaseController.getOrderById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
                message: `No order found with ID: ${id}`
            });
        }

        res.json({
            success: true,
            order: order
        });

    } catch (error) {
        console.error('❌ Error retrieving order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve order',
            message: 'Failed to retrieve order'
        });
    }
});

// POST endpoint to create a new order (webhook / internal — requires x-internal-secret)
router.post('/', requireInternalOrderSecret, async (req, res) => {
    try {
        console.log('📝 Creating new order...');
        const validated = validateOrderCreatePayload(req.body);
        if (!validated.ok) {
            console.warn('Order create validation failed:', validated.errors);
            return res.status(400).json({
                success: false,
                message: clientMessages.ORDER_REJECTED
            });
        }

        const newOrder = await databaseController.createOrder(validated.orderData);

        res.json({
            success: true,
            message: 'Order created successfully',
            order: newOrder
        });

    } catch (error) {
        console.error('❌ Error creating order:', error);
        res.status(500).json({
            success: false,
            message: clientMessages.ORDER_REJECTED
        });
    }
});

// PUT endpoint to update order status (admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📝 Updating order ${id}...`);

        const updatedOrder = await databaseController.updateOrder(id, req.body);

        res.json({
            success: true,
            message: 'Order updated successfully',
            order: updatedOrder
        });

    } catch (error) {
        console.error('❌ Error updating order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update order',
            message: error.message
        });
    }
});

// DELETE endpoint to delete an order (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️  Deleting order ${id}...`);

        await databaseController.deleteOrder(id);

        res.json({
            success: true,
            message: 'Order deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete order',
            message: error.message
        });
    }
});

// PATCH endpoint to update shipped status (admin only)
router.patch('/:id/shipped', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { isShipped } = req.body;

        console.log(`📦 Updating shipped status for order ${id} to: ${isShipped}`);

        const updatedOrder = await databaseController.updateOrderShippedStatus(id, isShipped);

        res.json({
            success: true,
            message: `Order ${isShipped ? 'marked as shipped' : 'marked as not shipped'}`,
            order: updatedOrder
        });

    } catch (error) {
        console.error('❌ Error updating shipped status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update shipped status',
            message: error.message
        });
    }
});

module.exports = router;
