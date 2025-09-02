const axios = require('axios');

// Simulate a webhook call from Green Invoice
async function testWebhook() {
    try {
        console.log('=== Testing Webhook Functionality ===\n');

        // Simulate webhook data that Green Invoice would send
        const webhookData = {
            formId: 'test-form-123',
            status: 'approved',
            documentId: 'doc-456',
            paymentId: 'pay-789',
            amount: 100,
            currency: 'ILS',
            customerInfo: {
                name: 'ישראל מנור',
                email: 'test@example.com',
                phone: '050-1234567',
                street: 'רחוב הרצל',
                houseNumber: '1',
                apartmentNumber: '5',
                floor: '3',
                city: 'תל אביב'
            },
            items: [
                {
                    name_he: 'בית כנסת',
                    name_en: 'Synagogue',
                    price: 100,
                    quantity: 1
                }
            ],
            custom: JSON.stringify({
                orderId: Date.now(),
                customerId: 'test@example.com',
                items: '1',
                dedication: 'לזכות המשפחה'
            })
        };

        console.log('Sending webhook data:', JSON.stringify(webhookData, null, 2));

        const response = await axios.post('http://localhost:5001/api/greeninvoice/webhook', webhookData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('\n✅ Webhook Response:');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('\n❌ Webhook Error:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

// Test the orders endpoint
async function testOrdersEndpoint() {
    try {
        console.log('\n=== Testing Orders Endpoint ===\n');

        const response = await axios.get('http://localhost:5001/api/orders');

        console.log('✅ Orders Response:');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('\n❌ Orders Error:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

// Run the tests
async function runTests() {
    await testWebhook();
    await testOrdersEndpoint();
}

runTests();
