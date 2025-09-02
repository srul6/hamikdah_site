require('dotenv').config();
const axios = require('axios');

async function testProductionEmail() {
    console.log('🧪 Testing Production Email Service...\n');
    
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

    // Test the email service endpoint directly
    console.log('📧 Testing Production Email Service...');
    
    const testData = {
        formId: 'email-test-' + Date.now(),
        status: 'completed',
        documentId: 'doc-email-test',
        paymentId: 'pay-email-test',
        amount: 100.00,
        currency: 'ILS',
        customerInfo: {
            name: 'Test User',
            email: 'test@example.com',
            phone: '050-0000000',
            street: 'Test Street',
            houseNumber: '1',
            city: 'Test City'
        },
        items: [
            {
                name_he: 'פריט בדיקה',
                name_en: 'Test Item',
                quantity: 1,
                price: 100.00
            }
        ],
        purchaseTimestamp: new Date().toISOString(),
        dedication: 'Test dedication'
    };

    try {
        // First, check if there's a direct email endpoint
        console.log('🔍 Checking for direct email endpoint...');
        const emailUrl = `${process.env.BACKEND_URL}/api/test-email`;
        
        const response = await axios.post(emailUrl, testData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log('✅ Direct email test successful!');
        console.log('Response:', response.data);
        
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log('ℹ️  No direct email endpoint found - this is normal');
        } else {
            console.log('❌ Direct email test failed:', error.message);
        }
    }

    // Now test by triggering a webhook (which should send email)
    console.log('\n📤 Testing email via webhook trigger...');
    
    try {
        const webhookUrl = `${process.env.BACKEND_URL}/api/greeninvoice/webhook`;
        console.log('Webhook URL:', webhookUrl);
        
        const response = await axios.post(webhookUrl, testData, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Email-Test/1.0'
            },
            timeout: 30000
        });

        console.log('✅ Webhook triggered successfully!');
        console.log('Response:', response.data);
        
        // Wait for email processing
        console.log('⏳ Waiting 5 seconds for email processing...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('📧 Email should have been sent by now');
        console.log('💡 Check your email inbox for the notification');
        
    } catch (error) {
        console.error('❌ Webhook email test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    console.log('');
    console.log('🔍 Production Email Test Complete');
}

// Run the test
testProductionEmail().catch(console.error);
