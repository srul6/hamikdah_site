const express = require('express');
const router = express.Router();
const supabaseController = require('../controllers/supabaseController');

// GET endpoint to retrieve all orders
router.get('/', async (req, res) => {
    try {
        console.log('📋 Retrieving all orders from database...');
        const orders = await supabaseController.getAllOrders();

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
            message: error.message
        });
    }
});

// GET endpoint to retrieve a specific order by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 Retrieving order with ID: ${id}`);

        const order = await supabaseController.getOrderById(id);

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
            message: error.message
        });
    }
});

// POST endpoint to create a new order (usually called from webhook)
router.post('/', async (req, res) => {
    try {
        console.log('📝 Creating new order...');
        const orderData = req.body;

        const newOrder = await supabaseController.createOrder(orderData);

        res.json({
            success: true,
            message: 'Order created successfully',
            order: newOrder
        });

    } catch (error) {
        console.error('❌ Error creating order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create order',
            message: error.message
        });
    }
});

// PUT endpoint to update order status
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📝 Updating order ${id}...`);

        const updatedOrder = await supabaseController.updateOrder(id, req.body);

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

// DELETE endpoint to delete an order
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️  Deleting order ${id}...`);

        await supabaseController.deleteOrder(id);

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

module.exports = router;
