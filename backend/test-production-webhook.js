require('dotenv').config();
const axios = require('axios');

async function testProductionWebhook() {
    console.log('🧪 Testing Production Webhook Flow...\n');
    
    // Check environment variables
    console.log('📋 Environment Variables Check:');
    console.log('BACKEND_URL:', process.env.BACKEND_URL || '❌ NOT SET');
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '❌ NOT SET');
    console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL ? '✅ SET' : '❌ NOT SET');
    console.log('ADMIN_EMAIL_PASSWORD:', process.env.ADMIN_EMAIL_PASSWORD ? '✅ SET (' + process.env.ADMIN_EMAIL_PASSWORD.length + ' chars)' : '❌ NOT SET');
    console.log('');

    if (!process.env.BACKEND_URL) {
        console.log('❌ BACKEND_URL not set - cannot test webhook');
        return;
    }

    // Simulate the exact webhook data that Green Invoice sends
    const webhookData = {
        formId: 'test-form-' + Date.now(),
        status: 'completed',
        documentId: 'doc-' + Date.now(),
        paymentId: 'pay-' + Date.now(),
        amount: 150.00,
        currency: 'ILS',
        customerInfo: {
            name: 'ישראל מנור',
            email: 'test@example.com',
            phone: '050-1234567',
            street: 'רחוב הרצל',
            houseNumber: '123',
            apartmentNumber: '45',
            floor: '3',
            city: 'תל אביב'
        },
        items: [
            {
                name_he: 'ספר תורה',
                name_en: 'Torah Book',
                quantity: 1,
                price: 150.00
            }
        ],
        custom: JSON.stringify({
            orderId: Date.now(),
            customerId: 'test@example.com',
            items: '1',
            dedication: 'לזכות המשפחה'
        })
    };

    console.log('📦 Webhook Data to Send:', JSON.stringify(webhookData, null, 2));
    console.log('');

    try {
        // Send webhook to production backend
        console.log('📤 Sending webhook to production backend...');
        const webhookUrl = `${process.env.BACKEND_URL}/api/greeninvoice/webhook`;
        console.log('Webhook URL:', webhookUrl);
        
        const response = await axios.post(webhookUrl, webhookData, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'GreenInvoice-Webhook/1.0'
            },
            timeout: 30000
        });

        console.log('✅ Webhook sent successfully!');
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        
        // Wait a moment for processing
        console.log('⏳ Waiting 3 seconds for webhook processing...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if order was stored on Render
        console.log('🔍 Checking if order was stored on Render...');
        try {
            const ordersResponse = await axios.get(`${process.env.BACKEND_URL}/api/orders`);
            console.log('Orders on Render:', ordersResponse.data);
            
            const newOrder = ordersResponse.data.orders.find(order => order.formId === webhookData.formId);
            if (newOrder) {
                console.log('✅ Order found on Render!');
                console.log('Order details:', JSON.stringify(newOrder, null, 2));
            } else {
                console.log('❌ Order not found on Render');
            }
        } catch (error) {
            console.log('❌ Failed to check orders on Render:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Webhook test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    console.log('');
    console.log('🔍 Production Webhook Test Complete');
}

// Run the test
testProductionWebhook().catch(console.error);
