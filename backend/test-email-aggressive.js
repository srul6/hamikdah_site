require('dotenv').config();
const axios = require('axios');

async function testEmailAggressive() {
    console.log('🚨 AGGRESSIVE Email Service Debug Test...\n');

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

    // Test 1: Check if debug endpoint is working
    console.log('🧪 Test 1: Debug Endpoint Check');
    try {
        const debugUrl = `${process.env.BACKEND_URL}/api/debug/env-check`;
        console.log('Testing URL:', debugUrl);

        const response = await axios.get(debugUrl, { timeout: 30000 });
        console.log('✅ Debug endpoint working:', response.data);

    } catch (error) {
        console.log('❌ Debug endpoint failed:', error.message);
    }

    console.log('');

    // Test 2: Test email endpoint directly
    console.log('🧪 Test 2: Direct Email Endpoint Test');
    try {
        const emailUrl = `${process.env.BACKEND_URL}/api/debug/email-test`;
        console.log('Testing URL:', emailUrl);

        const response = await axios.post(emailUrl, {
            formId: 'aggressive-direct-' + Date.now(),
            status: 'completed',
            amount: 200,
            currency: 'ILS',
            customerInfo: {
                name: 'Aggressive Test',
                email: 'aggressive@test.com'
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
            if (error.response) {
                console.log('Response status:', error.response.status);
                console.log('Response data:', error.response.data);
            }
        }
    }

    console.log('');

    // Test 3: Webhook with minimal data
    console.log('🧪 Test 3: Minimal Webhook Test');
    const minimalData = {
        formId: 'aggressive-minimal-' + Date.now(),
        status: 'success', // Try different status
        amount: 50,
        currency: 'ILS'
        // No customerInfo, no items - test edge case
    };

    console.log('📦 Minimal Test Data:', JSON.stringify(minimalData, null, 2));
    console.log('');

    try {
        console.log('📤 Sending minimal webhook...');
        const webhookUrl = `${process.env.BACKEND_URL}/api/greeninvoice/webhook`;

        const response = await axios.post(webhookUrl, minimalData, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Aggressive-Email-Test/1.0'
            },
            timeout: 30000
        });

        console.log('✅ Minimal webhook sent successfully!');
        console.log('Response:', response.data);

        // Wait for processing
        console.log('⏳ Waiting 20 seconds for email processing...');
        await new Promise(resolve => setTimeout(resolve, 20000));

        // Check if order was stored
        console.log('🔍 Checking if order was stored...');
        try {
            const ordersResponse = await axios.get(`${process.env.BACKEND_URL}/api/orders`);
            console.log('Total orders on Render:', ordersResponse.data.totalOrders);

            const newOrder = ordersResponse.data.orders.find(order => order.formId === minimalData.formId);
            if (newOrder) {
                console.log('✅ Order found on Render!');
                console.log('Order details:', JSON.stringify(newOrder, null, 2));

                console.log('📧 Email should have been sent for this order');
                console.log('💡 Check your email inbox for the notification');
                console.log('📧 Subject should be: New Order SUCCESS - Form ID: ' + minimalData.formId);

            } else {
                console.log('❌ Order not found on Render');
            }
        } catch (error) {
            console.log('❌ Failed to check orders:', error.message);
        }

    } catch (error) {
        console.error('❌ Minimal webhook test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    console.log('');
    console.log('🚨 AGGRESSIVE Email Debug Test Complete');
    console.log('');
    console.log('📋 CRITICAL TROUBLESHOOTING:');
    console.log('1. Check your email inbox and spam folder RIGHT NOW');
    console.log('2. Verify Gmail App Password is EXACTLY 16 characters');
    console.log('3. Check if 2-Step Verification is enabled on Google Account');
    console.log('4. Look for any email delivery errors in Gmail');
    console.log('5. Check Render logs for email service errors');
    console.log('');
    console.log('🔍 If still no email, the issue is:');
    console.log('- Gmail App Password incorrect');
    console.log('- 2-Step Verification not enabled');
    console.log('- Gmail blocking automated emails');
    console.log('- Email service crashing silently');
}

// Run the test
testEmailAggressive().catch(console.error);
