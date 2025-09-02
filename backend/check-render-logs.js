require('dotenv').config();
const axios = require('axios');

async function checkRenderLogs() {
    console.log('🔍 Checking Render Logs for Email Service Errors...\n');

    // Check environment variables
    console.log('📋 Environment Variables Check:');
    console.log('BACKEND_URL:', process.env.BACKEND_URL || '❌ NOT SET');
    console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL ? '✅ SET (' + process.env.ADMIN_EMAIL.length + ' chars)' : '❌ NOT SET');
    console.log('ADMIN_EMAIL_PASSWORD:', process.env.ADMIN_EMAIL_PASSWORD ? '✅ SET (' + process.env.ADMIN_EMAIL_PASSWORD.length + ' chars)' : '❌ NOT SET');
    console.log('');

    if (!process.env.BACKEND_URL) {
        console.log('❌ BACKEND_URL not set - cannot check logs');
        return;
    }

    // Test 1: Check if we can access the service
    console.log('🧪 Test 1: Service Accessibility Check');
    try {
        const response = await axios.get(process.env.BACKEND_URL, { timeout: 10000 });
        console.log('✅ Service is accessible');
        console.log('Response status:', response.status);
    } catch (error) {
        console.log('❌ Service accessibility issue:', error.message);
    }

    console.log('');

    // Test 2: Check recent orders to see if webhooks are being processed
    console.log('🧪 Test 2: Recent Orders Check');
    try {
        const ordersResponse = await axios.get(`${process.env.BACKEND_URL}/api/orders`, { timeout: 10000 });
        console.log('✅ Orders endpoint accessible');
        console.log('Total orders:', ordersResponse.data.totalOrders);

        if (ordersResponse.data.orders && ordersResponse.data.orders.length > 0) {
            console.log('📋 Recent orders:');
            ordersResponse.data.orders.slice(-3).forEach((order, index) => {
                console.log(`${index + 1}. ${order.formId} - ${order.status} - ${order.amount} ${order.currency}`);
                console.log(`   Customer: ${order.customerInfo?.name || 'N/A'} (${order.customerInfo?.email || 'N/A'})`);
                console.log(`   Received: ${order.receivedAt || 'N/A'}`);
                console.log('');
            });
        }

    } catch (error) {
        console.log('❌ Orders endpoint failed:', error.message);
    }

    console.log('');

    // Test 3: Check environment variables in production
    console.log('🧪 Test 3: Production Environment Check');
    try {
        const envResponse = await axios.get(`${process.env.BACKEND_URL}/api/debug/env-check`, { timeout: 10000 });
        console.log('✅ Environment check successful');
        console.log('Production environment:', envResponse.data.environment);

        // Check email-specific variables
        const env = envResponse.data.environment;
        console.log('');
        console.log('📧 Email Configuration in Production:');
        console.log('- ADMIN_EMAIL:', env.ADMIN_EMAIL);
        console.log('- ADMIN_EMAIL_PASSWORD:', env.ADMIN_EMAIL_PASSWORD);
        console.log('- SMTP_HOST:', env.SMTP_HOST);
        console.log('- SMTP_PORT:', env.SMTP_PORT);
        console.log('- NODE_ENV:', env.NODE_ENV);

    } catch (error) {
        console.log('❌ Environment check failed:', error.message);
    }

    console.log('');
    console.log('🔍 Render Logs Check Complete');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Go to https://dashboard.render.com');
    console.log('2. Click on your "hamikdah-site" service');
    console.log('3. Click on "Logs" tab');
    console.log('4. Look for recent logs around the test times');
    console.log('5. Search for "email", "nodemailer", "SMTP" errors');
    console.log('');
    console.log('🔍 Common Email Errors to Look For:');
    console.log('- "Invalid login" or "Authentication failed"');
    console.log('- "SMTP connection failed"');
    console.log('- "Email service not configured"');
    console.log('- "Failed to send order notification email"');
}

// Run the check
checkRenderLogs().catch(console.error);
