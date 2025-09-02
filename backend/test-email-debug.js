require('dotenv').config();
const axios = require('axios');

async function testEmailDebug() {
    console.log('🔍 Email Service Debug Test...\n');

    // Check environment variables
    console.log('📋 Environment Variables Check:');
    console.log('BACKEND_URL:', process.env.BACKEND_URL || '❌ NOT SET');
    console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL ? '✅ SET (' + process.env.ADMIN_EMAIL.length + ' chars)' : '❌ NOT SET');
    console.log('ADMIN_EMAIL_PASSWORD:', process.env.ADMIN_EMAIL_PASSWORD ? '✅ SET (' + process.env.ADMIN_EMAIL_PASSWORD.length + ' chars)' : '❌ NOT SET');
    console.log('');

    if (!process.env.BACKEND_URL) {
        console.log('❌ BACKEND_URL not set - cannot test production email');
        return;
    }

    // Test 1: Direct email endpoint test
    console.log('🧪 Test 1: Direct Email Endpoint Test');
    try {
        const emailUrl = `${process.env.BACKEND_URL}/api/debug/email-test`;
        console.log('Testing URL:', emailUrl);

        const response = await axios.post(emailUrl, {
            formId: 'debug-direct-' + Date.now(),
            status: 'completed',
            amount: 100,
            currency: 'ILS',
            customerInfo: {
                name: 'Debug Direct',
                email: 'debug@direct.com'
            },
            items: []
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });

        console.log('✅ Direct email test response:', response.data);

    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log('ℹ️  Direct email endpoint not available (this is normal)');
        } else {
            console.log('❌ Direct email test failed:', error.message);
        }
    }

    console.log('');

    // Test 2: Webhook with detailed logging
    console.log('🧪 Test 2: Webhook Email Test with Detailed Logging');
    const testData = {
        formId: 'debug-webhook-' + Date.now(),
        status: 'completed',
        amount: 75,
        currency: 'ILS',
        customerInfo: {
            name: 'Debug Webhook',
            email: 'debug@webhook.com'
        },
        items: []
    };

    console.log('📦 Test Data:', JSON.stringify(testData, null, 2));
    console.log('');

    try {
        // Send webhook to production backend
        console.log('📤 Sending debug webhook to production...');
        const webhookUrl = `${process.env.BACKEND_URL}/api/greeninvoice/webhook`;
        console.log('Webhook URL:', webhookUrl);

        const response = await axios.post(webhookUrl, testData, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Email-Debug-Test/1.0'
            },
            timeout: 30000
        });

        console.log('✅ Webhook sent successfully!');
        console.log('Response:', response.data);

        // Wait for processing
        console.log('⏳ Waiting 15 seconds for email processing...');
        await new Promise(resolve => setTimeout(resolve, 15000));

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

                // Additional debugging info
                console.log('🔍 Debug Info:');
                console.log('- Order status:', newOrder.status);
                console.log('- Customer email:', newOrder.customerInfo?.email);
                console.log('- Items count:', newOrder.items?.length || 0);

            } else {
                console.log('❌ Order not found on Render');
            }
        } catch (error) {
            console.log('❌ Failed to check orders:', error.message);
        }

    } catch (error) {
        console.error('❌ Debug webhook test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    console.log('');
    console.log('🔍 Email Debug Test Complete');
    console.log('');
    console.log('📋 Troubleshooting Steps:');
    console.log('1. Check your email inbox and spam folder');
    console.log('2. Verify Gmail App Password is correct');
    console.log('3. Check if 2-Step Verification is enabled');
    console.log('4. Look for any email delivery errors in Gmail');
}

// Run the test
testEmailDebug().catch(console.error);
