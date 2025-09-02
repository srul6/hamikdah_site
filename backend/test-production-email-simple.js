require('dotenv').config();
const axios = require('axios');

async function testProductionEmailSimple() {
    console.log('🧪 Testing Production Email Service (Simple)...\n');

    // Check environment variables
    console.log('📋 Environment Variables Check:');
    console.log('BACKEND_URL:', process.env.BACKEND_URL || '❌ NOT SET');
    console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL ? '✅ SET' : '❌ NOT SET');
    console.log('ADMIN_EMAIL_PASSWORD:', process.env.ADMIN_EMAIL_PASSWORD ? '✅ SET (' + process.env.ADMIN_EMAIL_PASSWORD.length + ' chars)' : '❌ NOT SET');
    console.log('');

    if (!process.env.BACKEND_URL) {
        console.log('❌ BACKEND_URL not set - cannot test production email');
        return;
    }

    // Test with minimal data that should trigger email
    const testData = {
        formId: 'email-simple-test-' + Date.now(),
        status: 'completed',
        amount: 50,
        currency: 'ILS',
        customerInfo: {
            name: 'Simple Test',
            email: 'simple@test.com'
        },
        items: []
    };

    console.log('📦 Test Data:', JSON.stringify(testData, null, 2));
    console.log('');

    try {
        // Send webhook to production backend
        console.log('📤 Sending simple webhook to production...');
        const webhookUrl = `${process.env.BACKEND_URL}/api/greeninvoice/webhook`;
        console.log('Webhook URL:', webhookUrl);

        const response = await axios.post(webhookUrl, testData, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Email-Simple-Test/1.0'
            },
            timeout: 30000
        });

        console.log('✅ Webhook sent successfully!');
        console.log('Response:', response.data);

        // Wait for processing
        console.log('⏳ Waiting 10 seconds for email processing...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Check if order was stored
        console.log('🔍 Checking if order was stored...');
        try {
            const ordersResponse = await axios.get(`${process.env.BACKEND_URL}/api/orders`);
            console.log('Total orders on Render:', ordersResponse.data.totalOrders);

            const newOrder = ordersResponse.data.orders.find(order => order.formId === testData.formId);
            if (newOrder) {
                console.log('✅ Order found on Render!');
                console.log('Order details:', JSON.stringify(newOrder, null, 2));

                // Check if email was sent
                console.log('📧 Email should have been sent for this order');
                console.log('💡 Check your email inbox for the notification');
                console.log('📧 Subject should be: New Order COMPLETED - Form ID: ' + testData.formId);
            } else {
                console.log('❌ Order not found on Render');
            }
        } catch (error) {
            console.log('❌ Failed to check orders:', error.message);
        }

    } catch (error) {
        console.error('❌ Simple email test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    console.log('');
    console.log('🔍 Simple Email Test Complete');
}

// Run the test
testProductionEmailSimple().catch(console.error);
