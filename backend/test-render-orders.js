const axios = require('axios');

async function testRenderOrders() {
    try {
        console.log('=== Testing Render Orders Endpoint ===\n');

        const renderUrl = 'https://hamikdah-site.onrender.com/api/orders';

        console.log('Checking orders from:', renderUrl);

        const response = await axios.get(renderUrl, {
            timeout: 10000
        });

        console.log('✅ Render Orders Response:');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));

        if (response.data.orders && response.data.orders.length > 0) {
            console.log('\n🎉 Found orders on Render!');
            console.log('Total orders:', response.data.totalOrders);
        } else {
            console.log('\n📝 No orders found on Render yet.');
            console.log('This is normal if no real payments have been completed.');
        }

    } catch (error) {
        console.log('\n❌ Render Orders Error:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }

        console.log('\n💡 This might mean:');
        console.log('1. Your Render deployment is not running');
        console.log('2. The orders endpoint is not accessible');
        console.log('3. Network connectivity issues');
    }
}

testRenderOrders();
