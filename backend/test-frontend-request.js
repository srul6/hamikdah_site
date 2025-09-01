const axios = require('axios');

// Simulate the frontend request
async function testFrontendRequest() {
    try {
        console.log('=== Testing Frontend Request ===\n');

        // Simulate the data that frontend would send
        const requestData = {
            items: [
                {
                    name_he: 'מוצר בדיקה',
                    price: 100,
                    quantity: 1
                }
            ],
            totalAmount: 100,
            currency: 'ILS',
            customerInfo: {
                name: 'ישראל מנור',
                email: 'test@example.com',
                phone: '050-1234567',
                address: 'רחוב הרצל 1',
                city: 'תל אביב',
                zip: '12345'
            }
        };

        console.log('Sending request data:', JSON.stringify(requestData, null, 2));

        const response = await axios.post('http://localhost:5001/api/greeninvoice/payment-form', requestData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('\n✅ Success Response:');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('\n❌ Error Response:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

// Run the test
testFrontendRequest();
