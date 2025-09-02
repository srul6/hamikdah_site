const express = require('express');
const router = express.Router();

// Store orders in memory (in production, you'd use a database)
let orders = [];

// POST endpoint to receive order data from webhook
router.post('/', (req, res) => {
    try {
        console.log('=== Order received from webhook ===');
        console.log('Order data:', JSON.stringify(req.body, null, 2));

        const orderData = req.body;

        // Add timestamp if not present
        if (!orderData.receivedAt) {
            orderData.receivedAt = new Date().toISOString();
        }

        // Store the order
        orders.push(orderData);

        console.log(`Order stored successfully. Total orders: ${orders.length}`);

        res.json({
            success: true,
            message: 'Order received and stored successfully',
            orderId: orderData.formId,
            totalOrders: orders.length
        });

    } catch (error) {
        console.error('Error processing order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process order',
            message: error.message
        });
    }
});

// GET endpoint to retrieve all orders
router.get('/', (req, res) => {
    try {
        console.log('Retrieving all orders...');

        res.json({
            success: true,
            orders: orders,
            totalOrders: orders.length
        });

    } catch (error) {
        console.error('Error retrieving orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve orders',
            message: error.message
        });
    }
});

// GET endpoint to retrieve a specific order by formId
router.get('/:formId', (req, res) => {
    try {
        const { formId } = req.params;
        console.log(`Retrieving order with formId: ${formId}`);

        const order = orders.find(o => o.formId === formId);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
                message: `No order found with formId: ${formId}`
            });
        }

        res.json({
            success: true,
            order: order
        });

    } catch (error) {
        console.error('Error retrieving order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve order',
            message: error.message
        });
    }
});

// DELETE endpoint to clear all orders (for testing)
router.delete('/', (req, res) => {
    try {
        console.log('Clearing all orders...');

        const orderCount = orders.length;
        orders = [];

        res.json({
            success: true,
            message: `Cleared ${orderCount} orders`
        });

    } catch (error) {
        console.error('Error clearing orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear orders',
            message: error.message
        });
    }
});

module.exports = router;
